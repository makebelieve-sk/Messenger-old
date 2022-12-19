import { Action, ThunkAction } from "@reduxjs/toolkit";
import { ITempChatId } from "../components/friends-module/friends-list";
import { CallStatus } from "./enums";
import { IDialog } from "../pages/messages";
import { IChatInfo, IFriendInfo } from "../pages/messages/[id]";
import store from "../state/store";
import { IMessage, IUser, IUserDetails } from "./models.types";
import { ICallData } from "./socket.types";

export type InitialStateType = {
    user: IUser | null;
    userDetail: IUserDetails | null;
    error: null | string;
    systemError: string | null;
    friends: IUser[] | null;
    friendsCount: number;
    subscribersCount: number;
    topFriends: IUser[] | null;
    possibleUsers: IUser[] | null;
    friendNotification: number;
    friendTab: number;
    globalUserLoading: boolean;
    globalCall: null | ICallData;
    dialogs: IDialog[];
    messages: IMessage[];
    tempChats: { [chatId: string]: Omit<ITempChatId, "chatId"> };
    counter: number;
    visibleUnReadMessages: string;
    visible: boolean;
    status: CallStatus;
    callId: string | null;
    localStream: MediaStream | null;
    chatInfo: IChatInfo | null;
    users: IFriendInfo[] | null;
    isWrite: boolean;
};

export interface ICallSettings {
    audio: boolean; 
    video: { width: number; height: number; } | boolean;
};

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;