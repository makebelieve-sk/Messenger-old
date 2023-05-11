import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type FreindsType = Pick<InitialStateType, "possibleUsers" | "friends" | "friendsCount" | "topFriends" | "subscribersCount" | "searchValue">;

// Начальное состояние
export const initialState: FreindsType = {
  friends: null,
  friendsCount: 0,
  subscribersCount: 0,
  topFriends: null,
  possibleUsers: null,
  searchValue: ""
};

export const friendsSlice = createSlice({
  name: "friends",
  initialState,
  reducers,
});

// Состояние
export const selectFriendState = (state: RootState) => state.friends;

// Экшены
export const { setFriends, setFriendsCount, setPossibleUsers, setTopFriends, setSubscribersCount, setSearchValue } = friendsSlice.actions;

// Редьюсер
export default friendsSlice.reducer;