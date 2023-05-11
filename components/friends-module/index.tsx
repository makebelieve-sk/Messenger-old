import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { requestFriendsType } from "../../pages/friends";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectFriendState, setSearchValue } from "../../state/friends/slice";
import { selectUserState } from "../../state/user/slice";
import Content from "./content";
import MainMenu from "./main-menu";
import PossibleFriends from "./possible-friends";
import SkeletonBlock from "../skeleton-block";
import TabsComponent from "./content/tabs";

import styles from "./friends.module.scss";

interface IFriendsModule {
    loading: boolean;
    loadingContent: boolean;
    mainTab: number;
    friendTab: number;
    onChangeMainTab: (newValue: number) => void;
    setFriendTab: React.Dispatch<React.SetStateAction<number>>;
    requestFriends: requestFriendsType;
    updateFriends: (updateFromContent: boolean, zeroing: boolean, tab?: number | null) => void;
};

export default React.memo(function FriendsModule({ loading, loadingContent, mainTab, friendTab, onChangeMainTab, setFriendTab, requestFriends, updateFriends }: IFriendsModule) {
    const { user } = useAppSelector(selectUserState);
    const { friends, searchValue } = useAppSelector(selectFriendState);

    const dispatch = useAppDispatch();

    return <Grid container spacing={2}>
        {/* Блок основного контента */}
        <Grid item xs={8}>
            <Paper className="paper-block">
                <div className={styles["content-container"]}>
                    {/* Основные вкладки страницы "Друзья" */}
                    <TabsComponent 
                        mainTab={mainTab} 
                        friendTab={friendTab} 
                        setFriendTab={setFriendTab} 
                        updateFriends={updateFriends} 
                    />

                    {/* Поле поиска */}
                    <TextField
                        id="standard-input"
                        label="Поиск"
                        variant="standard"
                        fullWidth
                        className={styles["friends-list-container__search"]}
                        size="small"
                        value={searchValue}
                        onChange={event => dispatch(setSearchValue(event.target.value))}
                    />
                    
                    {loading
                        ? <Stack spacing={1} className={styles["skeleton-container"]}>
                            <div className={styles["skeleton-container__row"]}>
                                <Skeleton variant="text" className={styles["skeleton-container__text"]} />
                                <Skeleton variant="text" className={styles["skeleton-container__text"]} />
                            </div>

                            <Skeleton variant="rectangular" className={styles["skeleton-container__input"]} />

                            <SkeletonBlock keyProp="content-container " className={styles["skeleton-container__row"]} />
                        </Stack>
                        : friends && user
                            ? <Content
                                friends={friends}
                                userId={user.id}
                                friendTab={friendTab}
                                loadingContent={loadingContent}
                                onChangeMainTab={onChangeMainTab}
                            />
                            : null
                    }
                </div>
            </Paper>
        </Grid>

        <Grid item container xs={4} direction="column" spacing={2}>
            {/* Блок главного меню */}
            <MainMenu mainTab={mainTab} onChangeMainTab={onChangeMainTab} />

            {/* Блок возможных друзей */}
            <PossibleFriends friendTab={friendTab} loading={loading} requestFriends={requestFriends} />
        </Grid>
    </Grid >
});