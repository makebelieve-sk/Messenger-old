import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Badge from "@mui/material/Badge";
import Tab from "@mui/material/Tab";
import { useAppSelector } from "../../../../hooks/useGlobalState";
import { selectMainState } from "../../../../state/main/slice";
import { FriendsTab, MainFriendTabs } from "../../../../types/enums";

import styles from "./tabs.module.scss";

interface ITabsComponent {
    mainTab: number;
    friendTab: number;
    setFriendTab: React.Dispatch<React.SetStateAction<number>>;
    updateFriends: (updateFromContent: boolean, zeroing: boolean, tab?: number | null) => void;
};

export default React.memo(function TabsComponent({ mainTab, friendTab, setFriendTab, updateFriends }: ITabsComponent) {
    const { friendNotification } = useAppSelector(selectMainState);

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

    // Изменение вкладок
    const onChangeTab = (_: React.SyntheticEvent<Element, Event>, newValue: number) => {
        // Обновляем контент на вкладке
        updateFriends(true, true, newValue);
        // Обновляем состояние
        setFriendTab(newValue);
    };
    
    return renderTabs(mainTab) && renderTabs(mainTab).length
        ? <Box className={styles["friends-list-container__tabs"]}>
            <Tabs value={friendTab} onChange={onChangeTab} aria-label="friends-tabs">
                {renderTabs(mainTab).map(tab => tab)}
            </Tabs>
        </Box>
        : null
});