import { PayloadAction } from "@reduxjs/toolkit";
import { IDialog } from "../../pages/messages";
import { IMessage } from "../../types/models.types";
import { MessageType } from "./slice";

export default {
    setDialogs: (state: MessageType, action: PayloadAction<IDialog[]>) => {
        state.dialogs = action.payload;
    },
    setMessage: (state: MessageType, action: PayloadAction<{ message: IMessage, isVisibleUnReadMessages?: string, updateCounter?: boolean }>) => {
        const { message, isVisibleUnReadMessages, updateCounter } = action.payload;
        const messageId = message.id;

        const findMessage = state.messages.find(message => message.id === messageId);

        if (!findMessage) {
            state.messages = [ ...state.messages, message ];

            if (updateCounter) {
                state.counter += 1;
            }
        }

        if (!state.visibleUnReadMessages && isVisibleUnReadMessages) {
            state.visibleUnReadMessages = isVisibleUnReadMessages;
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
    setCounter: (state: MessageType, action: PayloadAction<number | undefined>) => {
        state.counter = action.payload === 0 ? 0 : state.counter + 1;
    },
    setVisibleUnReadMessages: (state: MessageType, action: PayloadAction<string>) => {
        state.visibleUnReadMessages = action.payload;
    },
};