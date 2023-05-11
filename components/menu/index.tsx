import React from "react";
import { useRouter } from "next/router";
import Stack from "@mui/material/Stack";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { ApiRoutes, FriendsTab, MainFriendTabs, MessagesNoticeTypes, Pages } from "../../types/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { selectMainState, setFriendNotification, setMessageNotification } from "../../state/main/slice";
import { changeUnReadMessagesCountInDialogs, selectMessagesState } from "../../state/messages/slice";
import CatchErrors from "../../core/catch-errors";
import { IUser } from "../../types/models.types";
import Request from "../../core/request";

import styles from "./menu.module.scss";

export default React.memo(function MenuComponent() {
    const { friendNotification, messageNotification } = useAppSelector(selectMainState);
    const { user } = useAppSelector(selectUserState);
    const { counter, activeChatId } = useAppSelector(selectMessagesState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Получаем уведомления для отрисовки в Badge
    React.useEffect(() => {
        if (user) {
            // Уведомления для друзей
            Request.post(ApiRoutes.getFriends, { userId: user.id, tab: FriendsTab.friendRequests }, undefined, 
                (data: { success: boolean, friends: IUser[] }) => dispatch(setFriendNotification(data.friends.length)), 
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );

            // Уведомления для сообщений
            Request.post(ApiRoutes.getMessageNotification, { userId: user.id }, undefined, 
                (data: { success: boolean, unreadChatIds: string[] }) => dispatch(setMessageNotification({ 
                    type: MessagesNoticeTypes.SET, 
                    notifications: data.unreadChatIds 
                })), 
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user]);

    // Обработка клика по пункту "Мессенжер"
    const onClickMessanger = () => {
        // Обновляем счетчик непрочитанных сообщений для текущего диалога
        if (activeChatId) {
            dispatch(changeUnReadMessagesCountInDialogs({ chatId: activeChatId, counter }));
        }
        
        router.push(Pages.messages)
    };

    // Обработка клика по пункту "Мессенжер"
    const onClickFriends = () => {
        router.push({ pathname: Pages.friends, query: { mainTab: MainFriendTabs.allFriends, tab: FriendsTab.all } })
    };

    return <div id="menu-container" className={styles["menu-container"]}>
        <Stack direction="column" spacing={2}>
            <nav>
                <MenuList id="menu-list" className={styles["menu-container__menu-list"]}>
                    <MenuItem onClick={() => router.push(Pages.profile)} className={styles["menu-container__menu-item"]}>
                        <AccountCircleOutlinedIcon color="primary" /><span>Моя страница</span>
                    </MenuItem>

                    <MenuItem onClick={onClickMessanger} className={styles["menu-container__menu-item"]}>
                        <MessageOutlinedIcon color="primary" />
                        <span>Мессенджер</span>
                        <Badge 
                            color="default" 
                            badgeContent={messageNotification && messageNotification.length ? messageNotification.length : null} 
                            className={styles["menu-container__badge"]} 
                        />
                    </MenuItem>

                    <MenuItem 
                        onClick={onClickFriends} 
                        className={styles["menu-container__menu-item"]}
                    >
                        <PeopleOutlinedIcon color="primary" />
                        <span>Друзья </span>
                        <Badge 
                            color="default" 
                            badgeContent={friendNotification ? friendNotification : null} 
                            className={styles["menu-container__badge"]} 
                        />
                    </MenuItem>
                </MenuList>
            </nav>

            <div className={styles["menu-container__down-info"]}>
                Разработчикам
            </div>
        </Stack>
    </div>
});