import React from "react";
import { useRouter } from "next/router";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { ApiRoutes, FriendsTab, MainFriendTabs, Pages } from "../types/enums";
import { IUser, IUserDetails } from "../types/models.types";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import { selectUserState, setUserDetail } from "../state/user/slice";
import { setFriendsCount, setSubscribersCount, setTopFriends } from "../state/friends/slice";
import CatchErrors from "../core/catch-errors";
import Request from "../core/request";
import ProfileModule from "../components/profile-module";

import styles from "../styles/pages/profile.module.scss";

export type onClickBlockType = (
  pathname: Pages, 
  query: {
      mainTab: MainFriendTabs;
      tab?: FriendsTab;
  }
) => void;

export default function Profile() {
  const { user } = useAppSelector(selectUserState);

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
    {user
      ? <ProfileModule />
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