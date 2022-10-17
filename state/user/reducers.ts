import { PayloadAction } from "@reduxjs/toolkit";
import { IUser, IUserDetails } from "../../types/models.types";
import { UserType } from "./slice";

export default {
    setUser: (state: UserType, action: PayloadAction<IUser | null>) => {
        state.user = action.payload;
    },
    setUserDetail: (state: UserType, action: PayloadAction<IUserDetails | null>) => {
        state.userDetail = action.payload;
    },
};