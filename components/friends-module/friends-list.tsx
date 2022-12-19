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
import { ApiRoutes, FriendsTab, Pages, SocketActions } from "../../types/enums";
import Request from "../../core/request";
import CatchErrors from "../../core/catch-errors";
import { selectFriendState, setFriends, setPossibleUsers } from "../../state/friends/slice";
import { selectMainState, setFriendNotification, setFriendTab } from "../../state/main/slice";
import { selectMessagesState, setTempChat } from "../../state/messages/slice";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { SocketIOClient } from "../socket-io-provider";
import { NO_PHOTO } from "../../common";
import { skeletonsPossibleFriends } from "../../pages/friends";

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
    loadingContent: boolean;
    onChangeMainTab: (tab: number) => void;
};

export enum MainFriendTabs {
    allFriends = 0,
    allRequests = 1,
    search = 2,
};

export default function FriendsList({ mainTab, friends, userId, loadingContent, onChangeMainTab }: IFriendsList) {
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

    // Отрисовка вкладок
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
                    className={styles["friends-list-container__tab"] + " label-tab"}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.online}
                    label="Друзья онлайн"
                    value={FriendsTab.online}
                    id="friends-online"
                    aria-controls="friends-online"
                    className={styles["friends-list-container__tab"] + " label-tab"}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.subscribers}
                    label="Подписчики"
                    value={FriendsTab.subscribers}
                    id="subscribers"
                    aria-controls="subscribers"
                    className={styles["friends-list-container__tab"] + " label-tab"}
                />);
                break;
            case MainFriendTabs.allRequests:
                const labelWithNotifications = friendNotification
                    ? <Badge color="primary" badgeContent=" " variant="dot">Заявки в друзья</Badge>
                    : "Заявки в друзья";

                tabsArray.push(<Tab
                    key={FriendsTab.friendRequests}
                    label={labelWithNotifications}
                    value={FriendsTab.friendRequests}
                    id="friend-requests"
                    aria-controls="friend-requests"
                    className={styles["friends-list-container__tab"] + " label-tab"}
                />);
                tabsArray.push(<Tab
                    key={FriendsTab.incomingRequests}
                    label="Исходящие заявки"
                    value={FriendsTab.incomingRequests}
                    id="incoming-requests"
                    aria-controls="incoming-requests"
                    className={styles["friends-list-container__tab"] + " label-tab"}
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
                const pathname = Pages.messages + "/" + chatId;

                // Не показываем в url-строке данные поля query, для этого передаем второй параметр
                router.push({
                    pathname,
                    query: {
                        friendId: friend.id,
                        friendName: friend.firstName + " " + friend.thirdName,
                        friendAvatarUrl: friend.avatarUrl
                    }
                }, pathname);
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
                const component =
                    <span className={styles["friends-list-container__item__write-message"]} onClick={_ => writeMessage(friend)}>
                        Написать сообщение
                    </span>;

                return {
                    component,
                    nonText: "На данный момент список друзей пуст",
                    button:
                        <Button
                            variant="outlined"
                            className={styles["friends-list-container__no-friends__button"]}
                            onClick={_ => onChangeMainTab(2)}
                        >
                            Найти друзей
                        </Button>
                };
            }
            case FriendsTab.subscribers: {
                const component = <Button
                    variant="outlined"
                    className={styles["friends-list-container__item__action"]}
                    color="success"
                    onClick={_ => onButtonAction(friendId, ApiRoutes.acceptUser)}
                >
                    Добавить в друзья
                </Button>;

                return { component, nonText: "На данный момент список подписчиков пуст" };
            }
            case FriendsTab.friendRequests: {
                const component = <span className={styles["friends-list-container__item__accept-block"]}>
                    <Button
                        variant="outlined"
                        className={styles["friends-list-container__item__action"]}
                        color="success"
                        onClick={_ => onButtonAction(
                            friendId,
                            ApiRoutes.acceptUser,
                            undefined,
                            friends,
                            undefined,
                            () => dispatch(setFriendNotification(friendNotification - 1))
                        )}
                    >
                        Принять
                    </Button>

                    <Button
                        variant="outlined"
                        className={styles["friends-list-container__item__action"]}
                        color="error"
                        onClick={_ => onButtonAction(
                            friendId,
                            ApiRoutes.leftInSubscribers,
                            undefined,
                            friends,
                            undefined,
                            () => dispatch(setFriendNotification(friendNotification - 1))
                        )}
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
                        className={styles["friends-list-container__item__action"]}
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
                    : <div className={styles["friends-list-container__item__wrap"]}>
                        {isAdded && isAdded === friendId
                            ? <Chip
                                icon={<DoneIcon className={styles["friends-list-container__item__chip-icon"]} />}
                                label={<span className={styles["friends-list-container__item__chip"]}>Пользователь успешно добавлен</span>}
                                color="success"
                                variant="outlined"
                            />
                            : <span
                                className={styles["friends-list-container__item__add-block"]}
                                onClick={_ => onButtonAction(friendId, ApiRoutes.addToFriend, SocketActions.ADD_TO_FRIENDS, possibleUsers, setPossibleUsers, () => setIsAdded(friendId ? friendId : ""))}
                            >
                                <AddIcon className={styles["friends-list-container__item__add-icon"]} />
                                <span className={styles["friends-list-container__item__add-to-friend"]}>Добавить в друзья</span>
                            </span>
                        }
                    </div>;

                return { component, nonText: "На данный момент список возможных друзей пуст" };
            }
            default:
                return null;
        }
    };

    return <>
        {renderTabs(mainTab) && renderTabs(mainTab).length
            ? <Box className={styles["friends-list-container__tabs"]}>
                <Tabs value={friendTab} onChange={(_, newValue) => dispatch(setFriendTab(newValue))} aria-label="friends-tabs">
                    {renderTabs(mainTab).map(tab => tab)}
                </Tabs>
            </Box>
            : null
        }

        <TextField
            id="standard-input"
            label="Поиск"
            variant="standard"
            fullWidth
            className={styles["friends-list-container__search"]}
            size="small"
        />

        <List className={styles["friends-list-container__list"]}>
            {loadingContent
                ? skeletonsPossibleFriends.map((skeleton, index) => {
                    return <div
                        key={"friends-list-container " + index}
                        className={styles["skeleton-container__row"] + " " + styles["friends-list-container__skeleton-container"]}
                    >
                        {skeleton}
                    </div>
                })
                : friends && friends.length
                    ? friends.map(friend => {
                        const userName = friend.firstName + " " + friend.thirdName;

                        return <ListItem className={styles["friends-list-container__item"]} key={friend.id}>
                            <ListItemAvatar className={styles["friends-list-container__item__avatar-block"]}>
                                <Avatar
                                    alt={userName}
                                    src={friend.avatarUrl ? friend.avatarUrl : NO_PHOTO}
                                    className={styles["friends-list-container__item__avatar"]}
                                />
                            </ListItemAvatar>

                            <ListItemText
                                className={styles["friends-list-container__item__user-name"]}
                                primary={userName}
                                disableTypography={true}
                                secondary={renderItemSecondary(friendTab, friend)?.component}
                            />

                            {friendTab === FriendsTab.all || friendTab === FriendsTab.online
                                ? <>
                                    <MoreHorizIcon
                                        sx={{ cursor: "pointer" }}
                                        aria-describedby={popoverId}
                                        onClick={event => setAnchorEl(event.currentTarget)}
                                    />
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
                                        <Typography
                                            sx={{ p: 2, cursor: "pointer", fontSize: 14 }}
                                            onClick={_ => onButtonAction(friend.id, ApiRoutes.deleteFriend)}
                                        >
                                            Удалить из друзей
                                        </Typography>
                                    </Popover>
                                </>
                                : null
                            }
                        </ListItem>
                    })
                    : <div className={styles["friends-list-container__no-friends"]}>
                        <div className="opacity-text">{renderItemSecondary(friendTab)?.nonText}</div>
                        {renderItemSecondary(friendTab)?.button}
                    </div>
            }
        </List>
    </>
};