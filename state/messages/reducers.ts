import { PayloadAction } from "@reduxjs/toolkit";
import { IDialog } from "../../pages/messages";
import { IFile, IMessage } from "../../types/models.types";
import { MessageType } from "./slice";

interface IDialogMessage {
    message: string;
};

export default {
    setDialogs: (state: MessageType, action: PayloadAction<IDialog[]>) => {
        state.dialogs = action.payload;
    },
    changeUnReadMessagesCountInDialogs: (state: MessageType, action: PayloadAction<{ chatId: string | null; counter: number | undefined; updateLastMessage?: IDialogMessage; }>) => {
        const { chatId, counter, updateLastMessage } = action.payload;

        if (chatId) {
            const findDialog = state.dialogs.find(dialog => dialog.id === chatId);

            if (findDialog) {
                const indexOf = state.dialogs.indexOf(findDialog);

                if (indexOf >= 0) {
                    state.dialogs[indexOf].unReadMessagesCount = counter === undefined ? state.dialogs[indexOf].unReadMessagesCount + 1 : counter;

                    if (updateLastMessage) {
                        state.dialogs[indexOf].messageObject.message = updateLastMessage.message;
                    }
                }
            }
        }
    },
    setMessage: (state: MessageType, action: PayloadAction<{ message: IMessage, isVisibleUnReadMessages?: string, updateCounter?: boolean, userId?: string, notUpdateUnReadMessage?: boolean }>) => {
        const { message, isVisibleUnReadMessages, updateCounter, userId, notUpdateUnReadMessage } = action.payload;
        const messageId = message.id;

        const findMessage = state.messages.find(message => message.id.toLowerCase() === messageId.toLowerCase());

        if (!findMessage) {
            state.messages = [...state.messages, message];

            if (updateCounter) {
                state.counter += 1;
            }

            state.scrollDownAfterNewMsg = true;
        }

        if (!state.visibleUnReadMessages && isVisibleUnReadMessages && !notUpdateUnReadMessage) {
            // Находим первое непрочитанное сообщение, и чтобы я не был автором этого сообщения
            const firstUnreadMessage = state.messages.find(message => !message.isRead && userId && message.userId !== userId);

            state.visibleUnReadMessages = firstUnreadMessage
                ? {
                    unreadMessages: true,
                    messageId: firstUnreadMessage.id
                }
                : isVisibleUnReadMessages;
        }
    },
    updateMessage: (state: MessageType, action: PayloadAction<{ message: IMessage, field: string }>) => {
        const { message, field } = action.payload;
        const messageId = message.id;

        const findMessage = state.messages.find(message => message.id.toLowerCase() === messageId.toLowerCase());

        if (findMessage) {
            findMessage[field] = message[field];
        }
    },
    setMessages: (state: MessageType, action: PayloadAction<{ messages: IMessage[], userId?: string }>) => {
        const { messages, userId } = action.payload;

        state.messages = !messages || !messages.length
            ? []
            : [...messages, ...state.messages];

        const unreadMessages = state.messages.filter(message => !message.isRead && message.userId !== userId);

        if (unreadMessages && unreadMessages.length) {
            // Находим первое непрочитанное сообщение, и чтобы я не был автором этого сообщения
            const firstUnreadMessage = unreadMessages[0];

            state.counter = unreadMessages.length;

            // Записываем id первого непрочитанного сообщения (необходимо для отображения плашки "Непрочитанные сообщения")
            if (firstUnreadMessage) {
                state.visibleUnReadMessages = {
                    unreadMessages: true,
                    messageId: firstUnreadMessage.id
                };
            }
        }
    },
    setTempChat: (state: MessageType, action: PayloadAction<{ chatId: string; userFrom: string; userTo: string }>) => {
        const { chatId, userFrom, userTo } = action.payload;
        state.tempChats = { ...state.tempChats, [chatId]: { userFrom, userTo } };
    },
    deleteFromTempChat: (state: MessageType, action: PayloadAction<string>) => {
        delete state.tempChats[action.payload];
    },
    setCounter: (state: MessageType, action: PayloadAction<number>) => {
        state.counter = action.payload === 0 
            ? 0 
            : state.counter > action.payload 
                ? state.counter - action.payload 
                : 0;
    },
    setVisibleUnReadMessages: (state: MessageType, action: PayloadAction<string>) => {
        state.visibleUnReadMessages = action.payload;
    },
    setWriteMessage: (state: MessageType, action: PayloadAction<boolean>) => {
        state.isWrite = action.payload;
    },
    setScrollDownAfterNewMsg: (state: MessageType, action: PayloadAction<boolean>) => {
        state.scrollDownAfterNewMsg = action.payload;
    },
    setActiveChatId: (state: MessageType, action: PayloadAction<null | string>) => {
        state.activeChatId = action.payload;
    },
    changeLastMessageInDialog: (state: MessageType, action: PayloadAction<IMessage>) => {
        const { chatId, message, createDate, type, Call, files } = action.payload;

        if (chatId) {
            const findDialog = state.dialogs.find(dialog => dialog.id === chatId);

            if (findDialog) {
                const indexOf = state.dialogs.indexOf(findDialog);

                if (indexOf >= 0) {
                    state.dialogs[indexOf].messageObject = {
                        call: Call,
                        createDate,
                        files: files as IFile[],
                        message,
                        type,
                        notifyWrite: ""
                    }
                }
            }
        }
    },
    setNotifyAuthor: (state: MessageType, action: PayloadAction<{ chatId: string | null | undefined; notifyAuthor: string; }>) => {
        const { chatId, notifyAuthor } = action.payload;

        if (chatId) {
            const findDialog = state.dialogs.find(dialog => dialog.id === chatId);

            if (findDialog) {
                const indexOf = state.dialogs.indexOf(findDialog);

                if (indexOf >= 0) {
                    state.dialogs[indexOf].messageObject.notifyWrite = notifyAuthor;
                }
            }
        }
    },
};