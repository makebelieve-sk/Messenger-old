import { Socket } from "socket.io";
import { ITempChatId } from "../components/friends-module/friends-list";
import { SocketActions, CallTypes } from "../config/enums";
import { IFriendInfo } from "../pages/messages/[id]";
import { IMessage, IUser } from "./models.types";

export interface ISocketUsers {
    [userId: string]: { userID: string; socketID: string; user: IUser; };
};

interface IAddToFriends {
    to: string;
};

interface ISocketData {
    type: string;
    payload: IAddToFriends;
};

// Принимаем события с фронта на сервер
interface ClientToServerEvents {
    [SocketActions.FRIENDS]: (data: ISocketData) => void;
    [SocketActions.MESSAGE]: ({ data, friendId }: { data: IMessage; friendId: string; }) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
    [SocketActions.CALL]: ({ roomId, type, userFrom, users, isSingle, chatName }: 
        { roomId: string; type: CallTypes; userFrom: IUser; users: IFriendInfo[]; isSingle: boolean; chatName: string; }) => void;
    [SocketActions.ACCEPT_CALL]: ({ roomId, callingUser, isSingle, chatName }: 
        { roomId: string; callingUser: IFriendInfo; isSingle: boolean; chatName: string; }) => void;
    [SocketActions.TRANSFER_CANDIDATE]: ({ peerId, iceCandidate }: { peerId: string; iceCandidate: any; }) => void;
    [SocketActions.TRANSFER_OFFER]: ({ peerId, sessionDescription }: { peerId: string; sessionDescription: any; }) => void;
};

// Отправляем события с сервера на фронт
interface ServerToClientEvents {
    [SocketActions.GET_ALL_USERS]: (users: ISocketUsers) => void;
    [SocketActions.GET_NEW_USER]: (user: IUser) => void;
    [SocketActions.ADD_TO_FRIENDS]: () => void;
    [SocketActions.UNSUBSCRIBE]: () => void;
    [SocketActions.SEND_MESSAGE]: (message: IMessage) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
    [SocketActions.NOTIFY_CALL]: ({ type, userFrom, roomId, isSingle, chatName }: 
        { type: CallTypes; userFrom: IUser; roomId: string; isSingle: boolean; chatName: string; }) => void;
    [SocketActions.ACCEPT_CALL]: () => void;
    [SocketActions.ADD_PEER]: ({ peerId, createOffer }: { peerId: string; createOffer: boolean; }) => void;
    [SocketActions.GET_CANDIDATE]: ({ peerId, iceCandidate }: { peerId: string; iceCandidate: any; }) => void;
    [SocketActions.SESSION_DESCRIPTION]: ({ peerId, sessionDescription }: { peerId: string; sessionDescription: any; }) => void;
};

// Принимаем события на сервере с другого сервера
interface InterServerEvents {
    
};

interface SocketWithUser extends Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, any> { 
    user?: IUser;
};

export type {
    ClientToServerEvents, 
    ServerToClientEvents, 
    InterServerEvents,
    SocketWithUser,
    ISocketData,
};