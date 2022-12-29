import React from "react";
import { useRouter } from "next/router";
import { Avatar } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { IMessage, IUser } from "../../types/models.types";
import { getHoursOrMinutes, NO_PHOTO, transformDate } from "../../common";
import { IFriendInfo } from "../../pages/messages/[id]";
import { FileVarieties, MessageTypes, Pages } from "../../types/enums";
import MessagesHandler from "./messages-handler";

import styles from "./message.module.scss";

interface IWrapperMessage {
    user: IUser;
    message: IMessage;
    friendInfo: IFriendInfo;
    visibleParams: { isFirst: boolean, isLast: boolean };
};

export default function WrapperMessage({ user, message, friendInfo, visibleParams }: IWrapperMessage) {
    const router = useRouter();

    const { isFirst, isLast } = visibleParams;
    const meAuthor = Boolean(message.userId === user.id);
    const authorName = meAuthor ? message.User ? message.User.firstName + " " + message.User.thirdName : "" : friendInfo.friendName;
    const avatarUrl = meAuthor ? message.User ? message.User.avatarUrl : "" : friendInfo.avatarUrl;

    const isMessageWithImages = Boolean(message.fileExt && message.fileExt === FileVarieties.IMAGES);
    const isEmptyMessageWithImages = isMessageWithImages && message.type === MessageTypes.FEW_FILES;

    const elements = [
        <div
            key={message.id + "textMessage"}
            className={`${!meAuthor
                ? styles["author--friend-message"] + isFirst
                    ? " " + styles["author--friend-message--with-name"]
                    : ""
                : ""} ${isMessageWithImages ? styles["no-padding"] : ""} ${styles["message-container_text-message"]}`}
        >
            {/* Имя автора сообщения */}
            {!meAuthor && isFirst
                ? <a className={styles["author-name"]} href={Pages.profile}>{authorName}</a>
                : null
            }

            {/* Контент сообщения */}
            <div className={styles["message-container--message-content"]}>
                <MessagesHandler message={message} userId={user.id} />
            </div>

            {/* Время отправки и статус прочтенности */}
            <div className={`${styles["message-container_text-message__bottom-block"]} ${isEmptyMessageWithImages ? styles["dark-background"] : ""}`}>
                <div className={`${!meAuthor ? styles["message-container_text-message__bottom-block__me-author"] : ""} ${styles["message-container_text-message__bottom-block__time"]}`}>
                    {getHoursOrMinutes(new Date(message.createDate).getHours())}:{getHoursOrMinutes(new Date(message.createDate).getMinutes())}
                </div>

                {meAuthor ?
                    message.isRead
                        ? <DoneAllIcon className={styles["is-read"]} fontSize="small" />
                        : <CheckIcon fontSize="small" />
                    : null
                }
            </div>
        </div>,
        <div key={message.id + "avatar"} className={styles["message-container_user-avatar--block"]}>
            {isLast
                ? <Avatar
                    alt={authorName}
                    src={avatarUrl ? avatarUrl : NO_PHOTO}
                    className={styles["message-container_user-avatar"]}
                    onClick={() => router.push(Pages.profile)}
                />
                : null
            }
        </div>
    ];

    return <div
        id={message.createDate ? transformDate(message.createDate) : ""}
        key={message.id + user.id}
        className={styles["message-container"]}
    >
        <div className={`${meAuthor ? styles["author--me"] : styles["author--friend"]} ${styles["message-container--block"]}`}>
            {meAuthor
                ? elements[0]
                : elements.reverse()
            }
        </div>
    </div>
};