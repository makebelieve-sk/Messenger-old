import React from "react";
import { isImage } from "../../../common";
import { MessageExt } from "../../../pages/messages";
import { CallNames, MessageTypes } from "../../../types/enums";

interface IMessageHandler {
    messageObject: MessageExt;
    userId: string;
};

export default React.memo(function MessageHandler({ messageObject, userId }: IMessageHandler) {
    const { message, type, call, files, notifyWrite } = messageObject;

    const errorMessage = "Ошибка отображения сообщения";
    let result: string;

    if (notifyWrite) {
        return <>{notifyWrite} набирает сообщение...</>
    }

    switch (type) {
        case MessageTypes.MESSAGE:
            result = message
                ? message.length > 65
                    ? message.slice(0, 65) + "..."
                    : message
                : errorMessage;
            break;
        case MessageTypes.WITH_FILE:
            result = files && files[0]
                ? isImage(files[0].name)
                    ? "Фотография"
                    : "Файл"
                : errorMessage;
            break;
        case MessageTypes.FEW_FILES:
            result = files
                ? isImage(files[files.length - 1].name)
                    ? "Фотография"
                    : "Файл"
                : errorMessage;
            break;
        case MessageTypes.VOICE:
            result = "Голосовое сообщение";
            break;
        case MessageTypes.CALL:
            if (call) {
                const { initiatorId } = call;
                result = initiatorId === userId ? CallNames.OUTGOING : CallNames.INCOMING;
            } else {
                result = errorMessage;
            }
            break;
        default:
            result = errorMessage;
    }

    return <>{result}</>;
});