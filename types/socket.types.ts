import { Socket } from "socket.io";
import { SocketActions, CallStatus, SocketChannelErrorTypes, SettingType, MessageTypes, MessageReadStatus } from "./enums";
import { IChatInfo, IFriendInfo } from "../pages/messages/[id]";
import { IMessage, IUser } from "./models.types";
import { ITempChatId } from "../components/friends-module/content/friends-list";

export interface ISocketUsers {
    [userId: string]: {
        userID: string;
        socketID: string;
        user: IUser;
        call?: { id: string; chatInfo: IChatInfo; usersInCall: IFriendInfo[]; };
    };
};

interface IAddToFriends {
    to: string;
};

interface ISocketData {
    type: string;
    payload: IAddToFriends;
};

interface ICallData {
    roomId: string; 
    chatInfo: IChatInfo; 
    users: IFriendInfo[];
};

// Принимаем события с фронта на сервер
interface ClientToServerEvents {
    [SocketActions.FRIENDS]: (data: ISocketData) => void;
    [SocketActions.MESSAGE]: ({ data, friendId }: { data: IMessage; friendId: string; }) => void;
    [SocketActions.CHANGE_READ_STATUS]: ({ isRead, messages }: { isRead: MessageReadStatus; messages: IMessage[]; }) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
    [SocketActions.CALL]: ({ roomId, users, chatInfo }: { 
        roomId: string;
        users: IFriendInfo[];
        chatInfo: IChatInfo;
    }) => void;
    [SocketActions.ACCEPT_CALL]: ({ roomId, chatInfo, usersInCall }: { 
        roomId: string; 
        chatInfo: IChatInfo; 
        usersInCall: IFriendInfo[]; 
    }) => void;
    [SocketActions.TRANSFER_CANDIDATE]: ({ peerId, iceCandidate }: { peerId: string; iceCandidate: any; }) => void;
    [SocketActions.TRANSFER_OFFER]: ({ peerId, sessionDescription }: { peerId: string; sessionDescription: any; }) => void;
    [SocketActions.CHANGE_CALL_STATUS]: ({ status, userTo }: { status: CallStatus; userTo: string; }) => void;
    [SocketActions.END_CALL]: ({ roomId, usersInCall }: { roomId: string; usersInCall?: IFriendInfo[]; }) => void;
    [SocketActions.CHANGE_STREAM]: ({ type, value, roomId }: { type: SettingType; value: boolean; roomId: string; }) => void;
    [SocketActions.GET_NEW_MESSAGE_ON_SERVER]: ({ id, type }: { id: string; type: MessageTypes; }) => void;
    [SocketActions.NOTIFY_WRITE]: ({ isWrite, friendId, chatId, notifyAuthor }: { isWrite: boolean; friendId: string; chatId?: string | null; notifyAuthor: string; }) => void;
    [SocketActions.IS_TALKING]: ({ roomId, isTalking }: { roomId: string; isTalking: boolean; }) => void;
};

// Отправляем события с сервера на фронт
interface ServerToClientEvents {
    [SocketActions.GET_ALL_USERS]: (users: ISocketUsers) => void;
    [SocketActions.GET_NEW_USER]: (user: IUser) => void;
    [SocketActions.USER_DISCONNECT]: (userId: string) => void;
    [SocketActions.ADD_TO_FRIENDS]: () => void;
    [SocketActions.UNSUBSCRIBE]: () => void;
    [SocketActions.SEND_MESSAGE]: (message: IMessage) => void;
    [SocketActions.ACCEPT_CHANGE_READ_STATUS]: ({ message }: { message: IMessage; }) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
    [SocketActions.NOTIFY_CALL]: ({ roomId, chatInfo, users }: ICallData) => void;
    [SocketActions.ADD_PEER]: ({ peerId, createOffer, userId }: { peerId: string; createOffer: boolean; userId: string }) => void;
    [SocketActions.GET_CANDIDATE]: ({ peerId, iceCandidate }: { peerId: string; iceCandidate: any; }) => void;
    [SocketActions.SESSION_DESCRIPTION]: ({ peerId, sessionDescription }: { peerId: string; sessionDescription: any; }) => void;
    [SocketActions.SET_CALL_STATUS]: ({ status }: { status: CallStatus; }) => void;
    [SocketActions.REMOVE_PEER]: ({ peerId, userId }: { peerId: string; userId: string; }) => void;
    [SocketActions.SOCKET_CHANNEL_ERROR]: ({ message, type }: { message: string; type: SocketChannelErrorTypes; }) => void;
    [SocketActions.CHANGE_STREAM]: ({ type, value, peerId }: { type: SettingType; value: boolean; peerId: string; }) => void;
    [SocketActions.ADD_NEW_MESSAGE]: ({ newMessage }: { newMessage: IMessage; }) => void;
    [SocketActions.NOTIFY_WRITE]: ({ isWrite, chatId, notifyAuthor }: { isWrite: boolean; chatId?: string | null; notifyAuthor: string; }) => void;
    [SocketActions.CANCEL_CALL]: () => void;
    [SocketActions.ALREADY_IN_CALL]: ({ roomId, chatInfo, users }: ICallData) => void;
    [SocketActions.NOT_ALREADY_IN_CALL]: () => void;
    [SocketActions.IS_TALKING]: ({ peerId, isTalking }: { peerId: string; isTalking: boolean; }) => void;
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
    ICallData,
};