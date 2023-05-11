import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MainType = Pick<
  InitialStateType, 
  "modalConfirm" | "friendNotification" | "globalUserLoading" | "globalCall" | "imagesInCarousel" | "messageNotification" | "onlineUsers"
>;

// Начальное состояние
export const initialState: MainType = {
  friendNotification: 0,
  modalConfirm: null,
  globalUserLoading: false,
  globalCall: null,
  imagesInCarousel: null,
  messageNotification: [],
  onlineUsers: [],
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers,
});

// Состояние
export const selectMainState = (state: RootState) => state.main;

// Экшены
export const { 
  setFriendNotification,
  setGlobalUserLoading, 
  setGlobalInCall, 
  setImagesInCarousel,
  setMessageNotification,
  setOnlineUsers,
  deleteOnlineUser,
  setModalConfirm
} = mainSlice.actions;

// Редьюсер
export default mainSlice.reducer;