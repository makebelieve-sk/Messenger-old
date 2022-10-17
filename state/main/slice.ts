import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MainType = Pick<InitialStateType, "friendTab" | "friendNotification" | "globalUserLoading">;

// Начальное состояние
export const initialState: MainType = {
  friendNotification: 0,
  friendTab: 0,
  globalUserLoading: false,
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers,
});

// Состояние
export const selectMainState = (state: RootState) => state.main;

// Экшены
export const { setFriendNotification, setFriendTab, setGlobalUserLoading } = mainSlice.actions;

// Редьюсер
export default mainSlice.reducer;