import React from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/router";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AvatarWithBadge from "../../avatarWithBadge";
import { IFriendInfo } from "../../../pages/messages/[id]";
import { useAppDispatch, useAppSelector } from "../../../hooks/useGlobalState";
import useDebounce from "../../../hooks/useDebounce";
import { selectUserState } from "../../../state/user/slice";
import { selectMainState } from "../../../state/main/slice";
import { setCallId, setChatInfo, setLocalStream, setModalVisible, setStatus, setUsers } from "../../../state/calls/slice";
import { changeUnReadMessagesCountInDialogs } from "../../../state/messages/slice";
import { NO_PHOTO, rtcSettings } from "../../../common";
import catchErrors from "../../../core/catch-errors";
import { CallStatus, Pages, SocketActions } from "../../../types/enums";
import { SocketIOClient } from "../../socket-io-provider";

import styles from "./header.module.scss";

interface IHeaderMessagesArea {
    friendInfo: IFriendInfo | null;
    loadingFriendInfo: boolean;
    chatId: string | null;
    counter: number;
    getMessages: (search?: string) => void;
    setVisabilityInput: React.Dispatch<React.SetStateAction<boolean>>;
    setDebouncedSearchValue: React.Dispatch<React.SetStateAction<string>>;
};

enum IHeaderContent {
    USUAL = "usual",
    SEARCH = "search"
};

// TODO
// Привести все всплывашки к одному виду (создать свой кастомный компонент Popover)

