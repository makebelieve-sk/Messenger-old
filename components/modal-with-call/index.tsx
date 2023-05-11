import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import Status from "./status";
import Buttons from "./buttons";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import useWebRTC from "../../hooks/useWebRTC";
import { selectUserState } from "../../state/user/slice";
import { selectCallsState } from "../../state/calls/slice";
import { setError } from "../../state/error/slice";
import { CallStatus } from "../../types/enums";
import { NO_PHOTO } from "../../common";

import styles from "./modal-with-call.module.scss";

export default React.memo(function ModalWithCall() {
    const [open, setOpen] = React.useState(false);

    const { visible, status, chatInfo } = useAppSelector(selectCallsState);
    const { user } = useAppSelector(selectUserState);

    const dispatch = useAppDispatch();

    const {
        LOCAL_VIDEO,
        clients,
        settings,
        layout,
        onAccept,
        onToggle,
        onEnd,
        provideMediaRef,
    } = useWebRTC();

    // Ошибка, если нет текущего пользователя
    React.useEffect(() => {
        if (!user && open) {
            dispatch(setError(`
                Невозможно открыть меню вызовов, так как произошла ошибка в загрузке информации звонке. 
                Пожалуйста, обновите страницу.
            `));
        }
    }, [user, open]);

    // Открываем модальное окно только, если есть исходящий/входящий звонок 
    React.useEffect(() => {
        setOpen(Boolean(visible && status !== CallStatus.NOT_CALL));
    }, [visible, status]);

    return <Dialog fullWidth maxWidth="xl" open={open}>
        <DialogContent className={styles["call-container"]}>
            {chatInfo && user && status
                ? <div className={styles["call-container__content-block"]}>
                    {/* Статус звонка */}
                    <div className={styles["call-container__content-block__text"]}>
                        <span>{chatInfo.chatName}</span>
                        <Status status={status} type={chatInfo.chatSettings.video ? "Видеозвонок" : "Аудиозвонок"} />
                    </div>

                    {/* Контент */}
                    <div className={styles["call-container__main"]}>
                        {clients && clients.length
                            ? <div className={styles["call-container__main__video"]}>
                                {clients
                                    .sort((a, b) => a.peerId === LOCAL_VIDEO ? -1 : b.peerId === LOCAL_VIDEO ? 1 : 0)
                                    .map((client, index) => {
                                        const { peerId, avatarUrl, name, audio, video, isTalking } = client;
                                        const classNameIsTalking = isTalking ? styles["is-talking"] : "";

                                        return <div
                                            key={peerId}
                                            id={peerId}
                                            className={styles["call-container__main__video__item"]}
                                            style={layout[index]}
                                        >
                                            <div className={`${styles["call-container__main__video__item__video-wrapper"]} ${classNameIsTalking}`}>
                                                <video
                                                    ref={instance => { provideMediaRef(peerId, instance) }}
                                                    autoPlay
                                                    muted={peerId === LOCAL_VIDEO}
                                                />
                                            </div>

                                            {video
                                                ? null
                                                : <div className={`${styles["call-container__main__video__item__img-wrapper"]} ${classNameIsTalking}`}>
                                                    <img alt={name} src={avatarUrl ? avatarUrl : NO_PHOTO} />
                                                </div>
                                            }

                                            <div className={styles["call-container__main__video__item__help-text"]}>
                                                {!audio
                                                    ? <div className={styles["call-container__main__video__item__help-text__no-micro"]}>
                                                        <MicOffOutlinedIcon fontSize="small" color="error" />
                                                    </div>
                                                    : null
                                                }
                                                <div>
                                                    {peerId === LOCAL_VIDEO
                                                        ? "Вы"
                                                        : name && name.length > 30 ? name.slice(0, 30) + "..." : name
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    })}
                            </div>
                            : <img
                                alt={chatInfo.chatName}
                                src={chatInfo.chatAvatar ? chatInfo.chatAvatar : NO_PHOTO}
                                className={styles["call-container__main__img"]}
                            />
                        }
                    </div>

                    {/* Кнопки действий звонка */}
                    <div className={styles["call-container__buttons-block"]}>
                        <Buttons
                            status={status}
                            settings={settings}
                            visibleVideo={Boolean(chatInfo.chatSettings.video)}
                            onAccept={onAccept}
                            onToggle={onToggle}
                            onEnd={onEnd}
                        />
                    </div>
                </div>
                : <CircularProgress />
            }
        </DialogContent>
    </Dialog>
});