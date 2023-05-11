import React from "react";
import { useRouter } from "next/router";
import SendIcon from "@mui/icons-material/Send";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { HeaderMessagesArea } from "../../components/messages-module/header";
import SystemMessage from "../../components/messages-module/system-message";
import MessagesHandler from "../../components/messages-module/scrolling-messages-block";
import MessageComponent from "../../components/messages-module";
import { UploadFiles } from "../../components/upload-files";
import { InputComponent } from "../../components/input";
import { SmilesComponent } from "../../components/smiles";
import { ApiRoutes, ErrorTexts, MessageReadStatus, MessagesNoticeTypes, MessageTypes, Pages, SocketActions } from "../../types/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { selectMessagesState, setActiveChatId, setCounter, setMessages, setScrollDownAfterNewMsg, setVisibleUnReadMessages } from "../../state/messages/slice";
import CatchErrors from "../../core/catch-errors";
import { IMessage } from "../../types/models.types";
import Request from "../../core/request";
import { handlingMessagesWithFiles, isSingleChat } from "../../common";
import Message from "../../core/message";
import { ICallSettings } from "../../types/redux.types";
import { SocketIOClient } from "../../components/socket-io-provider";
import { selectMainState, setMessageNotification } from "../../state/main/slice";

import styles from "../../styles/pages/message-area.module.scss";

export interface IFriendInfo {
    id: string;
    avatarUrl: string;
    friendName: string;
};

export interface IChatInfo {
    chatId: string;
    initiatorId: string;
    chatName: string;
    chatAvatar: string;
    chatSettings: ICallSettings;
    isSingle: boolean;
};

