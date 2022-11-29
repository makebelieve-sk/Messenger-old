import { v4 as uuid } from "uuid";
import { IMessage } from "../types/models.types";

interface IConstructor extends Omit<IMessage, "id" | "createDate"> {};

// Класс, формируемый сущность "Сообщения"
export default class Message {
    constructor ({ userId, chatId, attachments, type, message, isRead }: IConstructor) {
        return {
            id: uuid(),
            userId,
            chatId,
            attachments: attachments ?? null,
            type,
            createDate: new Date().toUTCString(),
            message,
            isRead,
        };
    }
};