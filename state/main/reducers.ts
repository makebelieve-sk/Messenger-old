import { PayloadAction } from "@reduxjs/toolkit";
import { ICallData } from "../../types/socket.types";
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
    setGlobalInCall: (state: MainType, action: PayloadAction<null | ICallData>) => {
        state.globalCall = action.payload;
    }
};