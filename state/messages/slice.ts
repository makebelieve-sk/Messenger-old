import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MessageType = Pick<InitialStateType, "dialogs" | "messages" | "tempChats">;

// Начальное состояние
export const initialState: MessageType = {
  dialogs: [],
  messages: [],
  tempChats: {}
};

export const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers,
});

// Состояние
export const selectMessagesState = (state: RootState) => state.messages;

// Экшены
export const { setDialogs, setMessage, setMessages, setTempChat, deleteFromTempChat } = messagesSlice.actions;

// Редьюсер
export default messagesSlice.reducer;