import React from "react";
import { useRouter } from "next/router";
import { Avatar, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, Box, Tabs, Tab, Stack, Skeleton, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FriendsList, { MainFriendTabs } from "../components/friends-module/friends-list";
import CatchErrors from "../core/catch-errors";
import { ApiRoutes, FriendsTab, SocketActions } from "../types/enums";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState } from "../state/user/slice";
import { selectFriendState, setFriends, setPossibleUsers } from "../state/friends/slice";
import { selectMainState, setFriendNotification, setFriendTab } from "../state/main/slice";
import { IUser } from "../types/models.types";
import { SocketIOClient } from "../components/socket-io-provider";
import Request from "../core/request";
import { NO_PHOTO } from "../common";

import styles from "../styles/pages/friends.module.scss";

// Массив скелетонов
export const skeletonsPossibleFriends: JSX.Element[] = new Array(5).fill(
    <div className={styles["skeleton-container__block"]}>
        <Skeleton variant="circular" className={styles["skeleton-container__img"]} />
        <Skeleton variant="text" className={styles["skeleton-container__text"]} />
    </div>
);

export default function Friends() {
    const [mainTab, setMainTab] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [loadingContent, setLoadingContent] = React.useState(false);

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

    // Получение друзей в зависимости от вкладок контента
    React.useEffect(() => {
        updateFriends(true);
    }, [friendTab]);

    // Получение друзей в зависимости от главных вкладок
    React.useEffect(() => {
        updateFriends();
    }, [user, mainTab]);

    // Получение только топ-5 возможных друзей
    React.useEffect(() => {
        if (user) {
            Request.post(ApiRoutes.getPossibleUsers, { userId: user.id }, setLoadingContent,
                (data: { success: boolean, possibleUsers: IUser[] }) => dispatch(setPossibleUsers(data.possibleUsers)),
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user, friends]);

    const updateFriends = (updateFromContent = false) => {
        if (user) {
            const loadingCb = updateFromContent ? setLoadingContent : setLoading;

            const currentTab = mainTab === MainFriendTabs.search
                ? FriendsTab.search
                : friendTab;

            requestFriends(user.id, currentTab, false, loadingCb);
        }
    };

    const onChangeMainTab = (newValue: number) => {
        setMainTab(newValue);

        switch (newValue) {
            case MainFriendTabs.allFriends: dispatch(setFriendTab(FriendsTab.all)); break;
            case MainFriendTabs.allRequests: dispatch(setFriendTab(FriendsTab.friendRequests)); break;
            case MainFriendTabs.search: dispatch(setFriendTab(FriendsTab.search)); break;
        }
    };

    // Запрос на получение списка пользователей для вкладки
    const requestFriends = (
        userId: string, 
        tab: number, 
        refresh = false, 
        loadingCb: undefined | ((value: React.SetStateAction<boolean>) => void) = undefined
    ) => {
        Request.post(ApiRoutes.getFriends, { userId, tab }, loadingCb,
            (data: { success: boolean, friends: IUser[] }) => {
                if (data.success) {
                    dispatch(setFriends(data.friends));

                    // Обновляем уведомления у пункта "Друзья"
                    if (tab === FriendsTab.friendRequests && !refresh) {
                        dispatch(setFriendNotification(data.friends.length));
                    }
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
        {/* Блок основного контента */}
        <Grid item xs={8}>
            <Paper className="paper-block">
                <div className={styles["content-container"]}>
                    {loading
                        ? <Stack spacing={1} className={styles["skeleton-container"]}>
                            <div className={styles["skeleton-container__row"]}>
                                <Skeleton variant="text" className={styles["skeleton-container__text"]} />
                                <Skeleton variant="text" className={styles["skeleton-container__text"]} />
                            </div>

                            <Skeleton variant="rectangular" className={styles["skeleton-container__input"]} />

                            {skeletonsPossibleFriends.map((skeleton, index) => {
                                return <div key={"content-container " + index} className={styles["skeleton-container__row"]}>
                                    {skeleton}
                                </div>
                            })}
                        </Stack>
                        : <FriendsList 
                            friends={friends} 
                            mainTab={mainTab} 
                            userId={user?.id} 
                            loadingContent={loadingContent} 
                            onChangeMainTab={onChangeMainTab} 
                        />
                    }
                </div>
            </Paper>
        </Grid>

        <Grid item container xs={4} direction="column" spacing={2}>
            {/* Блок главного меню */}
            <Grid item>
                <Paper className="paper-block">
                    <Box className={styles["main-menu-container__block"]}>
                        <Tabs
                            value={mainTab}
                            onChange={(_, newValue) => onChangeMainTab(newValue)}
                            aria-label="main-friends-tabs"
                            orientation="vertical"
                        >
                            <Tab
                                label="Мои друзья"
                                id="all-friends"
                                aria-controls="all-friends"
                                className={styles["main-menu-container__tab"] + " label-tab"}
                            />
                            <Tab
                                label={friendNotification
                                    ? <Badge color="primary" badgeContent=" " variant="dot">Заявки в друзья</Badge>
                                    : "Заявки в друзья"
                                }
                                id="all-requests"
                                aria-controls="all-requests"
                                className={styles["main-menu-container__tab"] + " label-tab"}
                            />
                            <Tab
                                label="Поиск друзей"
                                id="search-friends"
                                aria-controls="search-friends"
                                className={styles["main-menu-container__tab"] + " label-tab"}
                            />
                        </Tabs>
                    </Box>
                </Paper>
            </Grid>

            {/* Блок возможных друзей */}
            <Grid item>
                <Paper className={styles["possible-container"] + " paper-block"}>
                    <div className="block-title">Возможные друзья</div>

                    <div className={styles["possible-container__block"]}>
                        {loading
                            ? <div className={styles["skeleton-container"]}>
                                {skeletonsPossibleFriends.map((skeleton, index) => {
                                    return <div key={"possible-container " + index} className={styles["skeleton-container__row"]}>
                                        {skeleton}
                                    </div>
                                })}
                            </div>
                            : possibleUsers && possibleUsers.length
                                ? <List className={styles["possible-container__list"]}>
                                    {possibleUsers.map(posUser => {
                                        const userName = posUser.firstName + " " + posUser.thirdName;

                                        return <ListItem className={styles["possible-container__item"]} key={posUser.id}>
                                            <ListItemAvatar className={styles["possible-container__item-avatar"]}>
                                                <Avatar alt={userName} src={posUser.avatarUrl ? posUser.avatarUrl : NO_PHOTO} />
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
        </Grid>
    </Grid >
};