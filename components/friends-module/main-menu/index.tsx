import React from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useAppSelector } from "../../../hooks/useGlobalState";
import { selectMainState } from "../../../state/main/slice";

import styles from "./main-menu.module.scss";

interface IMainMenu {
    mainTab: number;
    onChangeMainTab: (newValue: number) => void;
};

export default React.memo(function MainMenu({ mainTab, onChangeMainTab }: IMainMenu) {
    const { friendNotification } = useAppSelector(selectMainState);

    return <Grid item>
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
});