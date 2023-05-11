import React from "react";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import { requestFriendsType } from "../../../pages/friends";
import AvatarWithBadge from "../../avatarWithBadge";
import SkeletonBlock from "../../skeleton-block";
import { useAppDispatch, useAppSelector } from "../../../hooks/useGlobalState";
import { selectFriendState, setPossibleUsers } from "../../../state/friends/slice";
import { selectMainState } from "../../../state/main/slice";
import { selectUserState } from "../../../state/user/slice";
import { NO_PHOTO } from "../../../common";
import { SocketIOClient } from "../../socket-io-provider";
import Request from "../../../core/request";
import CatchErrors from "../../../core/catch-errors";
import { ApiRoutes, FriendsTab, SocketActions } from "../../../types/enums";

import styles from "./possible-friends.module.scss";

interface IPossibleFriends {
    friendTab: number;
    loading: boolean;
    requestFriends: requestFriendsType;
};

export default React.memo(function PossibleFriends({ friendTab, loading, requestFriends }: IPossibleFriends) {
    const { user } = useAppSelector(selectUserState);
    const { possibleUsers } = useAppSelector(selectFriendState);
    const { onlineUsers } = useAppSelector(selectMainState);

    const socket = React.useContext(SocketIOClient);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Подписка на пользователя
    const onAddUser = (friendId: string | null) => {
        if (user && friendId && possibleUsers) {
            Request.post(ApiRoutes.addToFriend, { userId: user.id, friendId }, undefined,
                () => {
                    const findUser = possibleUsers.find(user => user.id === friendId);

                    if (findUser) {
                        const indexOf = possibleUsers.indexOf(findUser);

                        if (findUser && indexOf >= 0) {
                            dispatch(setPossibleUsers([...possibleUsers.slice(0, indexOf), ...possibleUsers.slice(indexOf + 1)]));

                            if (socket) {
                                socket.emit(SocketActions.FRIENDS, { type: SocketActions.ADD_TO_FRIENDS, payload: { to: friendId } });
                            }
                        }
                    }

                    const route = friendTab === FriendsTab.incomingRequests
                        ? FriendsTab.incomingRequests
                        : friendTab === FriendsTab.all
                            ? FriendsTab.all
                            : friendTab === FriendsTab.friendRequests
                                ? FriendsTab.friendRequests
                                : null;

                    if (route) {
                        requestFriends(user.id, route);
                    }
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        } else {
            CatchErrors.catch("Нет id пользователя", router, dispatch);
        }
    };

    return <Grid item>
        <Paper className={styles["possible-container"] + " paper-block"}>
            <div className="block-title">Возможные друзья</div>

            <div className={styles["possible-container__block"]}>
                {loading
                    ? <div className={styles["skeleton-container"]}>
                        <SkeletonBlock keyProp="possible-container " className={styles["skeleton-container__row"]} />
                    </div>
                    : possibleUsers && possibleUsers.length
                        ? <List className={styles["possible-container__list"]}>
                            {possibleUsers.map(posUser => {
                                const userName = posUser.firstName + " " + posUser.thirdName;

                                return <ListItem className={styles["possible-container__item"]} key={posUser.id}>
                                    <ListItemAvatar className={styles["possible-container__item-avatar"]}>
                                        <AvatarWithBadge
                                            isOnline={Boolean(onlineUsers.find(onlineUser => onlineUser.id === posUser.id))}
                                            chatAvatar={posUser.avatarUrl ? posUser.avatarUrl : NO_PHOTO}
                                            alt={userName}
                                            size={38}
                                            pushLeft={true}
                                        />
                                    </ListItemAvatar>

                                    <ListItemText
                                        className={styles["possible-container__item-block"]}
                                        primary={userName}
                                        secondary={
                                            <span
                                                className={styles["possible-container__action"]}
                                                onClick={_ => onAddUser(posUser.id)}
                                            >
                                                <AddIcon className={styles["possible-container__action-icon"]} />
                                                <span className={styles["possible-container__action-text"]}>
                                                    Добавить в друзья
                                                </span>
                                            </span>
                                        }
                                    />
                                </ListItem>
                            })}
                        </List>
                        : <div className="opacity-text">
                            На данный момент в системе нет других пользователей
                        </div>
                }
            </div>
        </Paper>
    </Grid>
});