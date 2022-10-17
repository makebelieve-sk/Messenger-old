import { MessageReadStatus, MessageTypes } from "../config/enums";

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
    birthday: string;
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
    attachments?: string[] | null;
    type: MessageTypes;
    createDate: string;
    message: string;
    isRead: MessageReadStatus;
    // Модель чата
    Chat?: { id: string; };
    // Модель пользователя (кто отправитель сообщения)
    User?: {
        id: string;
        firstName: string;
        thirdName: string;
        avatarUrl: string;
    };
};

// Интерфейс атрибутов модели Chat
export interface IChat {
    id: string;
    name: string;
    userIds: string[];
};