export const HeaderMessagesArea = React.memo(({ friendInfo, loadingFriendInfo, chatId, counter, getMessages, setVisabilityInput, setDebouncedSearchValue }: IHeaderMessagesArea) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [anchorCall, setAnchorCall] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [headerContent, setHeaderContent] = React.useState<IHeaderContent>(IHeaderContent.USUAL);
    const [searchValue, setSearchValue] = React.useState("");

    const socket = React.useContext(SocketIOClient);

    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(selectUserState);
    const { onlineUsers } = useAppSelector(selectMainState);
    const debouncedSearchValue = useDebounce(searchValue);

    const popoverId = Boolean(anchorEl) ? "popover-item-messages-header" : undefined;
    const popoverCallId = Boolean(anchorCall) ? "call-popover" : undefined;

    // Обнуление состояний при размонтировании
    React.useEffect(() => {
        return () => {
            setAnchorEl(null);
            setAnchorCall(null);
            setVisabilityInput(true);
            setSearchValue("");
            setDebouncedSearchValue("");
        }
    }, []);

    // При изменении поисковой строки загружаем сообщения
    React.useEffect(() => {
        if (headerContent === IHeaderContent.SEARCH) {
            getMessages(debouncedSearchValue);
            setDebouncedSearchValue(debouncedSearchValue);
        }
    }, [debouncedSearchValue]);

    // Вызов модального окна для (видео/аудио)-звонка
    const onCall = (settings: { audio: boolean; video: boolean | { width: number; height: number; }; }) => {
        if (friendInfo && socket && user && chatId) {
            // Запись локального потока 2-ух треков (видео/аудио)
            navigator.mediaDevices.getUserMedia(settings)
                .then(stream => {
                    const chatInfo = {
                        chatId,
                        initiatorId: user.id,
                        chatName: friendInfo.friendName,
                        chatAvatar: friendInfo.avatarUrl,
                        chatSettings: settings,
                        isSingle: true
                    };
                    const users = [
                        { id: user.id, friendName: user.firstName + " " + user.thirdName, avatarUrl: user.avatarUrl },
                        friendInfo
                    ];
                    const roomId = uuid();

                    dispatch(setModalVisible(true));
                    dispatch(setStatus(CallStatus.SET_CONNECTION));
                    dispatch(setChatInfo(chatInfo));
                    dispatch(setUsers(users));
                    dispatch(setCallId(roomId));
                    dispatch(setLocalStream(stream));

                    // Отправка на сокет
                    socket.emit(SocketActions.CALL, { roomId, users, chatInfo });

                    setAnchorCall(null)
                })
                .catch(error => catchErrors.catch(error, router, dispatch));
        }
    };

    // Клик назад в диалоги
    const onBack = () => {
        // Обновляем счетчик непрочитанных сообщений для текущего диалога
        dispatch(changeUnReadMessagesCountInDialogs({ chatId, counter }));
        router.push(Pages.messages);
    };

    // Переключение контента с "обычного" на "поиск"
    const onSwitchSearch = () => {
        setHeaderContent(IHeaderContent.SEARCH);
        setAnchorEl(null);
        setVisabilityInput(false);
    };

    // Переключение контента с "поиска" на "обычный"
    const onSwitchUsual = () => {
        setHeaderContent(IHeaderContent.USUAL);
        getMessages();
        setVisabilityInput(true);
        setSearchValue("");
        setDebouncedSearchValue("");
    };

    return <div className={styles["message-area-container--header"]}>
        {friendInfo && !loadingFriendInfo
            ? headerContent === IHeaderContent.USUAL
                ? <>
                    {/* Назад */}
                    <div className={styles["header-container--back"]} onClick={onBack}>
                        <ArrowBackIosNewIcon className={styles["header-container--back--icon"]} />
                        <div>Назад</div>
                    </div>

                    {/* Название чата + время последнего захода (если приватный) */}
                    <div className={styles["header-container--central-block"]}>
                        <div className={styles["header-container--name"]}>{friendInfo.friendName}</div>
                        <div className={styles["header-container--status"]}>была в сети 50 минут назад</div>
                    </div>

                    <div className={styles["header-container--right-block"]}>
                        {/* Звонки */}
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
                                <Typography
                                    className={`${styles["popover-text"]} ${styles["header-container--call-action"]} ${styles["header-container--call-action--audio"]}`}
                                    onClick={_ => onCall(rtcSettings.audioCall)}
                                >
                                    <CallOutlinedIcon fontSize="small" className={styles["header-container--call-action--icon"]} />
                                    Аудиозвонок
                                </Typography>

                                <Typography
                                    className={`${styles["popover-text"]} ${styles["header-container--call-action"]} ${styles["header-container--call-action--video"]}`}
                                    onClick={_ => onCall(rtcSettings.videoCall)}
                                >
                                    <VideocamOutlinedIcon fontSize="small" className={styles["header-container--call-action--icon"]} />
                                    Видеозвонок
                                </Typography>
                            </Popover>
                        </div>

                        {/* Действия */}
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
                                <Typography className={styles["popover-text"]} onClick={onSwitchSearch}>
                                    Поиск
                                </Typography>
                                <Typography className={styles["popover-text"]} onClick={_ => console.log(111)}>
                                    Показать вложения
                                </Typography>
                            </Popover>
                        </div>

                        {/* Лого чата */}
                        <div className={styles["header-container--wrapper"]}>
                            <AvatarWithBadge
                                isOnline={Boolean(onlineUsers.find(onlineUser => onlineUser.id === friendInfo.id))}
                                chatAvatar={friendInfo.avatarUrl ? friendInfo.avatarUrl : NO_PHOTO}
                                alt={friendInfo.friendName}
                                avatarClassName="header-container--right-block--avatar"
                                size={38}
                            />
                        </div>
                    </div>
                </>
                : <>
                    <SearchIcon className={styles["header-container--search-field-icon"]} />
                    <InputBase
                        id="standard-input"
                        autoFocus
                        placeholder="Поиск по истории сообщений"
                        fullWidth
                        size="small"
                        className={styles["header-container--search-field"]}
                        value={searchValue}
                        onChange={event => setSearchValue(event.target.value)}
                    />

                    <Button variant="text" size="small" className={styles["header-container--cancel-search"]} onClick={onSwitchUsual}>
                        Отмена
                    </Button>
                </>
            : <Skeleton variant="text" className={styles["header-container--friend-name-loading"]} />
        }
    </div>
});