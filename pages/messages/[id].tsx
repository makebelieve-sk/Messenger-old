import React from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/router";
import SendIcon from "@mui/icons-material/Send";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { Avatar, CircularProgress, Popover, Skeleton, Tooltip, Typography } from "@mui/material";
import { SocketIOClient } from "../../components/app";
import MessagesHandler from "../../components/messages-handler";
import { ApiRoutes, MessageReadStatus, MessageTypes, Pages, SocketActions } from "../../config/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { deleteFromTempChat, selectMessagesState, setMessage, setMessages } from "../../state/messages/slice";
import CatchErrors from "../../axios/catch-errors";
import { IMessage } from "../../types/models.types";
import Request from "../../common/request";
import { isSingleChat, NO_PHOTO } from "../../config";

import styles from "../../styles/pages/message-area.module.scss";

// TODO
// Переработать скролл на такой как в телеге (боковой скролл)
// Скроллить до самого конца (при входе) и при получении (отправке) нового сообщения

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
    const [page, setPage] = React.useState(0);
    const [isMore, setIsMore] = React.useState(false);
    const [beforeHeight, setBeforeHeight] = React.useState<number>();
    const [chatId, setChatId] = React.useState<string | null>(null);

    const socket = React.useContext(SocketIOClient);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { messages } = useAppSelector(selectMessagesState);
    const { user } = useAppSelector(selectUserState);

    const inputRef = React.useRef<HTMLDivElement>(null);
    const messagesRef = React.useRef<HTMLDivElement>(null);

    const popoverId = Boolean(anchorEl) ? "popover-item-messages-header" : undefined;
    const emojiPopoverId = Boolean(anchorEmoji) ? "emoji-popover" : undefined;

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
                            if (error.response.data.message === `Пользователь с id = ${user.id} не найден`) {
                                router.replace(Pages.profile);
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
        } else {
            CatchErrors.catch("Не передан уникальный идентификатор чата", router, dispatch)
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

            // TODO
            // Создать класс (сущность) сообщения типа Текст + добавить в message поле аватарки друга
            // Объект сообщения
            const message = {
                id: uuid(),
                userId: user.id,
                chatId,
                type: MessageTypes.MESSAGE,
                createDate: new Date().toUTCString(),
                message: preparedValue,
                isRead: MessageReadStatus.NOT_READ
            } as IMessage;

            // Очищаем инпут и ставим на него фокус
            inputRef.current.textContent = "";
            inputRef.current.focus();

            // Добавляем сообщение в массив сообщений для отрисовки
            dispatch(setMessage(message));

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
    const onScroll = () => {
        if (messagesRef.current && isMore) {
            const offset = messagesRef.current.scrollTop;

            if (offset < 55) {
                if (user && friendInfo) {
                    setPage(page + 1);
                    let before = messagesRef.current.scrollHeight;

                    Request.post(ApiRoutes.getMessages, { userId: user.id, chatId, page: page + 1 }, undefined,
                        (data: { success: boolean, messages: IMessage[], isMore: boolean }) => {
                            dispatch(setMessages(data.messages));
                            setIsMore(data.isMore);
                            if (!data.isMore) {
                                const loadingIsMore = document.querySelector("#loading-is-more");
                                if (loadingIsMore) before -= loadingIsMore.clientHeight;
                            }
                            setBeforeHeight(before - offset);
                        },
                        (error: any) => CatchErrors.catch(error, router, dispatch)
                    );
                }
            }
        }
    };

    return <div className={styles["message-area-container"]}>
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
                        <MoreHorizIcon sx={{ cursor: "pointer" }} aria-describedby={popoverId} onClick={event => setAnchorEl(event.currentTarget)} />
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

                        <Avatar
                            alt={friendInfo.friendName}
                            src={friendInfo.avatarUrl ? friendInfo.avatarUrl : NO_PHOTO}
                            className={styles["header-container--right-block--avatar"]}
                        />
                    </div>
                </>
                : <Skeleton variant="text" className={styles["header-container--friend-name-loading"]} />
            }
        </div>

        <div className={styles["message-area-container--messages"]}>
            <div className={styles["message-area-container--messages-scrollable"]} ref={messagesRef} onScroll={onScroll}>
                {loading || !user
                    ? <div className={styles["message-area-container--loading"]}><CircularProgress /></div>
                    : messages && messages.length && friendInfo
                        ? <div className={styles["message-area-container--messages-wrapper"]}>
                            {isMore ? <div id="loading-messages-is-more" className={styles["message-area-container--loading-is-more"]}><CircularProgress /></div> : null}
                            <MessagesHandler messages={messages} user={user} messagesRef={messagesRef} beforeHeight={beforeHeight} friendInfo={friendInfo} />
                        </div>
                        : <div className={styles["message-area-container--no-history"]}>История диалогов пуста</div>
                }
            </div>
        </div>

        <form noValidate autoComplete="off" className={styles["messages--submit-block"]}>
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