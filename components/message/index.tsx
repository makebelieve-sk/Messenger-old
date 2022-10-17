import React from "react";
import { Avatar } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { IMessage, IUser } from "../../types/models.types";
import { getHoursOrMinutes, NO_PHOTO } from "../../config";
import { IFriendInfo } from "../../pages/messages/[id]";

import styles from "./message.module.scss";

interface ITextMessage {
    user: IUser;
    message: IMessage;
    friendInfo: IFriendInfo;
};

export default function TextMessage({ user, message, friendInfo }: ITextMessage) {
    const meAuthor = Boolean(message.userId === user.id);
    const friendName = meAuthor ? message.User ? message.User.firstName + " " + message.User.thirdName : "" : friendInfo.friendName;
    const avatarUrl = meAuthor ? message.User ? message.User.avatarUrl : "" : friendInfo.avatarUrl;

    const elements = [
        <div key={message.id + "textMessage"} className={`${!meAuthor ? styles["author--friend-message"] : ""} ${styles["message-container_text-message"]}`}>
            {message.message}

            <div className={`${!meAuthor ? styles["author--friend-time"] : ""} ${styles["message-container_text-message--time"]}`}>
                {getHoursOrMinutes(new Date(message.createDate).getHours())}:{getHoursOrMinutes(new Date(message.createDate).getMinutes())}
            </div>

            {meAuthor ? 
                message.isRead 
                    ? <DoneAllIcon className={`${styles["message-container_text-message--status"]} ${styles["is-read"]}`} /> 
                    : <CheckIcon className={styles["message-container_text-message--status"]} /> 
                : null
            }
        </div>,
        <div key={message.id + "avatar"} className={styles["message-container_user-avatar--block"]}>
            <Avatar
                alt={friendName}
                src={avatarUrl ? avatarUrl : NO_PHOTO}
                className={styles["message-container_user-avatar"]}
            />
        </div>
    ];

    return <div key={message.id + user.id} className={styles["message-container"]}>
        <div className={`${meAuthor ? styles["author--me"] : styles["author--friend"]} ${styles["message-container--block"]}`}>
            {meAuthor
                ? elements[0]
                : elements.reverse()
            }
        </div>
    </div>
};