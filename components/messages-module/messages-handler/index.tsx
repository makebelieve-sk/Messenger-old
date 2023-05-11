import React from "react";
import { useRouter } from "next/router";
import PhoneCallbackOutlinedIcon from "@mui/icons-material/PhoneCallbackOutlined";
import PhoneForwardedOutlinedIcon from "@mui/icons-material/PhoneForwardedOutlined";
import catchErrors from "../../../core/catch-errors";
import { CallNames, FileVarieties, MessageTypes } from "../../../types/enums";
import { useAppDispatch } from "../../../hooks/useGlobalState";
import { IFile, IMessage } from "../../../types/models.types";
import { getHoursOrMinutes } from "../../../common";
import FileComponent from "../../file";
import { ImageMessage, IImage } from "../image-message";

import styles from "./messages-handler.module.scss";

interface IMessagesHandler {
    message: IMessage;
    userId: string;
};

export default React.memo(function MessagesHandler({ message, userId }: IMessagesHandler) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const errorMessage = <>Ошибка отображения компонента</>;

    // Формирование нового объекта картинки
    const newImage = (files: IFile[]) => {
        return files.reduce((acc, file, index) => {
            acc.push({
                src: file.path,
                alt: file.name,
                id: file.id,
                rows: files.length > 1 && index === 0 ? files.length - 1 : 1,
                authorName: message.User ? message.User.firstName + " " + message.User.thirdName : "",
                authorAvatarUrl: message.User ? message.User.avatarUrl : "",
                dateTime: message.createDate
            });

            return acc;
        }, [] as IImage[]);
    };

    switch (message.type) {
        case MessageTypes.MESSAGE:
            return <>{message.message}</>;
        case MessageTypes.WITH_FILE:
            return message.files && message.files[0]
                ? <div className={styles["message-type__message-with-file"]}>
                    {message.fileExt && message.fileExt === FileVarieties.IMAGES
                        ? <>
                            <ImageMessage images={newImage([message.files[0] as IFile])} showBottomRadius={Boolean(message.message)} />
                            {message.message 
                                ? <div className={styles["message-type__message-with-file__message"]}>{message.message}</div> 
                                : null
                            }
                        </>
                        : <>
                            <FileComponent file={(message.files[0] as IFile)} visibleButtons={false} />
                            {message.message}
                        </>
                    }
                </div>
                : errorMessage;
        case MessageTypes.FEW_FILES:
            return message.files && message.files.length
                ? <div className={styles["message-type__message-with-file"]}>
                    {message.fileExt && message.fileExt === FileVarieties.IMAGES
                        ? <ImageMessage images={newImage(message.files as IFile[])} />
                        : (message.files as IFile[]).map(file =>
                            <FileComponent key={file.id} file={file} visibleButtons={false} />
                        )
                    }
                </div>
                : errorMessage;
        case MessageTypes.VOICE:
            return <div>
                Иконка голосового сообщения - Голосовое сообщение - Продолжительность
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
                return errorMessage;
            }
        }

        default:
            catchErrors.catch("Неизвестный тип сообщения: " + message.type, router, dispatch)
            return errorMessage;
    }
});