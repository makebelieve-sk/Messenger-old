import { PayloadAction } from "@reduxjs/toolkit";
import { MainType } from "./slice";

export default {
    setFriendNotification: (state: MainType, action: PayloadAction<number>) => {
        const data = action.payload;

        if (data) {
            state.friendNotification += data;
        } else {
            state.friendNotification = state.friendNotification ? state.friendNotification - data : 0;
        }
    },
    setFriendTab: (state: MainType, action: PayloadAction<number>) => {
        state.friendTab = action.payload;
    },
    setGlobalUserLoading: (state: MainType, action: PayloadAction<boolean>) => {
        state.globalUserLoading = action.payload;
    },
};