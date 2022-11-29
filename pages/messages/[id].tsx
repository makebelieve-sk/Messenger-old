import React from "react";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import SendIcon from "@mui/icons-material/Send";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { Avatar, Button, CircularProgress, Popover, Skeleton, Tooltip, Typography } from "@mui/material";
import { SocketIOClient } from "../../components/app";
import SystemMessage from "../../components/messages-module/system-message";
import MessagesHandler from "../../components/messages-module/scrolling-messages-block";
import MessageComponent from "../../components/messages-module";
import { ApiRoutes, CallStatus, CallTypes, ErrorTexts, MessageReadStatus, MessageTypes, Pages, SocketActions } from "../../config/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { setModalVisible, setCallingUser, setStatus } from "../../state/calls/slice";
import { deleteFromTempChat, selectMessagesState, setCounter, setMessage, setMessages, setVisibleUnReadMessages } from "../../state/messages/slice";
import CatchErrors from "../../axios/catch-errors";
import { IMessage } from "../../types/models.types";
import Request from "../../common/request";
import { isSingleChat, NO_PHOTO } from "../../config";
import Message from "../../common/message";

import styles from "../../styles/pages/message-area.module.scss";

export interface IFriendInfo {
    id: string;
    avatarUrl: string;
    friendName: string;
};

