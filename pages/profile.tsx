import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Avatar, Button, Grid, List, ListItem, ListItemAvatar, Paper, Skeleton, Stack } from "@mui/material";
import { ApiRoutes, FriendsTab, Pages } from "../config/enums";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState, setUserDetail } from "../state/user/slice";
import { selectFriendState, setFriendsCount, setSubscribersCount, setTopFriends } from "../state/friends/slice";
import CatchErrors from "../axios/catch-errors";
import { IUser, IUserDetails } from "../types/models.types";
import { MainFriendTabs } from "../components/friends-module/friends-list";
import Request from "../common/request";
import { NO_PHOTO } from "../config";

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

  return <div className={styles["profile-container"]}>
    {
      user
        ? <Grid container spacing={2}>
          <Grid item container xs={4} spacing={2} direction="column">
            <Grid item>
              <Paper className={styles["profile-container--paper-block"]}>
                <div className={styles["profile-container_photo-block"]}>
                  <Image src={user.avatarUrl ? user.avatarUrl : NO_PHOTO} alt="user-photo" width={200} height={267} priority />
                </div>

                <div className={styles["profile-container_edit-button-block"]}>
                  <Button variant="contained" size="small" className={styles["profile-container_edit-button"]}>Редактировать</Button>
                </div>
              </Paper>
            </Grid>

            <Grid item>
              <Paper className={styles["profile-container--paper-block"]}>
                <div className={styles["profile-container_block--title"]} onClick={() => router.push({ pathname: Pages.friends, query: { mainTab: MainFriendTabs.allFriends } })}>
                  Друзья <div>{friendsCount}</div>
                </div>

                {topFriends && topFriends.length
                  ? <List className={styles["profile-container_block-ul"]}>
                    {topFriends.map(topFriend => {
                      const userName = topFriend.firstName + " " + topFriend.thirdName;

                      return <ListItem className={styles["profile-container_block-li"]} key={topFriend.id}>
                        <ListItemAvatar className={styles["profile-container_block--friend-avatar-block"]}>
                          <Avatar alt={userName} src={topFriend.avatarUrl ? topFriend.avatarUrl : NO_PHOTO} className={styles["profile-container_block--friend-avatar"]} />
                        </ListItemAvatar>

                        {topFriend.firstName}
                      </ListItem>
                    })}
                  </List>
                  : null
                }
              </Paper>
            </Grid>
          </Grid>

          <Grid item container xs={8} spacing={2} direction="column">
            <Grid item>
              <Paper className={styles["profile-container--paper-block"]}>
                <div className={styles["profile-container_info--user-name"]}>{user.firstName + " " + user.thirdName}</div>
                <div className={styles["profile-container_info--status"]}>установить статус</div>

                <div className={styles["profile-container_info--short-info-block"]}>
                  <div className={styles["profile-container_info--short-info-edit"]} onClick={() => router.push(Pages.edit)}>
                    Редактировать
                  </div>
                  <div className={styles["profile-container_info--short-info"]}>
                    <div className={styles["profile-container_info--short-info-title"]}>День рождения:</div>
                    {userDetail && userDetail.birthday ? <a href={Pages.profile}>{userDetail.birthday}</a> : <div>Не указано</div>}
                  </div>

                  <div className={styles["profile-container_info--short-info"]}>
                    <div className={styles["profile-container_info--short-info-title"]}>Город:</div>
                    {userDetail && userDetail.city ? <a href={Pages.profile}>{userDetail.city}</a> : <div>Не указано</div>}
                  </div>

                  <div className={styles["profile-container_info--short-info"]}>
                    <div className={styles["profile-container_info--short-info-title"]}>Место работы:</div>
                    {userDetail && userDetail.work ? <a href={Pages.profile}>{userDetail.work}</a> : <div>Не указано</div>}
                  </div>
                </div>

                <div className={styles["profile-container_info--counts-block"]}>
                  <div className={styles["profile-container_info--count"]} onClick={() => router.push({ pathname: Pages.friends, query: { mainTab: MainFriendTabs.allFriends } })}>
                    <div>{friendsCount}</div> друзей
                  </div>
                  <div className={styles["profile-container_info--count"]} onClick={() => router.push({ pathname: Pages.friends, query: { mainTab: MainFriendTabs.allFriends, tab: FriendsTab.subscribers } })}>
                    <div>{subscribersCount}</div> подписчиков
                  </div>
                  <div className={styles["profile-container_info--count"]}><div>1</div> фотография</div>
                  <div className={styles["profile-container_info--count"]}><div>29</div> аудиозаписей</div>
                  <div className={styles["profile-container_info--count"]}><div>59</div> подарков</div>
                </div>
              </Paper>
            </Grid>

            <Grid item>
              <Paper className={styles["profile-container--paper-block"]}>
                <div className={styles["profile-container_block--title"]}>Мои фотографии <div>1</div></div>
                <div className={styles["profile-container_photos--slider"]}>
                  {
                    user.avatarUrl
                      ? <div className={styles["profile-container_photos--photo"]}>
                        <Image src={user.avatarUrl} alt="user-photo" width={123} height={123} />
                      </div>
                      : <div className={styles["profile-container_photos--slider-empty"]}>Нет фотографий</div>
                  }
                </div>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        : <div className={styles["profile-container_skeleton-block"]}>
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