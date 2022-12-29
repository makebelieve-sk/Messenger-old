import React from "react";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
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
import { ApiRoutes, ErrorTexts, MessageReadStatus, MessageTypes, Pages } from "../../types/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { selectMessagesState, setCounter, setMessages, setVisibleUnReadMessages } from "../../state/messages/slice";
import CatchErrors from "../../core/catch-errors";
import { IMessage } from "../../types/models.types";
import Request from "../../core/request";
import { handlingMessagesWithFiles, isSingleChat } from "../../common";
import Message from "../../core/message";
import { ICallSettings } from "../../types/redux.types";
import { SocketIOClient } from "../../components/socket-io-provider";

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

    const socket = React.useContext(SocketIOClient);

    const router = useRouter();
    const dispatch = useAppDispatch();

    const { messages, counter, visibleUnReadMessages, isWrite } = useAppSelector(selectMessagesState);
    const { user } = useAppSelector(selectUserState);

    const inputRef = React.useRef<HTMLDivElement>(null);
    const messagesRef = React.useRef<HTMLDivElement>(null);

    let timerVisibleUpperDate: NodeJS.Timer | null = null;

    // Запоминаем id чата
    React.useEffect(() => {
        const id = router.query && router.query.id
            ? router.query.id as string
            : window.location.pathname
                ? window.location.pathname.replace("/messages/", "")
                : null;

        setChatId(id);
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
        if (user && friendInfo) {
            dispatch(setMessages([]));

            Request.post(ApiRoutes.getMessages, { chatId, page }, setLoading,
                (data: { success: boolean, messages: IMessage[], isMore: boolean }) => {
                    dispatch(setMessages(data.messages));
                    setIsMore(data.isMore);
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user, friendInfo]);

    // Обрабатываем сообщения 
    React.useEffect(() => {
        if (messages && messages.length) {
            if (user && friendInfo) {
                // Обрабатываем сообщения с файлами
                const handlingMessages = handlingMessagesWithFiles(messages);

                const procMessages = handlingMessages.reduce((acc, message, index) => {
                    const visibleParams = checkIsFirstOrLast(
                        message,
                        index - 1 >= 0 ? handlingMessages[index - 1] : null,
                        index + 1 <= handlingMessages.length ? handlingMessages[index + 1] : null
                    );

                    // Проверка на создание системного сообщения "Дата"
                    if (index === 0 || (index - 1 >= 0 && getDate(handlingMessages[index - 1].createDate) !== getDate(message.createDate))) {
                        acc.push(<SystemMessage key={uuid()} date={message.createDate} />);
                    }

                    // Показ системного сообщения "Непрочитанные сообщения"
                    if (visibleUnReadMessages === message.id && visible) {
                        acc.push(<SystemMessage key={message.id + "-unread-message"} />);
                    }

                    acc.push(<MessageComponent
                        key={uuid()}
                        user={user}
                        message={message}
                        friendInfo={friendInfo}
                        visibleParams={visibleParams}
                    />);

                    return acc;
                }, [] as React.ReactElement[]);

                setProcessedMessages(procMessages);
            }
        }
    }, [messages]);

    // Если пришло новое сообщение и у нас не было скролла (до счетчика непрочитанных) - то мы скроллим в низ, чтобы показать эти новые сообщения
    React.useEffect(() => {
        if (processedMessages && processedMessages.length && !visible) {
            onScrollDown();
        }
    }, [processedMessages]);

    // Обнуляем счетчик непрочитанных сообщений в якоре
    React.useEffect(() => {
        if (!visible) {
            dispatch(setCounter(0));
        } else {
            dispatch(setVisibleUnReadMessages(""));
        }
    }, [visible]);

    // Обработка скролла (нет доступа к состоянию)
    React.useEffect(() => {
        function scrollHandler() {
            if (messagesRef.current) {
                const refCurrentTop = messagesRef.current.getBoundingClientRect().top;

                const elem = document.getElementById("end-messages");

                // Показываем/скрываем кнопку "Вниз"
                if (elem) {
                    const elemTop = elem.getBoundingClientRect().top;
                    const clientHeight = messagesRef.current.clientHeight;

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

                const refCurrentLeft = messagesRef.current.getBoundingClientRect().left;
                const refCurrentWidth = messagesRef.current.clientWidth;
                const node = document.elementFromPoint(refCurrentLeft + 11, refCurrentTop + 30);

                if (node && node.id) {
                    setUpperDate({
                        text: node.id,
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
            }
        };

        messagesRef.current?.addEventListener("scroll", scrollHandler);

        return () => {
            messagesRef.current?.removeEventListener("scroll", scrollHandler);
            dispatch(setCounter(0));
            dispatch(setVisibleUnReadMessages(""));
            timerVisibleUpperDate = null;
        }
    }, []);

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
    const getDate = (date: string) => {
        return date && date.length ? new Date(date).getDate() : null;
    };

    // Скролл до самого низа
    const onScrollDown = (isSmoothScroll = false) => {
        if (messagesRef.current) {
            messagesRef.current.style.scrollBehavior = isSmoothScroll ? "smooth" : "auto";
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;

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
            dispatch(setVisibleUnReadMessages(""));

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
        if (messagesRef.current && isMore && user && friendInfo) {
            const offset = messagesRef.current.scrollTop;

            if (offset < 150) {
                const currentPage = page + 1;
                let before = messagesRef.current.scrollHeight;

                Request.post(ApiRoutes.getMessages, { userId: user.id, chatId, page: currentPage }, undefined,
                    (data: { success: boolean, messages: IMessage[], isMore: boolean }) => {
                        dispatch(setMessages(data.messages));
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
            }
        }
    };

    return <div className={styles["message-area-container"]}>
        {/* Header */}
        <HeaderMessagesArea 
            friendInfo={friendInfo}
            loadingFriendInfo={loadingFriendInfo}
            chatId={chatId}
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
        <form noValidate autoComplete="off" className={styles["messages--submit-block"]}>
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
                    onSubmit={onSubmit}
                />

                {/* Прикрепление файлов + модальное окно с файлами */}
                <UploadFiles
                    className={`${styles["messages-container--search-field-icon"]} ${styles["attach-file"]}`}
                    friendInfo={friendInfo}
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
    </div>
};