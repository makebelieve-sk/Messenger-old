import React from "react";
import { IUser } from "../../../types/models.types";

interface IScrollingMessagesBlock {
    messages: React.ReactElement[];
    messagesRef: React.RefObject<HTMLDivElement>;
    beforeHeight: number | undefined;
    user: IUser;
    scrollOnDown: boolean;
    onScrollDown: () => void;
};

export default function ScrollingMessagesBlock({ messages, messagesRef, beforeHeight, user, scrollOnDown, onScrollDown }: IScrollingMessagesBlock) {
    // Установка скролла до самого низа в самый первый раз
    React.useEffect(() => {
        onScrollDown();
    }, []);

    // Если последнее сообщение написал я - скроллим вниз
    React.useEffect(() => {
        if (messages[messages.length - 1].props.message.userId === user.id || scrollOnDown) {
            onScrollDown();
        }
    }, [messages]);

    React.useEffect(() => {
        if (messagesRef.current && beforeHeight) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight - beforeHeight;
        }
    }, [beforeHeight]);

    return <>{ messages }</>;
};