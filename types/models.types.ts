import dayjs from "dayjs";
import { CallTypes, FileVarieties, MessageReadStatus, MessageTypes } from "./enums";

// Интерфейс атрибутов модели Users
export interface IUser {
    id: string;
    firstName: string;
    secondName: string;
    thirdName: string;
    email: string;
    phone: string;
    password: string;
    avatarUrl: string;
    salt: string;
};

// Интерфейс атрибутов модели User_details
export interface IUserDetails {
    id: number;
    userId: string;
    birthday: string | dayjs.Dayjs;
    city: string;
    work: string;
    sex: string;
};

// Интерфейс атрибутов модели Friends
export interface IFriend {
    id: number;
    userId: string;
    friendId: string;
};

// Интерфейс атрибутов модели Subscribers
export interface ISubscriber {
    id: number;
    userId: string;
    subscriberId: string;
    leftInSubs: number;
};

// Интерфейс атрибутов модели Messages
export interface IMessage {
    id: string;
    userId: string;
    chatId: string;
    files?: string[] | File[] | null | string | IFile[];
    type: MessageTypes;
    createDate: string;
    message: string;
    isRead: MessageReadStatus;
    fileExt?: FileVarieties;
    callId?: string | null;
    // Модель чата
    Chat?: { id: string; };
    // Модель пользователя (кто отправитель сообщения)
    User?: {
        id: string;
        firstName: string;
        thirdName: string;
        avatarUrl: string;
    };
    Call?: ICall;
};

// Интерфейс атрибутов модели Chats
export interface IChat {
    id: string;
    name: string;
    userIds: string[];
};

// Интерфейс атрибутов модели Calls
export interface ICall {
    id: string;
    name: string;
    type: CallTypes;
    initiatorId?: string;
    chatId?: string;
    userIds: string;
    startTime?: string;
    endTime?: string;
};

// Интерфейс атрибутов модели Files
export interface IFile {
    id: string;
    name: string;
    size: number;
    path: string;
};