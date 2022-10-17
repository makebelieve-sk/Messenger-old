import React from "react";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import { Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, Chip, Box, TextField, Tabs, Tab, Badge, Popover, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { IUser } from "../../types/models.types";
import { ApiRoutes, FriendsTab, Pages, SocketActions } from "../../config/enums";
import Request from "../../common/request";
import CatchErrors from "../../axios/catch-errors";
import { selectFriendState, setFriends, setPossibleUsers } from "../../state/friends/slice";
import { selectMainState, setFriendNotification, setFriendTab } from "../../state/main/slice";
import { selectMessagesState, setTempChat } from "../../state/messages/slice";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { SocketIOClient } from "../app";
import { NO_PHOTO } from "../../config";

import styles from "./friends.module.scss";

export interface ITempChatId { 
    chatId: string; 
    userFrom: string; 
    userTo: string;
};

interface IFriendsList {
    mainTab: number;
    friends: IUser[] | null;
    userId?: string | null;
    onChangeMainTab: (tab: number) => void;
};

export enum MainFriendTabs {
    allFriends = 0,
    allRequests = 1,
    search = 2,
};

export default function FriendsList({ mainTab, friends, userId, onChangeMainTab }: IFriendsList) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [isAdded, setIsAdded] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const { possibleUsers } = useAppSelector(selectFriendState);
    const { friendNotification, friendTab } = useAppSelector(selectMainState);
    const { tempChats } = useAppSelector(selectMessagesState);

    const router = useRouter();
    const popoverId = Boolean(anchorEl) ? "popover-list-item" : undefined;
    const dispatch = useAppDispatch();
    const socket = React.useContext(SocketIOClient);

    // Обработка кликов по кнопкам действия в разных вкладках
    const onButtonAction = (
        friendId: string | null,
        route: ApiRoutes,
        socketAction: SocketActions | undefined = undefined,
        arrayData: IUser[] | null = friends,
        setter: ActionCreatorWithPayload<IUser[] | null, string> = setFriends,
        callback?: () => void
    ) => {
        if (userId && friendId && arrayData) {
            // Коллбек при успехе
            const successCb = () => {
                if (callback) callback();

                const findUser = arrayData.find(user => user.id === friendId);

                if (findUser) {
                    const indexOf = arrayData.indexOf(findUser);

                    if (findUser && indexOf >= 0) {
                        dispatch(setter([...arrayData.slice(0, indexOf), ...arrayData.slice(indexOf + 1)]));

                        if (socket && socketAction) {
                            socket.emit(SocketActions.FRIENDS, { type: socketAction, payload: { to: friendId } });
                        }
                    }
                }
            };

            // Коллбек при провале
            const failedCb = (error: any) => {
                /**
                 * Обработка ошибок:
                 * 500: при ошибке сервера { null }
                */
                setIsAdded("");
                CatchErrors.catch(error, router, dispatch);
            };

            Request.post(route, { userId, friendId }, setLoading, successCb, failedCb);
        } else {
            CatchErrors.catch("Нет id пользователя", router, dispatch);
        }
    };

    const renderTabs = (mainTab: number) => {
        const tabsArray: JSX.Element[] = [];

        switch (mainTab) {
            case MainFriendTabs.allFriends:
                tabsArray.push(<Tab
                    key={FriendsTab.all}
                    label="Все друзья"
                    value={FriendsTab.all}
                    id="friends"
                    aria-controls="friends"
                    className={styles["friends-container_block--tab"]}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.online}
                    label="Друзья онлайн"
                    value={FriendsTab.online}
                    id="friends-online"
                    aria-controls="friends-online"
                    className={styles["friends-container_block--tab"]}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.subscribers}
                    label="Подписчики"
                    value={FriendsTab.subscribers}
                    id="subscribers"
                    aria-controls="subscribers"
                    className={styles["friends-container_block--tab"]}
                />);
                break;
            case MainFriendTabs.allRequests:
                const labelWithNotifications = friendNotification ? <Badge color="primary" badgeContent=" " variant="dot">Заявки в друзья</Badge> : "Заявки в друзья";

                tabsArray.push(<Tab
                    key={FriendsTab.friendRequests}
                    label={labelWithNotifications}
                    value={FriendsTab.friendRequests}
                    id="friend-requests"
                    aria-controls="friend-requests"
                    className={styles["friends-container_block--tab"]}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.incomingRequests}
                    label="Исходящие заявки"
                    value={FriendsTab.incomingRequests}
                    id="incoming-requests"
                    aria-controls="incoming-requests"
                    className={styles["friends-container_block--tab"]}
                />);
                break;
            case MainFriendTabs.search:
            default:
                break;
        }

        return tabsArray;
    };

    // Отправка сообщения другу
    const writeMessage = (friend: IUser | null) => {
        if (friend && friend.id && userId) {
            const onWrite = (chatId: string) => {
                // Не показываем в url-строке данные поля query, для этого передаем второй параметр
                router.push({
                    pathname: Pages.messages + "/" + chatId,
                    query: { friendId: friend.id, friendName: friend.firstName + " " + friend.thirdName, friendAvatarUrl: friend.avatarUrl }
                }, Pages.messages + "/" + chatId);
            };

            // Проверяем chatId в глобальном состоянии
            if (tempChats) {
                const tempChatsEntries = Object.entries(tempChats);

                if (tempChatsEntries && tempChatsEntries.length) {
                    const findEntry = tempChatsEntries.find(tempChat => 
                        (tempChat[1].userFrom === friend.id || tempChat[1].userFrom === userId) && 
                        (tempChat[1].userTo === userId || tempChat[1].userTo === friend.id)
                    );

                    if (findEntry) {
                        onWrite(findEntry[0]);
                        return;
                    }
                }
            }

            // Получаем chatId с сервера
            Request.post(ApiRoutes.getChatId, { userId, friendId: friend.id }, undefined,
                (data: { success: boolean, chatId: string }) => {
                    const chatId = data.chatId ? data.chatId : uuid();

                    dispatch(setTempChat({ chatId, userFrom: userId, userTo: friend.id }));
                    onWrite(chatId);

                    // Отправляем временный chatId по сокету на сервер (случай, если два пользователя впервые (без истории сообщений) открыли чат для друг друга)
                    if (socket) socket.emit(SocketActions.SET_TEMP_CHAT_ID, { chatId, userFrom: userId, userTo: friend.id } as ITempChatId);
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        } else {
            CatchErrors.catch("Не указан id друга", router, dispatch);
        }
    };

    const renderItemSecondary = (tab: number, friend: IUser | null = null) => {
        const friendId = friend && friend.id ? friend.id : null;

        switch (tab) {
            case FriendsTab.all:
            case FriendsTab.online: {
                const component = <span className={styles["all-friends-container_block--write-message"]} onClick={_ => writeMessage(friend)}>
                    Написать сообщение
                </span>;

                return {
                    component,
                    nonText: "На данный момент список друзей пуст",
                    button: <Button variant="outlined" className={styles["friends-container_block--box-container--button"]} onClick={_ => onChangeMainTab(2)}>
                        Найти друзей
                    </Button>
                };
            }
            case FriendsTab.subscribers: {
                const component = <Button
                    variant="outlined"
                    className={styles["all-friends-container_block--accept-friend"]}
                    color="success"
                    onClick={_ => onButtonAction(friendId, ApiRoutes.acceptUser)}
                >
                    Добавить в друзья
                </Button>;

                return { component, nonText: "На данный момент список подписчиков пуст" };
            }
            case FriendsTab.friendRequests: {
                const component = <span className={styles["all-friends-container_block--accept-block"]}>
                    <Button
                        variant="outlined"
                        className={styles["all-friends-container_block--accept-friend"]}
                        color="success"
                        onClick={_ => onButtonAction(friendId, ApiRoutes.acceptUser, undefined, friends, undefined, () => dispatch(setFriendNotification(friendNotification - 1)))}
                    >
                        Принять
                    </Button>

                    <Button
                        variant="outlined"
                        className={styles["all-friends-container_block--accept-friend-reject"]}
                        color="error"
                        onClick={_ => onButtonAction(friendId, ApiRoutes.leftInSubscribers, undefined, friends, undefined, () => dispatch(setFriendNotification(friendNotification - 1)))}
                    >
                        Оставить в подписчиках
                    </Button>
                </span>;

                return { component, nonText: "На данный момент заявок в друзья нет" };
            }
            case FriendsTab.incomingRequests: {
                const component = loading
                    ? <RestartAltIcon />
                    : <Button
                        variant="outlined"
                        className={styles["all-friends-container_block--accept-friend-reject"]}
                        color="error"
                        onClick={_ => onButtonAction(friendId, ApiRoutes.unsubscribeUser, SocketActions.UNSUBSCRIBE)}
                    >
                        Отписаться
                    </Button>;

                return { component, nonText: "На данный момент исходящих заявок в друзья нет" };
            }
            case FriendsTab.search: {
                const component = loading
                    ? <RestartAltIcon />
                    : isAdded && isAdded === friendId
                        ? <Chip
                            icon={<DoneIcon className={styles["all-friends-container_block--chip-icon"]} />}
                            label={<span className={styles["all-friends-container_block--chip"]}>Пользователь успешно добавлен в друзья</span>}
                            color="success"
                            variant="outlined"
                            className={styles["all-friends-container_block--chip-block"]}
                        />
                        : <span
                            className={styles["all-friends-container_block--friend-action-block"]}
                            onClick={_ => onButtonAction(friendId, ApiRoutes.addToFriend, SocketActions.ADD_TO_FRIENDS, possibleUsers, setPossibleUsers, () => setIsAdded(friendId ? friendId : ""))}
                        >
                            <AddIcon className={styles["all-friends-container_block--friend-icon"]} />
                            <span className={styles["all-friends-container_block--add-to-friend"]}>Добавить в друзья</span>
                        </span>;

                return { component, nonText: "На данный момент список возможных друзей пуст" };
            }
            default:
                return null;
        }
    };

    return <>
        {
            renderTabs(mainTab) && renderTabs(mainTab).length
                ? <Box className={styles["friends-container_block--box-container"]}>
                    <Tabs value={friendTab} onChange={(_, newValue) => dispatch(setFriendTab(newValue))} aria-label="friends-tabs">
                        {renderTabs(mainTab).map(tab => tab)}
                    </Tabs>
                </Box>
                : null
        }

        <TextField id="standard-input" label="Поиск" variant="standard" fullWidth className={styles["friends-container_block--search-field"]} />

        <List className={styles["all-friends-container_block-ul"]}>
            {
                friends && friends.length
                    ? friends.map(friend => {
                        const userName = friend.firstName + " " + friend.thirdName;

                        return <ListItem className={styles["all-friends-container_block"]} key={friend.id}>
                            <ListItemAvatar className={styles["all-friends-container_block--friend-avatar-block"]}>
                                <Avatar alt={userName} src={friend.avatarUrl ? friend.avatarUrl : NO_PHOTO} className={styles["all-friends-container_block--friend-avatar"]} />
                            </ListItemAvatar>

                            <ListItemText
                                className={styles["all-friends-container_block--friend-name"]}
                                primary={userName}
                                disableTypography={true}
                                secondary={renderItemSecondary(friendTab, friend)?.component}
                            />

                            {
                                friendTab === FriendsTab.all || friendTab === FriendsTab.online
                                    ? <>
                                        <MoreHorizIcon sx={{ cursor: "pointer" }} aria-describedby={popoverId} onClick={event => setAnchorEl(event.currentTarget)} />
                                        <Popover
                                            id={popoverId}
                                            open={Boolean(anchorEl)}
                                            anchorEl={anchorEl}
                                            onClose={() => setAnchorEl(null)}
                                            anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "left",
                                            }}
                                        >
                                            <Typography sx={{ p: 2, cursor: "pointer", fontSize: 14 }} onClick={_ => onButtonAction(friend.id, ApiRoutes.deleteFriend)}>
                                                Удалить из друзей
                                            </Typography>
                                        </Popover>
                                    </>
                                    : null
                            }
                        </ListItem>
                    })
                    : <div className={styles["friends-container_block--no-friends"]}>
                        {renderItemSecondary(friendTab)?.nonText}
                        {renderItemSecondary(friendTab)?.button}
                    </div>
            }
        </List>
    </>
};