export default function MessageArea() {
    const [loading, setLoading] = React.useState(false);
    const [loadingSend, setLoadingSend] = React.useState(false);
    const [loadingFriendInfo, setLoadingFriendInfo] = React.useState(false);
    const [friendInfo, setFriendInfo] = React.useState<IFriendInfo | null>(null);
    const [page, setPage] = React.useState(0);
    const [isMore, setIsMore] = React.useState(false);
    const [beforeHeight, setBeforeHeight] = React.useState<number>();
    const [chatId, setChatId] = React.useState<string | null>(null);
    const [visible, setVisible] = React.useState(false);
    const [processedMessages, setProcessedMessages] = React.useState<React.ReactElement[]>([]);
    const [scrollOnDown, setScrollOnDown] = React.useState(false);
    const [upperDate, setUpperDate] = React.useState<{ text: string; left: number; top: number; } | null>(null);
    const [visabilityUpperDate, setVisabilityUpperDate] = React.useState(1);
    const [visabilityInput, setVisabilityInput] = React.useState(true);
    const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");

    const socket = React.useContext(SocketIOClient);
    let loadMoreMessages = false;

    const router = useRouter();
    const dispatch = useAppDispatch();

    const { messageNotification } = useAppSelector(selectMainState);
    const { messages, counter, visibleUnReadMessages, isWrite, scrollDownAfterNewMsg } = useAppSelector(selectMessagesState);
    const { user } = useAppSelector(selectUserState);

    const inputRef = React.useRef<HTMLDivElement>(null);
    const messagesRef = React.useRef<HTMLDivElement>(null);

    let timerVisibleUpperDate: NodeJS.Timer | null = null;
    let counterUnreadCalls = 1;
    const deleteUnReadIds = new Set<string>();

    // 1) Запоминаем id чата
    // 2) Очищаем все сайд эффекты
    React.useEffect(() => {
        const id = router.query && router.query.id
            ? router.query.id as string
            : window.location.pathname
                ? window.location.pathname.replace("/messages/", "")
                : null;

        setChatId(id);
        dispatch(setActiveChatId(id));

        return () => {
            if (messagesRef.current) messagesRef.current.removeEventListener("scroll", scrollHandler);
            if (visibleUnReadMessages) dispatch(setVisibleUnReadMessages(""));
            dispatch(setMessages({ messages: [] }));

            timerVisibleUpperDate = null;
            counterUnreadCalls = 1;
            deleteUnReadIds.clear();
        }
    }, []);

    // Сохраняем информацию об участнике(-ах) чата
    React.useEffect(() => {
        if (chatId && user) {
            // Если чат - одиночный
            if (isSingleChat(chatId)) {
                if (router.query && router.query.friendId) {
                    const { friendId, friendAvatarUrl, friendName } = router.query;
                    setFriendInfo({ id: friendId, avatarUrl: friendAvatarUrl, friendName } as IFriendInfo);
                } else {
                    Request.post(ApiRoutes.getFriendInfo, { chatId, userId: user.id }, setLoadingFriendInfo,
                        (data: { success: boolean, friendInfo: IFriendInfo | null }) => setFriendInfo(data.friendInfo),
                        (error: any) => {
                            if (error.response.data.message === ErrorTexts.NOT_TEMP_CHAT_ID) {
                                router.replace(Pages.messages);
                            } else {
                                CatchErrors.catch(error, router, dispatch);
                            }
                        }
                    );
                }
            } else {
                // Если чат - групповой
                console.log("--Чат - групповой--")
            }
        }
    }, [chatId, user]);

    // Подгружаем сообщения чата
    React.useEffect(() => {
        getMessages();
    }, [user, chatId]);

    // Обрабатываем сообщения 
    React.useEffect(() => {
        // Добавляем обработчик на скролл страницы
        if (messagesRef.current) messagesRef.current.addEventListener("scroll", scrollHandler);

        if (messages && messages.length && user && friendInfo) {
            // Обрабатываем сообщения с файлами
            const handlingMessages = handlingMessagesWithFiles(messages);

            const procMessages = handlingMessages.reduce((acc, message, index) => {
                // Определяем является ли сообщение первым или последним от одного пользователя
                const visibleParams = checkIsFirstOrLast(
                    message,
                    index - 1 >= 0 ? handlingMessages[index - 1] : null,
                    index + 1 <= handlingMessages.length ? handlingMessages[index + 1] : null
                );
                // Флаг, сигнализирует нам о существовании сообщения с типом "Дата"
                let hasDateMessage = false;

                // Проверка на создание системного сообщения "Дата"
                if (index === 0 || (index - 1 >= 0 && getDate(handlingMessages[index - 1].createDate) !== getDate(message.createDate))) {
                    hasDateMessage = true;
                    acc.push(<SystemMessage key={message.id + "__date-system-message"} date={message.createDate} />);
                }

                // Показ системного сообщения "Непрочитанные сообщения"
                if (
                    (typeof visibleUnReadMessages === "string" && visibleUnReadMessages === message.id && visible) ||
                    typeof visibleUnReadMessages === "object" && visibleUnReadMessages.unreadMessages && visibleUnReadMessages.messageId === message.id
                ) {
                    acc.push(<SystemMessage key={message.id + "__unread-system-message"} deleteMarginTop={hasDateMessage} />);
                }

                acc.push(<MessageComponent
                    key={message.id}
                    user={user}
                    message={message}
                    friendInfo={friendInfo}
                    visibleParams={visibleParams}
                />);

                return acc;
            }, [] as React.ReactElement[]);

            if (procMessages && procMessages.length) {
                setProcessedMessages(procMessages);
            }
        }
    }, [messages, user, friendInfo, visibleUnReadMessages]);

    // Работы со счетчиком непрочитанных сообщений в меню
    React.useEffect(() => {
        // Если непрочитанных сообщений нет, то обнуляем счетчик непрочитанных сообщений в меню
        if (messages && messages.length && !counter && chatId) {
            dispatch(setMessageNotification({ type: MessagesNoticeTypes.REMOVE, chatId }));
        }
        // Если непрочитанные сообщения появляются при скролле, то добавляем счетчик непрочитанных сообщений в меню
        if (messages && messages.length && counter && chatId && visible && !messageNotification.includes(chatId)) {
            dispatch(setMessageNotification({ type: MessagesNoticeTypes.ADD, chatId }));
        }
    }, [messages, counter, chatId]);

    // Обнуляем счетчик непрочитанных сообщений в якоре
    React.useEffect(() => {
        if (!visible && counter) {
            dispatch(setCounter(0));
        }
    }, [visible]);

    // Если пришло новое сообщение и у нас не было скролла (до счетчика непрочитанных) - то мы скроллим в низ, чтобы показать эти новые сообщения
    React.useEffect(() => {
        if (scrollDownAfterNewMsg && !visible) {
            onScrollDown();
            dispatch(setScrollDownAfterNewMsg(false));
            if (visibleUnReadMessages) dispatch(setVisibleUnReadMessages(""));
        }
    }, [scrollDownAfterNewMsg, visible, visibleUnReadMessages]);

    // Получение сообщений
    const getMessages = (search = "") => {
        if (user && chatId) {
            dispatch(setMessages({ messages: [] }));
            setPage(0);
            deleteUnReadIds.clear();

            Request.post(ApiRoutes.getMessages, { chatId, page: 0, userId: user.id, search }, setLoading,
                (data: { success: boolean, messages: IMessage[], isMore: boolean }) => {
                    dispatch(setMessages({ messages: data.messages, userId: user.id }));
                    setIsMore(data.isMore);
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    };

    // Обработчик на скролл компонента
    const scrollHandler = () => {
        if (messagesRef.current) {
            const refCurrentTop = messagesRef.current.getBoundingClientRect().top;
            const clientHeight = messagesRef.current.clientHeight;

            const elem = document.getElementById("end-messages");

            // Показываем/скрываем кнопку "Вниз"
            if (elem) {
                const elemTop = elem.getBoundingClientRect().top;

                if (elemTop - refCurrentTop - clientHeight > 200) {
                    setVisible(true);
                    setScrollOnDown(false);
                } else if (elemTop - refCurrentTop - clientHeight === 0) {
                    setScrollOnDown(true);
                } else {
                    setVisible(false);
                    dispatch(setCounter(0));
                    setScrollOnDown(false);
                }
            }

            // Находим и показываем всплывающее окно с датой
            const refCurrentLeft = messagesRef.current.getBoundingClientRect().left;
            const refCurrentWidth = messagesRef.current.clientWidth;
            const node = document.elementFromPoint(refCurrentLeft + 11, refCurrentTop + 30) as HTMLElement;
            // Получаем из дата-атрибутов дату сообщения
            const messageDate = node.dataset.messageDate;

            if (node && messageDate) {
                setUpperDate({
                    text: messageDate,
                    left: refCurrentLeft + refCurrentWidth / 2,
                    top: refCurrentTop + 5,
                });
                setVisabilityUpperDate(1);

                if (timerVisibleUpperDate) {
                    clearTimeout(timerVisibleUpperDate);
                    timerVisibleUpperDate = null;
                }

                timerVisibleUpperDate = setTimeout(() => {
                    setVisabilityUpperDate(0);
                }, 2000);
            }
            if (node && node.classList.contains("system-message-container")) {
                setUpperDate(null);
            }

            // Находим элемент, который необходимо прочитать
            const nodeUnRead = document.elementFromPoint(refCurrentLeft + 11, refCurrentTop + clientHeight - 1) as HTMLElement;
            const messageId = getMessageId(nodeUnRead);

            // Если такое сообщение не было прочтено -> читаем его (сеттер используется для предотвращения повторного запроса на чтение)
            if (messageId && !deleteUnReadIds.has(messageId)) {
                deleteUnReadIds.add(messageId);
                readOneMessage(messageId);
            }
        }
    };

    // Получение id сообщения, которое только что прочитали при прокрутке диалога
    const getMessageId = (node: HTMLElement | null): string | null => {
        if (!node || !node.dataset) {
            return null;
        }
        if (node.dataset.messageId) {
            return node.dataset.messageId;
        }

        return getMessageId(node.parentNode as HTMLElement);
    };

    // Проверка на первый/последний элемент для сообщения в блоке (показ имени, аватара)
    const checkIsFirstOrLast = (message: IMessage, prevMessage: IMessage | null, postMessage: IMessage | null) => {
        let isFirst = false;
        let isLast = false;

        // Если нет предыдущего сообщения - значит оно первое (показываем имя) или
        // Если есть следующее сообщение и авторы текущего и предыдущего сообщений разные - значит оно первое (показываем имя)
        if (!prevMessage || prevMessage && prevMessage.userId !== message.userId) {
            isFirst = true;
        }

        // Если нет последующего сообщения - значит оно последнее (показываем имя) или
        // Если есть следующее сообщение и авторы текущего и предыдущего сообщений разные - значит оно первое (показываем имя)
        if (!postMessage || postMessage && postMessage.userId !== message.userId) {
            isLast = true;
        }

        return { isFirst, isLast };
    };

    // Получение даты
    const getDate = (date: string) => date && date.length ? new Date(date).getDate() : null;

    // Скролл до самого низа
    const onScrollDown = (isSmoothScroll = false) => {
        if (messagesRef.current) {
            messagesRef.current.style.scrollBehavior = isSmoothScroll ? "smooth" : "auto";
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight + 20;

            if (counter) {
                dispatch(setCounter(0));
            }
        }
    };

    // Обработка клика на кнопку
    const onSubmit = (messageProps: { type: MessageTypes, files?: File[] } | null = null) => {
        if (!user) {
            CatchErrors.catch("Ошибка в подгрузке Вашего уникального идентификатора, пожалуйста обновите страницу", router, dispatch);
        }

        if (!chatId) {
            CatchErrors.catch("Ошибка в подгрузке уникального идентификатора чата, пожалуйста обновите страницу", router, dispatch);
        }

        if (((inputRef.current && inputRef.current.textContent) || (messageProps && messageProps.files)) &&
            inputRef.current && socket && user && chatId && friendInfo
        ) {
            const preparedValue = inputRef.current.textContent
                ? inputRef.current.textContent.replace(/\`\'/g, "\"")
                : "";

            // Очищаем инпут и ставим на него фокус
            inputRef.current.textContent = "";
            inputRef.current.focus();

            // Обнуляем глобальный флаг "Непрочитанные сообщения"
            if (visibleUnReadMessages) dispatch(setVisibleUnReadMessages(""));

            // Тип сообщения
            const type = messageProps && messageProps.type ? messageProps.type : MessageTypes.MESSAGE;
            // Состояние сообщения без прикрепленных файлов и голосовых сообщений
            const initialMessage = {
                userId: user.id,
                chatId,
                type,
                message: preparedValue,
                isRead: MessageReadStatus.NOT_READ
            } as IMessage;

            switch (type) {
                case MessageTypes.MESSAGE: {
                    // Объект сообщения
                    const messageInstance = new Message({
                        newMessage: initialMessage,
                        friendInfo,
                        router,
                        socket,
                        dispatch
                    });

                    // Добавляем текстовое сообщение в массив сообщений для отрисовки
                    messageInstance.addMessageToStore();

                    // Отправка на сокет
                    messageInstance.sendBySocket();

                    // Сохраняем сообщение в таблицу Messages
                    messageInstance.saveInMessages();
                    break;
                }

                case MessageTypes.WITH_FILE:
                case MessageTypes.FEW_FILES: {
                    if (messageProps && messageProps.files) {
                        // Объект сообщения
                        const messageInstance = new Message({
                            newMessage: {
                                ...initialMessage,
                                files: messageProps.files
                            },
                            friendInfo,
                            router,
                            socket,
                            dispatch
                        });

                        // Сохраняем файлы в файловой системе и в таблице Files
                        messageInstance.saveInFiles(messageProps.files, setLoadingSend);
                    }

                    break;
                }

                default:
                    break;
            }
        }
    };

    // Обновляем значение в текстовом поле
    const setCurrentValueRef = (newValue: string, cb?: (oldValue: string) => void) => {
        if (inputRef.current) {
            if (cb) {
                cb(inputRef.current.textContent ?? "");
            }

            inputRef.current.textContent = newValue;
        }
    };

    // Обработка скролла - загружаем еще сообщения
    const onWheel = () => {
        if (messagesRef.current && messagesRef.current.scrollTop < 150 && !loadMoreMessages && user && friendInfo && isMore) {
            loadMoreMessages = true;
            const offset = messagesRef.current.scrollTop;
            const currentPage = page + 1;
            let before = messagesRef.current.scrollHeight;

            Request.post(ApiRoutes.getMessages, { chatId, page: currentPage, userId: user.id, loadMore: true, search: debouncedSearchValue }, undefined,
                (data: { success: boolean, messages: IMessage[], isMore: boolean }) => {
                    dispatch(setMessages({ messages: data.messages, userId: user.id }));
                    setIsMore(data.isMore);
                    if (!data.isMore) {
                        const loadingIsMore = document.getElementById("loading-more-messages");
                        if (loadingIsMore) before -= loadingIsMore.clientHeight;
                    }
                    setBeforeHeight(before - offset);
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );

            setPage(currentPage);
            loadMoreMessages = false;
        }
    };

    // Отправка на сокет и в БД изменение статуса прочитанности сообщений
    const read = (unreadMessages: IMessage[], userId: string) => {
        // Отправляем по сокету уведомление о смене статуса прочитанности сообщений
        if (socket) {
            socket.emit(SocketActions.CHANGE_READ_STATUS, { isRead: MessageReadStatus.READ, messages: unreadMessages });
        }

        // Изменяем статусы прочитанности у сообщений в БД
        Request.post(
            ApiRoutes.readMessage,
            { ids: unreadMessages.map(unreadMessage => unreadMessage.id), userId },
            undefined,
            undefined,
            (error: any) => CatchErrors.catch(error, router, dispatch)
        );
    };

    // Читаем одно сообщение
    const readOneMessage = (messageId: string) => {
        if (messages && messages.length && user) {
            // Находим непрочитанное сообщение, у которого автор не я
            const unReadMessage = messages.find(message => !message.isRead && message.id.toLowerCase() === messageId.toLowerCase() && message.userId !== user.id);

            if (unReadMessage) {
                let unreadMessages = [unReadMessage];
                const indexOf = messages.indexOf(unReadMessage);

                // Находим сообщения, которые находятся выше текущего читаемого сообщения
                // То есть рассматриваем случай, когда непрочитанных сообщений очень много и в конце прокрутки читается 8 сообщений, а над ним еще 7 непрочитанных сообщений (ПРИМЕР)
                if (indexOf >= 0) {
                    const unReadMessagesMore = messages.slice(0, indexOf).filter(message => !message.isRead && message.userId !== user.id);

                    if (unReadMessagesMore && unReadMessagesMore.length) {
                        unreadMessages = [...unreadMessages, ...unReadMessagesMore];

                        unReadMessagesMore.forEach(unreadMessage => {
                            deleteUnReadIds.add(unreadMessage.id);
                        });
                    }
                }

                dispatch(setCounter(counterUnreadCalls === 1 ? deleteUnReadIds.size : 1));
                counterUnreadCalls += 1;

                read(unreadMessages, user.id);
            }
        }
    };

    // Читаем все сообщения
    const readAllMessages = () => {
        if (messages && messages.length && user) {
            // Находим все непрочитанные сообщения, у которых автор не я
            const unreadMessages = messages.filter(message => !message.isRead && message.userId !== user.id);

            if (unreadMessages && unreadMessages.length && chatId) {
                dispatch(setMessageNotification({ type: MessagesNoticeTypes.REMOVE, chatId }));
                read(unreadMessages, user.id);
            }
        }
    };

    return <div className={styles["message-area-container"]}>
        {/* Header */}
        <HeaderMessagesArea
            friendInfo={friendInfo}
            loadingFriendInfo={loadingFriendInfo}
            chatId={chatId}
            counter={counter}
            getMessages={getMessages}
            setVisabilityInput={setVisabilityInput}
            setDebouncedSearchValue={setDebouncedSearchValue}
        />

        {/* Список сообщений */}
        <div className={styles["message-area-container--messages"]}>
            <div className={styles["message-area-container--messages-scrollable"]} ref={messagesRef} onWheel={onWheel}>
                {/* Показ даты текущего сообщения при скролле */}
                {upperDate
                    ? <div
                        className={styles["message-area-container--upper-date-block"]}
                        style={{ left: upperDate.left, top: upperDate.top, opacity: visabilityUpperDate }}
                    >
                        {upperDate.text}
                    </div>
                    : null
                }

                {loading || !user
                    ? <div className={styles["message-area-container--loading"]}><CircularProgress /></div>
                    : processedMessages && processedMessages.length && friendInfo
                        ? <div className={styles["message-area-container--messages-wrapper"]}>
                            {isMore
                                ? <div id="loading-more-messages" className={styles["message-area-container--loading-is-more"]}>
                                    <CircularProgress size={30} />
                                </div>
                                : null
                            }

                            <MessagesHandler
                                messages={processedMessages}
                                messagesRef={messagesRef}
                                beforeHeight={beforeHeight}
                                user={user}
                                scrollOnDown={scrollOnDown}
                                onScrollDown={onScrollDown}
                                readAll={readAllMessages}
                                setBeforeHeight={setBeforeHeight}
                            />

                            <div id="end-messages" />
                        </div>
                        : <div className={styles["message-area-container--no-history"]}>История диалогов пуста</div>
                }
            </div>

            {isWrite && friendInfo
                ? <div className={styles["message-area-container--is-write"]}>
                    {friendInfo.friendName} набирает сообщение...
                </div>
                : null
            }
        </div>

        {/* Отправка */}
        {visabilityInput
            ? <form noValidate autoComplete="off" className={styles["messages--submit-block"]}>
                {/* Якорь вниз + счётчик только что пришедших сообщений */}
                {visible
                    ? <div className={styles["message-area-container--anchor"]} onClick={_ => onScrollDown(true)}>
                        {counter
                            ? <span className={styles["message-area-container--anchor-counter"]}>{counter}</span>
                            : null
                        }
                        <ArrowDownwardIcon className={styles["message-area-container--anchor-icon"]} />
                    </div>
                    : null
                }

                <div className={styles["messages-container--search-field-wrapper"]}>
                    {/* Выбор смайлика */}
                    <SmilesComponent ref={inputRef} />

                    {/* Текстовое поле для отправки сообщения */}
                    <InputComponent
                        ref={inputRef}
                        friendInfo={friendInfo}
                        chatId={chatId}
                        onSubmit={onSubmit}
                    />

                    {/* Прикрепление файлов + модальное окно с файлами */}
                    <UploadFiles
                        className={`${styles["messages-container--search-field-icon"]} ${styles["attach-file"]}`}
                        friendInfo={friendInfo}
                        chatId={chatId}
                        onSubmit={onSubmit}
                        setCurrentValueRef={setCurrentValueRef}
                    />
                </div>

                <Tooltip title="Отправить сообщение" placement="top">
                    <div className={styles["messages-container--search-icon"]} onClick={_ => onSubmit()}>
                        {loadingSend
                            ? <CircularProgress size={30} />
                            : <SendIcon />
                        }
                    </div>
                </Tooltip>
            </form>
            : null
        }
    </div>
};