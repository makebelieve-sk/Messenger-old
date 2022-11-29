import React from "react";
import { useRouter } from "next/router";
import { MenuItem, MenuList, Paper, Stack, Badge } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { ApiRoutes, FriendsTab, Pages } from "../../config/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { selectMainState, setFriendNotification } from "../../state/main/slice";
import CatchErrors from "../../axios/catch-errors";
import { IUser } from "../../types/models.types";
import { MainFriendTabs } from "../friends-module/friends-list";
import Request from "../../common/request";

import styles from "./menu.module.scss";

export default function MenuComponent() {
    const { friendNotification } = useAppSelector(selectMainState);
    const { user } = useAppSelector(selectUserState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Получаем уведомления для отрисовки в Badge
    React.useEffect(() => {
        if (user) {
            Request.post(ApiRoutes.getFriends, { userId: user.id, tab: FriendsTab.friendRequests }, undefined, 
                (data: { success: boolean, friends: IUser[] }) => dispatch(setFriendNotification(data.friends.length)), 
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user]);

    return <div id="menu-container" className={styles["menu-container"]}>
        <Stack direction="column" spacing={2}>
            <nav>
                <MenuList id="menu-list" className={styles["menu-container__menu-list"]}>
                    <MenuItem onClick={() => router.push(Pages.profile)} className={styles["menu-container__menu-item"]}>
                        <AccountCircleOutlinedIcon color="primary" /><span>Моя страница</span>
                    </MenuItem>

                    <MenuItem onClick={() => router.push(Pages.messages)} className={styles["menu-container__menu-item"]}>
                        <MessageOutlinedIcon color="primary" /><span>Мессенджер</span>
                    </MenuItem>

                    <MenuItem 
                        onClick={() => router.push({ pathname: Pages.friends, query: { mainTab: MainFriendTabs.allFriends } })} 
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
};