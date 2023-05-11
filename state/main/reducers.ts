import { PayloadAction } from "@reduxjs/toolkit";
import { IImage } from "../../components/messages-module/image-message";
import { FriendsNoticeTypes, MessagesNoticeTypes } from "../../types/enums";
import { IUser } from "../../types/models.types";
import { ICallData } from "../../types/socket.types";
import { MainType } from "./slice";

export default {
    setFriendNotification: (state: MainType, action: PayloadAction<FriendsNoticeTypes | number>) => {
        const data = action.payload;

        switch (data) {
            case FriendsNoticeTypes.ADD:
                state.friendNotification += 1;
                break;
            case FriendsNoticeTypes.REMOVE:
                state.friendNotification = state.friendNotification ? state.friendNotification - 1 : 0;
                break;
            default:
                state.friendNotification = typeof data === "number" ? data : 0;
                break;
        }
    },
    setModalConfirm: (state: MainType, action: PayloadAction<{ text: string; btnActionTitle: string; cb: Function; } | null>) => {
        state.modalConfirm = action.payload;
    },
    setGlobalUserLoading: (state: MainType, action: PayloadAction<boolean>) => {
        state.globalUserLoading = action.payload;
    },
    setGlobalInCall: (state: MainType, action: PayloadAction<null | ICallData>) => {
        state.globalCall = action.payload;
    },
    setImagesInCarousel: (state: MainType, action: PayloadAction<{ images: IImage[], index: number } | null>) => {
        state.imagesInCarousel = action.payload;
    },
    setMessageNotification: (state: MainType, action: PayloadAction<{ type: MessagesNoticeTypes; chatId?: string; notifications?: string[]; }>) => {
        const { type, chatId, notifications } = action.payload;

        switch (type) {
            case MessagesNoticeTypes.ADD: {
                if (chatId) {
                    const findChatId = state.messageNotification.find(mNotification => mNotification === chatId);

                    if (!findChatId) {
                        state.messageNotification.push(chatId);
                    }
                }
                break;
            }
            case MessagesNoticeTypes.REMOVE:
                if (chatId) {
                    state.messageNotification = state.messageNotification.filter(mNotification => mNotification !== chatId);
                }
                break;
            case MessagesNoticeTypes.SET:
                state.messageNotification = notifications ? notifications : [];
                break;
            default:
                console.log("Неизвестный тип нотификации: ", type);
                break;
        }
    },
    setOnlineUsers: (state: MainType, action: PayloadAction<IUser>) => {
        const newUser = action.payload;
        const findUser = state.onlineUsers.find(onlineUser => onlineUser.id === newUser.id);

        if (!findUser) {
            state.onlineUsers.push(newUser);
        }
    },
    deleteOnlineUser: (state: MainType, action: PayloadAction<string>) => {
        state.onlineUsers = state.onlineUsers.filter(onlineUser => onlineUser.id !== action.payload);
    },
};