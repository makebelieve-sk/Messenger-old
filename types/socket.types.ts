import { Socket } from "socket.io";
import { ITempChatId } from "../components/friends-module/friends-list";
import { SocketActions } from "../config/enums";
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

// Принимаем события на сервере с фронта
interface ClientToServerEvents {
    [SocketActions.FRIENDS]: (data: ISocketData) => void;
    [SocketActions.MESSAGE]: ({ data, friendId }: { data: IMessage; friendId: string; }) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
};

// Отправляем события с сервера на фронт
interface ServerToClientEvents {
    [SocketActions.GET_ALL_USERS]: (users: ISocketUsers) => void;
    [SocketActions.GET_NEW_USER]: (user: IUser) => void;
    [SocketActions.ADD_TO_FRIENDS]: () => void;
    [SocketActions.UNSUBSCRIBE]: () => void;
    [SocketActions.SEND_MESSAGE]: (message: IMessage) => void;
    [SocketActions.SET_TEMP_CHAT_ID]: (tempChatId: ITempChatId) => void;
};

// Принимаем события на сервере с другого сервера
interface InterServerEvents {
    
};

interface SocketWithUser extends Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, any> { 
    user?: IUser
};

export type {
    ClientToServerEvents, 
    ServerToClientEvents, 
    InterServerEvents,
    SocketWithUser,
    ISocketData,
};