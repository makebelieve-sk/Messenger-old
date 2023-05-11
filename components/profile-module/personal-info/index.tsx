import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/router";
import { getMonthName, muchSelected } from "../../../common";
import { useAppSelector } from "../../../hooks/useGlobalState";
import { selectFriendState } from "../../../state/friends/slice";
import { selectUserState } from "../../../state/user/slice";
import { FriendsTab, MainFriendTabs, Pages } from "../../../types/enums";
import { onClickBlockType } from "../../../pages/profile";

import styles from "./personal-info.module.scss";

interface IPersonalInfo {
    onClickBlock: onClickBlockType;
};

export default React.memo(function PersonalInfo({ onClickBlock }: IPersonalInfo) {
    const { user, userDetail, photosCount } = useAppSelector(selectUserState);
    const { friendsCount, subscribersCount } = useAppSelector(selectFriendState);

    const router = useRouter();

    // Трансформация даты
    const transformDate = (date: string) => {
        const dates = date.split("-");

        return dates[2] + getMonthName(+dates[1] - 1) + ". " + dates[0];
    };

    if (!user) {
        return null;
    }

    return <Grid item>
        <Paper className="info-container paper-block">
            {userDetail
                ? <>
                    <div className={styles["info-container__main-info"]}>
                        <div className={styles["info-container__username"]}>{user.firstName + " " + user.thirdName}</div>
                        <div className={styles["info-container__status"] + " opacity-text"}>установить статус</div>
                    </div>

                    <div className={styles["info-container__short-info-block"]}>
                        <div className={styles["info-container__short-info-block__edit"]} onClick={() => router.push(Pages.edit)}>
                            Редактировать
                        </div>

                        <div className={styles["info-container__short-info-block__row"]}>
                            <div className={styles["info-container__short-info-block__row__title"]}>День рождения:</div>
                            <span>{userDetail.birthday ? transformDate(userDetail.birthday as string) : "Не указано"}</span>
                        </div>

                        <div className={styles["info-container__short-info-block__row"]}>
                            <div className={styles["info-container__short-info-block__row__title"]}>Город:</div>
                            <span>{userDetail.city ? userDetail.city : "Не указано"}</span>
                        </div>

                        <div className={styles["info-container__short-info-block__row"]}>
                            <div className={styles["info-container__short-info-block__row__title"]}>Место работы:</div>
                            <span>{userDetail.work ? userDetail.work : "Не указано"}</span>
                        </div>
                    </div>
                </>
                : <Stack spacing={1}>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                </Stack>
            }

            <div className={styles["info-container__counts-block"]}>
                <div
                    className={styles["counts-block__count"]}
                    onClick={() => onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends })}
                >
                    <span>{friendsCount}</span> {muchSelected(friendsCount, ["друг", "друга", "друзей"])}
                </div>

                <div
                    className={styles["counts-block__count"]}
                    onClick={() => onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends, tab: FriendsTab.subscribers })}
                >
                    <span>{subscribersCount}</span> {muchSelected(subscribersCount, ["подписчик", "подписчика", "подписчиков"])}
                </div>
                <div className={styles["counts-block__count"]} onClick={() => router.push(Pages.photos)}>
                    <span>{photosCount}</span> {muchSelected(photosCount, ["фотография", "фотографии", "фотографий"])}
                </div>

                <div className={styles["counts-block__count"]}>
                    <span>0</span> {muchSelected(0, ["аудиозапись", "аудиозаписи", "аудиозаписей"])}
                </div>

                <div className={styles["counts-block__count"]}>
                    <span>0</span> {muchSelected(0, ["видеозапись", "видеозаписи", "видеозаписей"])}
                </div>
            </div>
        </Paper>
    </Grid>
});