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
    changeUserField: (state: UserType, action: PayloadAction<{ field: string; value: string; }>) => {
        const { field, value } = action.payload;
        if (state.user) state.user[field] = value;
    },
    changeUserDetailField: (state: UserType, action: PayloadAction<{ field: string; value: string; }>) => {
        const { field, value } = action.payload;
        if (state.user) state.user[field] = value;
    },
    setPhotosCount: (state: UserType, action: PayloadAction<number>) => {
        state.photosCount = action.payload;
    },
};