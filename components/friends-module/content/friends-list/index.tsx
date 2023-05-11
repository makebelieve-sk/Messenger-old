import React from "react";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useAppDispatch, useAppSelector } from "../../../../hooks/useGlobalState";
import { selectFriendState, setFriends, setPossibleUsers } from "../../../../state/friends/slice";
import { selectMainState, setFriendNotification } from "../../../../state/main/slice";
import { selectMessagesState, setTempChat } from "../../../../state/messages/slice";
import { IUser } from "../../../../types/models.types";
import { SocketIOClient } from "../../../socket-io-provider";
import AvatarWithBadge from "../../../avatarWithBadge";
import { NO_PHOTO } from "../../../../common";
import { ApiRoutes, FriendsNoticeTypes, FriendsTab, Pages, SocketActions } from "../../../../types/enums";
import CatchErrors from "../../../../core/catch-errors";
import Request from "../../../../core/request";

import styles from "./friends-list.module.scss";

export interface ITempChatId {
    chatId: string;
    userFrom: string;
    userTo: string;
};

interface IFriendsList {
    friends: IUser[] | null;
    userId?: string | null;
    friendTab: number;
    onChangeMainTab: (tab: number) => void;
};

export default React.memo(function FriendsList({ friends, userId, friendTab, onChangeMainTab }: IFriendsList) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLOrSVGElement | null | any>(null);
    const [isAdded, setIsAdded] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const { possibleUsers } = useAppSelector(selectFriendState);
    const { onlineUsers } = useAppSelector(selectMainState);
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

                    if (!data.chatId) {
                        dispatch(setTempChat({ chatId, userFrom: userId, userTo: friend.id }));
                        
                        // Отправляем временный chatId по сокету на сервер (случай, если два пользователя впервые (без истории сообщений) открыли чат для друг друга)
                        if (socket) socket.emit(SocketActions.SET_TEMP_CHAT_ID, { chatId, userFrom: userId, userTo: friend.id } as ITempChatId);
                    }

                    onWrite(chatId);
                },
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        } else {
            CatchErrors.catch("Не указан id друга", router, dispatch);
        }
    };

    // Отрисовка контента вкладки
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
                            () => dispatch(setFriendNotification(FriendsNoticeTypes.REMOVE))
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
                            () => dispatch(setFriendNotification(FriendsNoticeTypes.REMOVE))
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
                                onClick={_ => onButtonAction(
                                    friendId,
                                    ApiRoutes.addToFriend,
                                    SocketActions.ADD_TO_FRIENDS,
                                    possibleUsers,
                                    setPossibleUsers,
                                    () => setIsAdded(friendId ? friendId : "")
                                )}
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
        {
            friends && friends.length
                ? friends.map(friend => {
                    const userName = friend.firstName + " " + friend.thirdName;

                    return <ListItem className={styles["friends-list-container__item"]} key={friend.id}>
                        <ListItemAvatar className={styles["friends-list-container__item__avatar-block"]}>
                            <AvatarWithBadge
                                isOnline={Boolean(onlineUsers.find(onlineUser => onlineUser.id === friend.id))}
                                chatAvatar={friend.avatarUrl ? friend.avatarUrl : NO_PHOTO}
                                alt={userName}
                                avatarClassName="friends-list-container__item__avatar"
                                size={80}
                                pushLeft={true}
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
                                    className={styles["friends-list-container__item__popover-icon"]}
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
                                        className={styles["friends-list-container__item__popover-icon__delete"]}
                                        onClick={_ => onButtonAction(friend.id, ApiRoutes.deleteFriend, undefined, friends, setFriends, () => setAnchorEl(null))}
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
    </>
});