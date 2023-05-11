import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";

export type MessageType = Pick<
  InitialStateType, 
  "dialogs" | "messages" | "tempChats" | "counter" | "visibleUnReadMessages" | "isWrite" | "scrollDownAfterNewMsg" | "activeChatId"
>;

// Начальное состояние
export const initialState: MessageType = {
  dialogs: [],
  messages: [],
  tempChats: {},
  counter: 0,
  visibleUnReadMessages: "",
  isWrite: false,
  scrollDownAfterNewMsg: false,
  activeChatId: null,
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
  changeUnReadMessagesCountInDialogs,
  setMessage, 
  updateMessage,
  setMessages, 
  setTempChat, 
  deleteFromTempChat, 
  setCounter, 
  setVisibleUnReadMessages,
  setWriteMessage,
  setScrollDownAfterNewMsg,
  setActiveChatId,
  changeLastMessageInDialog,
  setNotifyAuthor,
} = messagesSlice.actions;

// Редьюсер
export default messagesSlice.reducer;