import React from "react";
import { useRouter } from "next/router";
import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import { getHoursOrMinutes, getMonthName, isSingleChat, NO_PHOTO } from "../../common";
import { useAppSelector } from "../../hooks/useGlobalState";
import { IDialog } from "../../pages/messages";
import { selectMainState } from "../../state/main/slice";
import { selectUserState } from "../../state/user/slice";
import { Pages, Times } from "../../types/enums";
import AvatarWithBadge from "../avatarWithBadge";
import MessageHandler from "./message-handler";

import styles from "./dialog.module.scss";

interface IDialogComponent {
    dialog: IDialog;
};

export default React.memo(function DialogComponent({ dialog }: IDialogComponent) {
    const { user } = useAppSelector(selectUserState);
    const { onlineUsers } = useAppSelector(selectMainState);

    const router = useRouter();

    const { id, userFrom, userTo } = dialog;

    const isOnline = isSingleChat(id)
        ? user && user.id === userFrom.id && userTo
            ? Boolean(onlineUsers.find(onlineUser => userTo && onlineUser.id === userTo.id))
            : Boolean(onlineUsers.find(onlineUser => userFrom && onlineUser.id === userFrom.id))
        : false;
    const friendName = dialog.userFrom.firstName + " " + dialog.userFrom.thirdName;
    const chatName = isSingleChat(dialog.id)
        ? user && user.id === dialog.userFrom.id && dialog.userTo
            ? dialog.userTo.firstName + " " + dialog.userTo.thirdName
            : friendName
        : dialog.name
            ? dialog.name
            : id;
    const chatAvatar = isSingleChat(id)
        ? user && user.id === userFrom.id && userTo
            ? userTo.avatarUrl
            : userFrom.avatarUrl
                ? userFrom.avatarUrl
                : NO_PHOTO
        : "несколько аватарок участников (как в вк 4 штуки)";

    const currentDate = Date.now() - Date.parse(dialog.messageObject.createDate) > Times.YEAR_OR_OLDER
        ? new Date(dialog.messageObject.createDate).getDate() + getMonthName(new Date(dialog.messageObject.createDate).getMonth()) + " " + new Date(dialog.messageObject.createDate).getFullYear()
        : Date.now() - Date.parse(dialog.messageObject.createDate) > Times.YESTERDAY && Date.now() - Date.parse(dialog.messageObject.createDate) < Times.HALF_YEAR
            ? new Date(dialog.messageObject.createDate).getDate() + getMonthName(new Date(dialog.messageObject.createDate).getMonth())
            : Date.now() - Date.parse(dialog.messageObject.createDate) > Times.TODAY && Date.now() - Date.parse(dialog.messageObject.createDate) < Times.YESTERDAY
                ? "вчера " + getHoursOrMinutes(new Date(dialog.messageObject.createDate).getHours()) + ":" + getHoursOrMinutes(new Date(dialog.messageObject.createDate).getMinutes())
                : Date.now() - Date.parse(dialog.messageObject.createDate) < Times.TODAY
                    ? getHoursOrMinutes(new Date(dialog.messageObject.createDate).getHours()) + ":" + getHoursOrMinutes(new Date(dialog.messageObject.createDate).getMinutes())
                    : null;

    // Переход на страницу диалога
    const goToMessagesArea = () => {
        // Если чат - одиночный
        if (isSingleChat(dialog.id) && dialog.userTo) {
            const query = user && user.id === dialog.userFrom.id
                ? { friendId: dialog.userTo.id, friendName: dialog.userTo.firstName + " " + dialog.userTo.thirdName, friendAvatarUrl: dialog.userTo.avatarUrl }
                : { friendId: dialog.userFrom.id, friendName, friendAvatarUrl: dialog.userFrom.avatarUrl };

            router.push({ pathname: Pages.messages + "/" + dialog.id, query }, Pages.messages + "/" + dialog.id);
        } else {
            // Если чат - групповой
            console.log("--Чат - групповой--")
        }
    };

    return <ListItem className={styles["messages-container__item"]}>
        <ListItemAvatar>
            <AvatarWithBadge
                isOnline={isOnline}
                chatAvatar={chatAvatar}
                alt={chatName}
                avatarClassName="messages-container__item__avatar"
            />
        </ListItemAvatar>

        <ListItemText
            className={styles["messages-container__item__dialog-name"]}
            primary={chatName}
            disableTypography
            secondary={
                <div className={styles["messages-container__item__secondary"]}>
                    {user && user.id === dialog.userFrom.id && dialog.userTo && !dialog.messageObject.notifyWrite
                        ? <Avatar
                            alt={chatName}
                            src={dialog.userFrom.avatarUrl ? dialog.userFrom.avatarUrl : NO_PHOTO}
                            className={styles["messages-container__item__author-avatar"]}
                        />
                        : null
                    }

                    {user
                        ? <MessageHandler userId={user.id} messageObject={dialog.messageObject} />
                        : null
                    }
                </div>
            }
            onClick={goToMessagesArea}
        />

        {dialog.unReadMessagesCount
            ? <div className={styles["messages-container__item__unread-messages-count"]} onClick={goToMessagesArea}>{dialog.unReadMessagesCount}</div>
            : <div className={styles["messages-container__item__dialog-date"]} onClick={goToMessagesArea}>{currentDate}</div>
        }
    </ListItem>
});