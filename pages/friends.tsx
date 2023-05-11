import React from "react";
import { useRouter } from "next/router";
import CatchErrors from "../core/catch-errors";
import Request from "../core/request";
import { ApiRoutes, FriendsTab, MainFriendTabs } from "../types/enums";
import { IUser } from "../types/models.types";
import useDebounce from "../hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState } from "../state/user/slice";
import { selectFriendState, setFriends, setPossibleUsers, setSearchValue } from "../state/friends/slice";
import { selectMainState, setFriendNotification } from "../state/main/slice";
import FriendsModule from "../components/friends-module";

export type requestFriendsType = (
    userId: string, 
    tab: number, 
    refresh?: boolean, 
    loadingCb?: ((value: React.SetStateAction<boolean>) => void) | undefined
) => void;

export default function Friends() {
    const [mainTab, setMainTab] = React.useState(0);
    const [friendTab, setFriendTab] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [loadingContent, setLoadingContent] = React.useState(false);
    const [toNewTab, setToNewTab] = React.useState(false);

    const { user } = useAppSelector(selectUserState);
    const { friends, searchValue } = useAppSelector(selectFriendState);
    const { friendNotification } = useAppSelector(selectMainState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Хук useDebounce (кастомный)
    const debouncedSearchValue = useDebounce(searchValue);

    // Получение друзей в зависимости от поискового значения
    React.useEffect(() => {
        if (!toNewTab) {
            updateFriends();
        } else {
            setToNewTab(false);
        }
    }, [user, debouncedSearchValue]);

    // При переходе на страницу "Друзья" с другой страницы
    React.useEffect(() => {
        if (router.query.mainTab) {
            setMainTab(Number(router.query.mainTab));

            if (router.query.tab) {
                setFriendTab(Number(router.query.tab));
            }

            updateFriends(false, false, router.query.tab ? Number(router.query.tab) : null);
        }
    }, [router.query]);

    // Обновление пользователей на вкладке при изменении счетчика уведомлений о заявках в друзья
    React.useEffect(() => {
        if (mainTab === MainFriendTabs.allRequests && friendTab === 3 && user) {
            requestFriends(user.id, FriendsTab.friendRequests, true);
        }
    }, [friendNotification]);

    // Получение только топ-5 возможных друзей
    React.useEffect(() => {
        if (user) {
            Request.post(ApiRoutes.getPossibleUsers, { userId: user.id }, setLoadingContent,
                (data: { success: boolean, possibleUsers: IUser[] }) => dispatch(setPossibleUsers(data.possibleUsers)),
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user, friends]);

    // Изменяем главную вкладку
    const onChangeMainTab = (newValue: number) => {
        let tab: FriendsTab = FriendsTab.all;

        switch (newValue) {
            case MainFriendTabs.allFriends:
                break;
            case MainFriendTabs.allRequests: 
                tab = FriendsTab.friendRequests;
                break;
            case MainFriendTabs.search: 
                tab = FriendsTab.search;
                break;
        }

        setMainTab(newValue);
        setFriendTab(tab);

        updateFriends(false, true, tab);
    };

    // Обновляем друзей при изменении вкладки 
    const updateFriends = (updateFromContent = false, zeroing = false, tab: number | null = null) => {
        if (user) {
            const loadingCb = updateFromContent ? setLoadingContent : setLoading;

            const currentTab = tab !== null 
                ? tab 
                : friendTab;

            requestFriends(user.id, currentTab, false, loadingCb, zeroing);

            // Обнуляем поисковое значение
            if (zeroing) {
                dispatch(setSearchValue(""));
                setToNewTab(true);
            }
        }
    };

    // Запрос на получение списка пользователей для вкладки
    const requestFriends = (
        userId: string,
        tab: number,
        refresh = false,
        loadingCb: undefined | ((value: React.SetStateAction<boolean>) => void) = undefined,
        zeroing = false
    ) => {
        Request.post(ApiRoutes.getFriends, { userId, tab, search: zeroing ? "" : debouncedSearchValue }, loadingCb,
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

    return <FriendsModule 
        loading={loading} 
        loadingContent={loadingContent} 
        mainTab={mainTab} 
        friendTab={friendTab}
        setFriendTab={setFriendTab}
        onChangeMainTab={onChangeMainTab} 
        requestFriends={requestFriends}
        updateFriends={updateFriends}
    />
};