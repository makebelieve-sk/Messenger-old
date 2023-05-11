import { PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "../../types/models.types";
import { FreindsType } from "./slice";

export default {
    setFriends: (state: FreindsType, action: PayloadAction<IUser[] | null>) => {
        state.friends = action.payload;
    },
    setFriendsCount: (state: FreindsType, action: PayloadAction<number>) => {
        state.friendsCount = action.payload;
    },
    setTopFriends: (state: FreindsType, action: PayloadAction<IUser[] | null>) => {
        state.topFriends = action.payload;
    },
    setSubscribersCount: (state: FreindsType, action: PayloadAction<number>) => {
        state.subscribersCount = action.payload;
    },
    setPossibleUsers: (state: FreindsType, action: PayloadAction<IUser[] | null>) => {
        state.possibleUsers = action.payload;
    },
    setSearchValue: (state: FreindsType, action: PayloadAction<string>) => {
        state.searchValue = action.payload;
    },
};