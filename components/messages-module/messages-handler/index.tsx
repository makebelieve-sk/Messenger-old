import React from "react";
import { useRouter } from "next/router";
import PhoneCallbackOutlinedIcon from "@mui/icons-material/PhoneCallbackOutlined";
import PhoneForwardedOutlinedIcon from "@mui/icons-material/PhoneForwardedOutlined";
import catchErrors from "../../../core/catch-errors";
import { CallNames, MessageTypes } from "../../../types/enums";
import { useAppDispatch } from "../../../hooks/useGlobalState";
import { IMessage } from "../../../types/models.types";
import { getHoursOrMinutes } from "../../../common";

import styles from "./messages-handler.module.scss";

interface IMessagesHandler {
    message: IMessage;
    userId: string;
};

export default function MessagesHandler({ message, userId }: IMessagesHandler) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    switch (message.type) {
        case MessageTypes.MESSAGE:
            return <>{message.message}</>;
        case MessageTypes.WITH_FILE:
            return <div>
                <div>Иконка файла - Название файла - Размер файла</div>
                {message.message}
            </div>;
        case MessageTypes.FEW_FILES:
            return <div>
                <div>Иконка файла - Название файла - Размер файла</div>
                <div>Иконка файла - Название файла - Размер файла</div>
            </div>;
        case MessageTypes.VOICE:
            return <div>
                Иконка файла - Название файла - Размер файла
            </div>;
        case MessageTypes.CALL: {
            if (message.Call) {
                const { startTime, endTime, initiatorId } = message.Call;

                const startTm = startTime ? Date.parse(startTime) : null;
                const endTm = endTime ? Date.parse(endTime) : null;
                let during: string = CallNames.CANCEL;

                if (startTm && endTm) {
                    const diff = endTm - startTm;
                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor(diff / 1000) >= 60 ? Math.floor(diff / 60000 / 1000) : Math.floor(diff / 1000);

                    during = getHoursOrMinutes(mins) + ":" + getHoursOrMinutes(secs);
                }

                return <div className={styles["message-type__voice"]}>
                    <div className={styles["message-type__voice__call-icon"]}>
                        {initiatorId === userId
                            ? <PhoneForwardedOutlinedIcon />
                            : <PhoneCallbackOutlinedIcon />
                        }
                    </div>

                    <div className={styles["message-type__voice__info-block"]}>
                        <div className={styles["message-type__voice__info-block__title"]}>
                            {initiatorId === userId ? CallNames.OUTGOING : CallNames.INCOMING}
                        </div>

                        <div className={styles["message-type__voice__info-block__during"]}>
                            {during}
                        </div>
                    </div>
                </div>;
            } else {
                return null;
            }
        }

        default:
            catchErrors.catch("Неизвестный тип сообщения: " + message.type, router, dispatch)
            return null;
    }
};