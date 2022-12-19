import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MessageType = Pick<
  InitialStateType, 
  "dialogs" | "messages" | "tempChats" | "counter" | "visibleUnReadMessages" | "isWrite"
>;

// Начальное состояние
export const initialState: MessageType = {
  dialogs: [],
  messages: [],
  tempChats: {},
  counter: 0,
  visibleUnReadMessages: "",
  isWrite: false,
};

export const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers,
});

// Состояние
export const selectMessagesState = (state: RootState) => state.messages;

// Экшены
export const { 
  setDialogs, 
  setMessage, 
  setMessages, 
  setTempChat, 
  deleteFromTempChat, 
  setCounter, 
  setVisibleUnReadMessages,
  setWriteMessage,
} = messagesSlice.actions;

// Редьюсер
export default messagesSlice.reducer;