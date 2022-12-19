import React from "react";
import { Socket } from "socket.io-client";
import { Avatar, Button, Snackbar } from "@mui/material";
import PhoneCallbackOutlinedIcon from "@mui/icons-material/PhoneCallbackOutlined";
import PhoneForwardedOutlinedIcon from "@mui/icons-material/PhoneForwardedOutlined";
import CallEndOutlinedIcon from "@mui/icons-material/CallEndOutlined";
import { selectMainState } from "../../state/main/slice";
import { selectUserState } from "../../state/user/slice";
import { useAppSelector } from "../../hooks/useGlobalState";
import { SocketActions } from "../../types/enums";
import { ClientToServerEvents, ServerToClientEvents } from "../../types/socket.types";

import styles from "./snackbar-with-call.module.scss";

export default function SnackBarWithCall() {
    const [openSnack, setOpenSnack] = React.useState(false);

    const { globalCall } = useAppSelector(selectMainState);
    const { user } = useAppSelector(selectUserState);
    const socketRef = React.useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

    // Открытие уведомления о текущем звонке
    React.useEffect(() => {
        setOpenSnack(Boolean(globalCall));
    }, [globalCall]);

    // Закрытие окна с системной ошибкой
    const onCloseSnack = () => {
        if (globalCall && user && socketRef.current) {
            // Отправляем событие о выходе из комнаты на сервер
            socketRef.current.emit(SocketActions.END_CALL, {
                roomId: globalCall.roomId,
                usersInCall: globalCall.users
            });
        }
    };

    return <Snackbar
        open={openSnack}
        onClose={onCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        message={<div className={styles["snackbar__global-call"]}>
            {globalCall && user
                ? <>
                    Информация о текущем звонке:
                    <div className={styles["snackbar__global-call__info"]}>
                        {globalCall.chatInfo.initiatorId === user.id
                            ? <PhoneForwardedOutlinedIcon />
                            : <PhoneCallbackOutlinedIcon />
                        }

                        <span className={styles["snackbar__global-call__info__title"]}>
                            {globalCall.chatInfo.chatName}
                        </span>

                        <span className={styles["snackbar__global-call__info__type"]}>
                            {globalCall.chatInfo.chatSettings.video ? "Видеозвонок" : "Аудиозвонок"}
                        </span>

                        <div className={styles["snackbar__global-call__info__avatars"]}>
                            {globalCall.users.map(user => {
                                return <Avatar
                                    alt={user.friendName}
                                    src={user.avatarUrl} key={user.id}
                                    className={styles["snackbar__global-call__info__avatar"]}
                                />
                            })}
                        </div>
                    </div>
                </>
                : null
            }

        </div>}
        action={<Button color="secondary" size="small" onClick={onCloseSnack}>
            <CallEndOutlinedIcon color="error" />
        </Button>}
    />;
};