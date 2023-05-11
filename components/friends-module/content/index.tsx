import React from "react";
import List from "@mui/material/List";
import FriendsList from "./friends-list";
import { IUser } from "../../../types/models.types";
import SkeletonBlock from "../../skeleton-block";

import styles from "./friends.module.scss";

interface IFriendsList {
    friends: IUser[] | null;
    userId?: string | null;
    friendTab: number;
    loadingContent: boolean;
    onChangeMainTab: (tab: number) => void;
};

export default React.memo(function Content({ friends, userId, friendTab, loadingContent, onChangeMainTab }: IFriendsList) {
    return <>
        <List className={styles["friends-list-container__list"]}>
            {loadingContent
                ? <SkeletonBlock 
                    keyProp="friends-list-container "
                    className={styles["skeleton-container__row"] + " " + styles["friends-list-container__skeleton-container"]} 
                />
                : <FriendsList 
                    friendTab={friendTab}
                    friends={friends}
                    userId={userId}
                    onChangeMainTab={onChangeMainTab}
                />
            }
        </List>
    </>
});