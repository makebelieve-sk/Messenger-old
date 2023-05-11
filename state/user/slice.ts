import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type UserType = Pick<InitialStateType, "user" | "userDetail" | "photosCount">;

// Начальное состояние
export const initialState: UserType = {
  user: null,
  userDetail: null,
  photosCount: 0,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers,
});

// Состояние
export const selectUserState = (state: RootState) => state.users;

// Экшены
export const { setUser, setUserDetail, changeUserField, changeUserDetailField, setPhotosCount } = userSlice.actions;

// Редьюсер
export default userSlice.reducer;