export default function MessageArea() {
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [loadingFriendInfo, setLoadingFriendInfo] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [friendInfo, setFriendInfo] = React.useState<IFriendInfo | null>(null);
    const [anchorEmoji, setAnchorEmoji] = React.useState<SVGSVGElement | null>(null);
    const [anchorCall, setAnchorCall] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [page, setPage] = React.useState(0);
    const [isMore, setIsMore] = React.useState(false);
    const [beforeHeight, setBeforeHeight] = React.useState<number>();
    const [chatId, setChatId] = React.useState<string | null>(null);
    const [visible, setVisible] = React.useState(false);
    const [processedMessages, setProcessedMessages] = React.useState<React.ReactElement[]>([]);
    const [scrollOnDown, setScrollOnDown] = React.useState(false);
    const [upperDate, setUpperDate] = React.useState<{ text: string; left: number; top: number } | null>(null);

    const socket = React.useContext(SocketIOClient);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { messages, counter, visibleUnReadMessages } = useAppSelector(selectMessagesState);
    const { user } = useAppSelector(selectUserState);

    const inputRef = React.useRef<HTMLDivElement>(null);
    const messagesRef = React.useRef<HTMLDivElement>(null);

    const popoverId = Boolean(anchorEl) ? "popover-item-messages-header" : undefined;
    const emojiPopoverId = Boolean(anchorEmoji) ? "emoji-popover" : undefined;
    const popoverCallId = Boolean(anchorCall) ? "call-popover" : undefined;

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
                const procMessages = messages.reduce((acc, message, index) => {
                    const visibleParams = checkIsFirstOrLast(
                        message,
                        index - 1 >= 0 ? messages[index - 1] : null,
                        index + 1 <= messages.length ? messages[index + 1] : null
                    );

                    // Проверка на создание системного сообщения "Дата"
                    if (index === 0 || (index - 1 >= 0 && getDate(messages[index - 1].createDate) !== getDate(message.createDate))) {
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
                    setUpperDate({ text: node.id, left: refCurrentLeft + refCurrentWidth / 2, top: refCurrentTop + 5 });
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
            setAnchorEl(null);
            setAnchorEmoji(null);
            setAnchorCall(null);
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
    const onScrollDown = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;

            if (counter) {
                dispatch(setCounter(0));
            }
        }
    };

    // Обработка клика на кнопку
    const onSubmit = () => {
        if (!user) {
            setError("Возникла ошибка, пожалуйста обновите страницу");
            CatchErrors.catch("Ошибка в подгрузке Вашего уникального идентификатора, пожалуйста обновите страницу", router, dispatch);
        }

        if (!chatId) {
            setError("Возникла ошибка, пожалуйста обновите страницу");
            CatchErrors.catch("Ошибка в подгрузке уникального идентификатора чата, пожалуйста обновите страницу", router, dispatch);
        }

        if (inputRef.current && inputRef.current.textContent && socket && user && chatId && friendInfo) {
            const preparedValue = inputRef.current.textContent.replace(/\`\'/g, "\"");

            // Объект сообщения
            const message = new Message({
                userId: user.id,
                chatId,
                type: MessageTypes.MESSAGE,
                message: preparedValue,
                isRead: MessageReadStatus.NOT_READ
            }) as IMessage;

            // Очищаем инпут и ставим на него фокус
            inputRef.current.textContent = "";
            inputRef.current.focus();

            // Добавляем сообщение в массив сообщений для отрисовки
            dispatch(setMessage({ message }));

            // Обнуляем глобальный флаг "Непрочитанный сообщения"
            dispatch(setVisibleUnReadMessages(""));

            // Отправка на сокет
            socket.emit(SocketActions.MESSAGE, { data: message, friendId: friendInfo.id });

            // Сохраняем сообщение в бд
            Request.post(
                ApiRoutes.saveMessage,
                { message, isSingleChat: isSingleChat(chatId), userTo: friendInfo.id },
                () => dispatch(deleteFromTempChat(chatId)),
                undefined,
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    };

    // Обработка нажатия на Enter или Shift + Enter
    const onKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
            if (event.shiftKey) return;

            event.preventDefault();
            onSubmit();
        }
    };

    // Добавление эмодзи в текстовое сообщение
    const onEmojiClick = (emoji: EmojiClickData) => {
        if (emoji && inputRef.current) {
            inputRef.current.textContent += emoji.emoji;
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

    // Вызов модального окна для видео-разговора
    const onVideoCall = () => {
        if (friendInfo && socket && user) {
            dispatch(setModalVisible(true));
            dispatch(setCallingUser(friendInfo));
            dispatch(setStatus(CallStatus.SET_CONNECTION));

            // Отправка на сокет
            socket.emit(SocketActions.CALL, { 
                roomId: uuid(), 
                type: CallTypes.VIDEO, 
                userFrom: user, 
                users: [friendInfo], 
                isSingle: true,
                // TODO
                // Запоминать в глобальном состоянии имя чата (личное или название беседы)
                chatName: user.firstName + " " + user.thirdName,
            });
        }
    };

    return <div className={styles["message-area-container"]}>
        {/* Header */}
        <div className={styles["message-area-container--header"]}>
            {friendInfo && !loadingFriendInfo
                ? <>
                    <div className={styles["header-container--back"]} onClick={_ => router.push(Pages.messages)}>
                        <ArrowBackIosNewIcon className={styles["header-container--back--icon"]} />
                        <div>Назад</div>
                    </div>

                    <div className={styles["header-container--central-block"]}>
                        <div className={styles["header-container--name"]}>{friendInfo.friendName}</div>
                        <div className={styles["header-container--status"]}>была в сети 50 минут назад</div>
                    </div>

                    <div className={styles["header-container--right-block"]}>
                        <div className={styles["header-container--wrapper"]}>
                            <CallOutlinedIcon 
                                className={styles["header-container--header-icon"]} 
                                aria-describedby={popoverCallId} 
                                onClick={event => setAnchorCall(event.currentTarget)} 
                            />
                            <Popover
                                id={popoverCallId}
                                open={Boolean(anchorCall)}
                                anchorEl={anchorCall}
                                onClose={() => setAnchorCall(null)}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                            >
                                <Button 
                                    variant="text"
                                    size="small"
                                    sx={{ padding: "10px 10px 5px 10px", fontSize: 12, display: "flex", alignItems: "center", color: "#000000" }}
                                    onClick={_ => console.log(111)}
                                >
                                    <CallOutlinedIcon fontSize="small" sx={{ marginRight: "10px" }} />Аудиозвонок
                                </Button>
                                <Button 
                                    variant="text"
                                    size="small"
                                    sx={{ padding: "5px 10px 10px 10px", fontSize: 12, display: "flex", alignItems: "center", color: "#000000" }} 
                                    onClick={onVideoCall}
                                >
                                    <VideocamOutlinedIcon fontSize="small" sx={{ marginRight: "10px" }} />Видеозвонок
                                </Button>
                            </Popover>
                        </div>

                        <div className={styles["header-container--wrapper"]}>
                            <MoreHorizIcon 
                                className={styles["header-container--header-icon"]} 
                                aria-describedby={popoverId} 
                                onClick={event => setAnchorEl(event.currentTarget)} 
                            />
                            <Popover
                                id={popoverId}
                                open={Boolean(anchorEl)}
                                anchorEl={anchorEl}
                                onClose={() => setAnchorEl(null)}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                            >
                                <Typography sx={{ p: 2, cursor: "pointer", fontSize: 14 }} onClick={_ => console.log(111)}>
                                    Показать вложения
                                </Typography>
                            </Popover>
                        </div>

                        <div className={styles["header-container--wrapper"]}>
                            <Avatar
                                alt={friendInfo.friendName}
                                src={friendInfo.avatarUrl ? friendInfo.avatarUrl : NO_PHOTO}
                                className={styles["header-container--right-block--avatar"]}
                            />
                        </div>
                    </div>
                </>
                : <Skeleton variant="text" className={styles["header-container--friend-name-loading"]} />
            }
        </div>

        {/* Список сообщений */}
        <div className={styles["message-area-container--messages"]}>
            <div className={styles["message-area-container--messages-scrollable"]} ref={messagesRef} onWheel={onWheel}>
                {upperDate
                    ? <div className={styles["message-area-container--upper-date-block"]} style={{ left: upperDate.left, top: upperDate.top }}>
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
                                    <CircularProgress />
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
        </div>

        {/* Отправка */}
        <form noValidate autoComplete="off" className={styles["messages--submit-block"]}>
            {visible
                ? <div className={styles["message-area-container--anchor"]} onClick={onScrollDown}>
                    {counter
                        ? <span className={styles["message-area-container--anchor-counter"]}>{counter}</span>
                        : null
                    }
                    <ArrowDownwardIcon className={styles["message-area-container--anchor-icon"]} />
                </div>
                : null
            }

            <div className={styles["messages-container--search-field-wrapper"]}>
                <Tooltip title="Выбор смайлика" placement="top">
                    <SentimentSatisfiedAltIcon
                        sx={{ cursor: "pointer" }}
                        aria-describedby={popoverId}
                        className={`${styles["messages-container--search-field-icon"]} ${styles["smiles"]}`}
                        onClick={event => setAnchorEmoji(event.currentTarget)}
                    />
                </Tooltip>
                <Popover
                    id={emojiPopoverId}
                    sx={{ position: "absolute", top: -50, left: 20 }}
                    open={Boolean(anchorEmoji)}
                    anchorEl={anchorEmoji}
                    onClose={() => setAnchorEmoji(null)}
                >
                    <EmojiPicker emojiStyle={EmojiStyle.GOOGLE} onEmojiClick={onEmojiClick} lazyLoadEmojis={true} searchPlaceHolder="Поиск..." />
                </Popover>

                <div
                    ref={inputRef}
                    id="submit-input"
                    className={`${styles["messages-container--search-field"]} ${error ? styles["is-error"] : ""}`}
                    contentEditable="true"
                    role="textbox"
                    aria-multiline="true"
                    onKeyPress={onKeyPress}
                />

                <Tooltip title="Прикрепить файл" placement="top">
                    <AttachFileOutlinedIcon className={`${styles["messages-container--search-field-icon"]} ${styles["attach-file"]}`} />
                </Tooltip>
                {error ? <div className={styles["messages-container--error-text"]}>{error}</div> : null}
            </div>

            <Tooltip title="Отправить сообщение" placement="top">
                <div className={styles["messages-container--search-icon"]} onClick={onSubmit}><SendIcon /></div>
            </Tooltip>
        </form>
    </div>
};