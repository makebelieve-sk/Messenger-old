import React from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/router";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { IFriendInfo } from "../../../pages/messages/[id]";
import { useAppDispatch, useAppSelector } from "../../../hooks/useGlobalState";
import { selectUserState } from "../../../state/user/slice";
import { setCallId, setChatInfo, setLocalStream, setModalVisible, setStatus, setUsers } from "../../../state/calls/slice";
import { NO_PHOTO, rtcSettings } from "../../../common";
import catchErrors from "../../../core/catch-errors";
import { CallStatus, Pages, SocketActions } from "../../../types/enums";
import { SocketIOClient } from "../../socket-io-provider";

import styles from "./header.module.scss";

interface IHeaderMessagesArea {
    friendInfo: IFriendInfo | null;
    loadingFriendInfo: boolean;
    chatId: string | null;
};

export const HeaderMessagesArea = React.memo(({ friendInfo, loadingFriendInfo, chatId }: IHeaderMessagesArea) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [anchorCall, setAnchorCall] = React.useState<HTMLOrSVGElement | null | any>(null);

    const socket = React.useContext(SocketIOClient);

    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(selectUserState);

    const popoverId = Boolean(anchorEl) ? "popover-item-messages-header" : undefined;
    const popoverCallId = Boolean(anchorCall) ? "call-popover" : undefined;

    // Обнуление состояний при размонтировании
    React.useEffect(() => {
        return () => {
            setAnchorEl(null);
            setAnchorCall(null);
        }
    }, []);

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

    return <div className={styles["message-area-container--header"]}>
        {friendInfo && !loadingFriendInfo
            ? <>
                {/* Назад */}
                <div className={styles["header-container--back"]} onClick={_ => router.push(Pages.messages)}>
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
                            <Button
                                variant="text"
                                size="small"
                                sx={{ padding: "10px 10px 5px 10px", fontSize: 12, display: "flex", alignItems: "center", color: "#000000" }}
                                onClick={_ => onCall(rtcSettings.audioCall)}
                            >
                                <CallOutlinedIcon fontSize="small" sx={{ marginRight: "10px" }} />Аудиозвонок
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                sx={{ padding: "5px 10px 10px 10px", fontSize: 12, display: "flex", alignItems: "center", color: "#000000" }}
                                onClick={_ => onCall(rtcSettings.videoCall)}
                            >
                                <VideocamOutlinedIcon fontSize="small" sx={{ marginRight: "10px" }} />Видеозвонок
                            </Button>
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
                            <Typography sx={{ p: 2, cursor: "pointer", fontSize: 14 }} onClick={_ => console.log(111)}>
                                Показать вложения
                            </Typography>
                        </Popover>
                    </div>

                    {/* Лого чата */}
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
});