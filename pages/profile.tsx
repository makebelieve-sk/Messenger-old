import React from "react";
import { useRouter } from "next/router";
import { Avatar, Button, Grid, List, ListItem, ListItemAvatar, Paper, Skeleton, Stack } from "@mui/material";
import { ApiRoutes, FriendsTab, Pages } from "../config/enums";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState, setUserDetail } from "../state/user/slice";
import { selectFriendState, setFriendsCount, setSubscribersCount, setTopFriends } from "../state/friends/slice";
import CatchErrors from "../axios/catch-errors";
import { IUser, IUserDetails } from "../types/models.types";
import { MainFriendTabs } from "../components/friends-module/friends-list";
import Request from "../common/request";
import { getMonthName, NO_PHOTO } from "../config";

import styles from "../styles/pages/profile.module.scss";

export default function Profile() {
  const { user, userDetail } = useAppSelector(selectUserState);
  const { topFriends, friendsCount, subscribersCount } = useAppSelector(selectFriendState);

  const router = useRouter();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (user) {
      // Получаем детальную информацию о пользователе
      Request.post(ApiRoutes.getUserDetail, { userId: user.id }, undefined,
        (data: { success: boolean, userDetail: IUserDetails }) => dispatch(setUserDetail(data.userDetail ? data.userDetail : null)),
        (error: any) => CatchErrors.catch(error, router, dispatch)
      );

      // Получаем количество друзей и подгружаем первые 6 из них
      Request.post(ApiRoutes.getCountFriends, { userId: user.id }, undefined,
        (data: { success: boolean, friendsCount: number, topFriends: IUser[] | null, subscribersCount: number }) => {
          dispatch(setFriendsCount(data.friendsCount));
          dispatch(setSubscribersCount(data.subscribersCount));
          dispatch(setTopFriends(data.topFriends));
        },
        (error: any) => CatchErrors.catch(error, router, dispatch)
      );
    }
  }, [user]);

  // Клик по названию блока
  const onClickBlock = (pathname: Pages, query: { mainTab: MainFriendTabs, tab?: FriendsTab }) => {
    router.push({ pathname, query });
  };

  const transformDate = (date: string) => {
    const dates = date.split("-");

    return dates[2] + getMonthName(+dates[1] - 1) + ". " + dates[0];
  };

  return <div className={styles["profile-container"]}>
    {user
      ? <Grid container spacing={2}>
        <Grid item container xs={4} spacing={2} direction="column">
          {/* Блок моей фотографии */}
          <Grid item>
            <Paper className="main-photo-container paper-block">
              <div className={styles["main-photo-container__avatar"]}>
                <img src={user.avatarUrl ? user.avatarUrl : NO_PHOTO} alt="user-avatar" />
              </div>

              <Button variant="outlined" size="small" className={styles["main-photo-container__edit-button"]}>
                Изменить
              </Button>
            </Paper>
          </Grid>

          {/* Блок друзей */}
          <Grid item>
            <Paper className="friends-container paper-block">
              <div
                className="block-title"
                onClick={() => onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends })}
              >
                Друзья <span className="counter">{friendsCount}</span>
              </div>

              {topFriends && topFriends.length
                ? <List className={styles["friends-container__top-friends__list"]}>
                  {topFriends.map(topFriend => {
                    const userName = topFriend.firstName + " " + topFriend.thirdName;

                    return <ListItem className={styles["friends-container__top-friends__item"]} key={topFriend.id}>
                      <ListItemAvatar className={styles["top-friends__item__avatar-block"]}>
                        <Avatar
                          alt={userName}
                          src={topFriend.avatarUrl ? topFriend.avatarUrl : NO_PHOTO}
                          className={styles["top-friends__item__avatar"]}
                        />
                      </ListItemAvatar>

                      {topFriend.firstName}
                    </ListItem>
                  })}
                </List>
                : <div className="opacity-text">
                  На данный момент список друзей пуст
                </div>
              }
            </Paper>
          </Grid>
        </Grid>

        <Grid item container xs={8} spacing={2} direction="column">
          {/* Блок личной информации */}
          <Grid item>
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
                      {userDetail.birthday
                        ? <a href={Pages.profile}>{transformDate(userDetail.birthday as string)}</a>
                        : <span>Не указано</span>
                      }
                    </div>

                    <div className={styles["info-container__short-info-block__row"]}>
                      <div className={styles["info-container__short-info-block__row__title"]}>Город:</div>
                      {userDetail.city ? <a href={Pages.profile}>{userDetail.city}</a> : <span>Не указано</span>}
                    </div>

                    <div className={styles["info-container__short-info-block__row"]}>
                      <div className={styles["info-container__short-info-block__row__title"]}>Место работы:</div>
                      {userDetail.work ? <a href={Pages.profile}>{userDetail.work}</a> : <span>Не указано</span>}
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
                  <span>{friendsCount}</span> друзей
                </div>

                <div
                  className={styles["counts-block__count"]}
                  onClick={() => onClickBlock(Pages.friends, { mainTab: MainFriendTabs.allFriends, tab: FriendsTab.subscribers })}
                >
                  <span>{subscribersCount}</span> подписчиков
                </div>
                <div className={styles["counts-block__count"]}>
                  <span>0</span> фотографий
                </div>

                <div className={styles["counts-block__count"]}>
                  <span>0</span> аудиозаписей
                </div>

                <div className={styles["counts-block__count"]}>
                  <span>0</span> подарков
                </div>
              </div>
            </Paper>
          </Grid>

          {/* Блок фотографий */}
          <Grid item>
            <Paper className="photo-container paper-block">
              <div className="block-title">
                Мои фотографии <span className="counter">1</span>
              </div>

              {user.avatarUrl
                ? <div className={styles["photo-container__photos"]}>
                  <div className={styles["photo-container__photos__photo"]}>
                    <img src={user.avatarUrl} alt="user-photo" />
                  </div>
                </div>
                : <div className="opacity-text">
                  Нет фотографий
                </div>
              }
            </Paper>
          </Grid>
        </Grid>
      </Grid>
      : <div className={styles["skeleton-container"]}>
        <Stack spacing={1}>
          <Skeleton variant="rectangular" width={210} height={118} />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </Stack>

        <Stack spacing={1}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="rectangular" width={210} height={118} />
        </Stack>
      </div>
    }
  </div>
};