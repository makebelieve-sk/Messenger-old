import { PayloadAction } from "@reduxjs/toolkit";
import { MainType } from "./slice";

export default {
    setFriendNotification: (state: MainType, action: PayloadAction<number>) => {
        state.friendNotification = action.payload;
    },
    setFriendTab: (state: MainType, action: PayloadAction<number>) => {
        state.friendTab = action.payload;
    },
    setGlobalUserLoading: (state: MainType, action: PayloadAction<boolean>) => {
        state.globalUserLoading = action.payload;
    },
};