import { Action, ThunkAction } from "@reduxjs/toolkit";
import { ITempChatId } from "../components/friends-module/friends-list";
import { CallStatus, CallTypes } from "../config/enums";
import { IDialog } from "../pages/messages";
import { IFriendInfo } from "../pages/messages/[id]";
import store from "../state/store";
import { IMessage, IUser, IUserDetails } from "./models.types";

export type InitialStateType = {
    user: IUser | null;
    userDetail: IUserDetails | null;
    error: null | string;
    friends: IUser[] | null;
    friendsCount: number;
    subscribersCount: number;
    topFriends: IUser[] | null;
    possibleUsers: IUser[] | null;
    friendNotification: number;
    friendTab: number;
    globalUserLoading: boolean;
    dialogs: IDialog[];
    messages: IMessage[];
    tempChats: { [chatId: string]: Omit<ITempChatId, "chatId"> };
    counter: number;
    visibleUnReadMessages: string;
    visible: boolean;
    status: CallStatus;
    type: CallTypes | null;
    callingUser: IFriendInfo | null;
    callId: string | null;
};

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;