import React from "react";
import { IUser } from "../../../types/models.types";

interface IScrollingMessagesBlock {
    messages: React.ReactElement[];
    messagesRef: React.RefObject<HTMLDivElement>;
    beforeHeight: number | undefined;
    user: IUser;
    scrollOnDown: boolean;
    onScrollDown: () => void;
    readAll: () => void;
    setBeforeHeight: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function ScrollingMessagesBlock({ messages, messagesRef, beforeHeight, user, scrollOnDown, onScrollDown, readAll, setBeforeHeight }: IScrollingMessagesBlock) {
    // Установка скролла до самого низа в самый первый раз, если нет непрочитанных сообщений
    // Иначе установка скролла по плашке системного сообщения "Непрочитанные сообщения"
    React.useEffect(() => {
        const findUnreadSystemMessage = document.querySelector(".system-message-container__unread-message");

        if (findUnreadSystemMessage && messagesRef.current) {
            const elemTop = findUnreadSystemMessage.getBoundingClientRect().top;
            const refCurrentTop = messagesRef.current.getBoundingClientRect().top;
            const scrollTop = messagesRef.current.scrollTop;

            messagesRef.current.scrollTop = elemTop - refCurrentTop + scrollTop;

            // Если блок полностью прокручен -> читаем все непрочитанные сообщения (при их наличии)
            if (messagesRef.current.scrollHeight - messagesRef.current.scrollTop - messagesRef.current.clientHeight < 30) {
                readAll();
            }
        } else {
            onScrollDown();
        }
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
            setBeforeHeight(undefined);
        }
    }, [beforeHeight, messages]);

    return <>{ messages }</>;
};