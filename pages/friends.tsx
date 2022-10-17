import React from "react";
import { useRouter } from "next/router";
import { Avatar, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, Box, Tabs, Tab, Stack, Skeleton, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FriendsList, { MainFriendTabs } from "../components/friends-module/friends-list";
import CatchErrors from "../axios/catch-errors";
import { ApiRoutes, FriendsTab, SocketActions } from "../config/enums";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState } from "../state/user/slice";
import { selectFriendState, setFriends, setPossibleUsers } from "../state/friends/slice";
import { selectMainState, setFriendNotification, setFriendTab } from "../state/main/slice";
import { IUser } from "../types/models.types";
import { SocketIOClient } from "../components/app";
import Request from "../common/request";
import { NO_PHOTO } from "../config";

import styles from "../styles/pages/friends.module.scss";

export default function Friends() {
    const [mainTab, setMainTab] = React.useState(0);
    const [loading, setLoading] = React.useState(false);

    const { user } = useAppSelector(selectUserState);
    const { friends, possibleUsers } = useAppSelector(selectFriendState);
    const { friendNotification, friendTab } = useAppSelector(selectMainState);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const socket = React.useContext(SocketIOClient);

    // Открытие 0 вкладки при клике на меню
    React.useEffect(() => {
        if (router.query.mainTab) {
            onChangeMainTab(Number(router.query.mainTab));

            if (router.query.tab) {
                dispatch(setFriendTab(Number(router.query.tab)));
            }
        }
    }, [router]);

    React.useEffect(() => {
        if (mainTab === MainFriendTabs.allRequests && friendTab === 3 && user) {
            requestFriends(user.id, FriendsTab.friendRequests, true)
        }
    }, [friendNotification]);

    // Получение друзей в зависимости от вкладок
    React.useEffect(() => {
        if (user) {
            setLoading(true);

            const currentTab = mainTab === MainFriendTabs.search
                ? FriendsTab.search
                : friendTab;

            requestFriends(user.id, currentTab);
        }
    }, [user, mainTab, friendTab]);

    // Получение только топ-5 возможных друзей
    React.useEffect(() => {
        if (user) {
            Request.post(ApiRoutes.getPossibleUsers, { userId: user.id }, setLoading, 
                (data: { success: boolean, possibleUsers: IUser[] }) => dispatch(setPossibleUsers(data.possibleUsers)), 
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user, friends]);

    const onChangeMainTab = (newValue: number) => {
        setMainTab(newValue);

        switch (newValue) {
            case MainFriendTabs.allFriends: dispatch(setFriendTab(FriendsTab.all)); break;
            case MainFriendTabs.allRequests: dispatch(setFriendTab(FriendsTab.friendRequests)); break;
            case MainFriendTabs.search: dispatch(setFriendTab(FriendsTab.search)); break;
        }
    };

    // Запрос на получение списка пользователей для вкладки
    const requestFriends = (userId: string, tab: number, refresh = false) => {
        Request.post(ApiRoutes.getFriends, { userId, tab }, undefined, 
            (data: { success: boolean, friends: IUser[] }) => {
                dispatch(setFriends(data.friends));

                // Обновляем уведомления у пункта "Друзья"
                if (tab === FriendsTab.friendRequests && !refresh) {
                    dispatch(setFriendNotification(data.friends.length));
                }
            }, 
            (error: any) => CatchErrors.catch(error, router, dispatch)
        );
    };

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

    return <Grid container spacing={2}>
        <Grid item xs={8}>
            <Paper className={styles["friends-container--paper-block"]}>
                {
                    loading
                        ? <Stack spacing={1}>
                            <Skeleton variant="rectangular" width={210} height={118} />
                            <Skeleton variant="text" />
                            <Skeleton variant="text" />
                        </Stack>
                        : <FriendsList friends={friends} mainTab={mainTab} userId={user?.id} onChangeMainTab={onChangeMainTab} />
                }
            </Paper>
        </Grid>

        <Grid item container xs={4} direction="column" spacing={2}>
            <Grid item>
                <Paper className={styles["friends-container--paper-block"]}>
                    <Box className={styles["friends-container_block--box-container"]}>
                        <Tabs value={mainTab} onChange={(_, newValue) => onChangeMainTab(newValue)} aria-label="main-friends-tabs" orientation="vertical">
                            <Tab label="Мои друзья" id="all-friends" aria-controls="all-friends" className={styles["friends-container_block--tab"]} />
                            <Tab
                                label={friendNotification ? <Badge color="primary" badgeContent=" " variant="dot">Заявки в друзья</Badge> : "Заявки в друзья"}
                                id="all-requests"
                                aria-controls="all-requests"
                                className={styles["friends-container_block--tab"]}
                            />
                            <Tab label="Поиск друзей" id="search-friends" aria-controls="search-friends" className={styles["friends-container_block--tab"]} />
                        </Tabs>
                    </Box>
                </Paper>
            </Grid>

            <Grid item>
                <Paper className={styles["friends-container--paper-block"]}>
                    <div className={styles["friends-container_block--possible-title"]}>Возможные друзья</div>

                    <List className={styles["friends-container_block--possible-friend-item-ul"]}>
                        {
                            loading
                                ? <Stack spacing={1}>
                                    <Skeleton variant="rectangular" width={210} height={118} />
                                    <Skeleton variant="text" />
                                    <Skeleton variant="text" />
                                </Stack>
                                : possibleUsers && possibleUsers.length
                                    ? possibleUsers.map(posUser => {
                                        const userName = posUser.firstName + " " + posUser.thirdName;

                                        return <ListItem className={styles["friends-container_block--possible-friend-item"]} key={posUser.id}>
                                            <ListItemAvatar className={styles["friends-container_block--possible-friend-avatar"]}>
                                                <Avatar alt={userName} src={posUser.avatarUrl ? posUser.avatarUrl : NO_PHOTO} />
                                            </ListItemAvatar>

                                            <ListItemText
                                                className={styles["friends-container_block--possible-friend-name"]}
                                                primary={userName}
                                                secondary={
                                                    <span className={styles["friends-container_block--possible-friend-action-block"]} onClick={_ => onAddUser(posUser.id)}>
                                                        <AddIcon className={styles["friends-container_block--possible-friend-icon"]} />
                                                        <span className={styles["friends-container_block--possible-add-to-friend"]}>Добавить в друзья</span>
                                                    </span>
                                                }
                                            />
                                        </ListItem>
                                    })
                                    : <div className={styles["friends-container_block--no-possible-friend"]}>
                                        На данный момент в системе нет других пользователей
                                    </div>
                        }
                    </List>
                </Paper>
            </Grid>
        </Grid>
    </Grid >
};