import { PayloadAction } from "@reduxjs/toolkit";
import { IDialog } from "../../pages/messages";
import { IMessage } from "../../types/models.types";
import { MessageType } from "./slice";

export default {
    setDialogs: (state: MessageType, action: PayloadAction<IDialog[]>) => {
        state.dialogs = action.payload;
    },
    setMessage: (state: MessageType, action: PayloadAction<IMessage>) => {
        const messageId = action.payload.id;

        const findMessage = state.messages.find(message => message.id === messageId);

        if (!findMessage) {
            state.messages = [ ...state.messages, action.payload ];
        }
    },
    setMessages: (state: MessageType, action: PayloadAction<IMessage[]>) => {
        state.messages = !action.payload || !action.payload.length 
            ? [] 
            : [ ...action.payload, ...state.messages ];
    },
    setTempChat: (state: MessageType, action: PayloadAction<{ chatId: string; userFrom: string; userTo: string }>) => {
        const { chatId, userFrom, userTo } = action.payload;
        state.tempChats = { ...state.tempChats, [chatId]: { userFrom, userTo } };
    },
    deleteFromTempChat: (state: MessageType, action: PayloadAction<string>) => {
        delete state.tempChats[action.payload];
    },
};