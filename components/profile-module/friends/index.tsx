import React from "react";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Paper from "@mui/material/Paper";
import AvatarWithBadge from "../../avatarWithBadge";
import { onClickBlockType } from "../../../pages/profile";
import { FriendsTab, MainFriendTabs, Pages } from "../../../types/enums";
import { useAppSelector } from "../../../hooks/useGlobalState";
import { selectMainState } from "../../../state/main/slice";
import { selectFriendState } from "../../../state/friends/slice";
import { NO_PHOTO } from "../../../common";

import styles from "./friends.module.scss";

interface IFriends {
    onlineFriends?: boolean;
    onClickBlock: onClickBlockType;
};

export default React.memo(function Friends({ onlineFriends = false, onClickBlock }: IFriends) {
    const { topFriends, friendsCount } = useAppSelector(selectFriendState);
    const { onlineUsers } = useAppSelector(selectMainState);

    const title = onlineFriends ? "Друзья онлайн" : "Друзья";
    const count = onlineFriends ? onlineUsers.length : friendsCount;
    const users = onlineFriends ? onlineUsers.slice(0, 6) : topFriends;

    // Обрабока клика по блоку
    const blockHandler = () => {
        onlineFriends
            ? onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends, tab: FriendsTab.online })
            : onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends });
    };

    return <Grid item>
        <Paper className="friends-container paper-block">
            <div className="block-title" onClick={blockHandler}>
                {title} <span className="counter">{count}</span>
            </div>

            {users && users.length
                ? <List className={styles["friends-container__top-friends__list"]}>
                    {users.map(user => {
                        const userName = user.firstName + " " + user.thirdName;

                        return <ListItem className={styles["friends-container__top-friends__item"]} key={user.id}>
                            <ListItemAvatar className={styles["top-friends__item__avatar-block"]}>
                                <AvatarWithBadge
                                    isOnline={Boolean(onlineUsers.find(onlineUser => onlineUser.id === user.id))}
                                    chatAvatar={user.avatarUrl ? user.avatarUrl : NO_PHOTO}
                                    alt={userName}
                                    avatarClassName="top-friends__item__avatar"
                                />
                            </ListItemAvatar>

                            {user.firstName}
                        </ListItem>
                    })}
                </List>
                : <div className="opacity-text">
                    На данный момент список {onlineFriends ? "онлайн " : ""}друзей пуст
                </div>
            }
        </Paper>
    </Grid>
});