import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MainType = Pick<InitialStateType, "friendTab" | "friendNotification" | "globalUserLoading" | "globalCall" | "imagesInCarousel">;

// Начальное состояние
export const initialState: MainType = {
  friendNotification: 0,
  friendTab: 0,
  globalUserLoading: false,
  globalCall: null,
  imagesInCarousel: null,
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers,
});

// Состояние
export const selectMainState = (state: RootState) => state.main;

// Экшены
export const { setFriendNotification, setFriendTab, setGlobalUserLoading, setGlobalInCall, setImagesInCarousel } = mainSlice.actions;

// Редьюсер
export default mainSlice.reducer;