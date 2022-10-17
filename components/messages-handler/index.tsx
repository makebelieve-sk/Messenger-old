import React from "react";
import { IFriendInfo } from "../../pages/messages/[id]";
import { IMessage, IUser } from "../../types/models.types";
import Message from "../message";

interface IMessagesHandler {
    messages: IMessage[];
    user: IUser;
    messagesRef: React.RefObject<HTMLDivElement>;
    beforeHeight: number | undefined;
    friendInfo: IFriendInfo;
};

export default function MessagesHandler({ messages, user, messagesRef, beforeHeight, friendInfo }: IMessagesHandler) {
    // Установка скролла до самого низа
    React.useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    React.useEffect(() => {
        if (messagesRef.current && beforeHeight) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight - beforeHeight;
        }
    }, [beforeHeight]);

    return <>
        {messages.map(message => {
            return <Message key={message.id} user={user} message={message} friendInfo={friendInfo} />
        })}
    </>
};