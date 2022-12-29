import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { NextRouter } from "next/router";
import { IFriendInfo } from "../pages/messages/[id]";
import { deleteFromTempChat, setMessage } from "../state/messages/slice";
import { ApiRoutes, SocketActions } from "../types/enums";
import { IFile, IMessage } from "../types/models.types";
import { AppDispatch } from "../types/redux.types";
import { ClientToServerEvents, ServerToClientEvents } from "../types/socket.types";
import Request from "../core/request";
import CatchErrors from "../core/catch-errors";
import { isSingleChat } from "../common";

interface IConstructor {
    newMessage: Omit<IMessage, "id" | "createDate">;
    friendInfo: IFriendInfo;
    router: NextRouter;
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    dispatch: AppDispatch;
};

// Класс, формируемый сущность "Сообщения"
export default class Message {
    message: IMessage;
    friendInfo: IFriendInfo;
    router: NextRouter;
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    dispatch: AppDispatch;

    constructor ({ newMessage, friendInfo, router, socket, dispatch }: IConstructor) {
        const { userId, chatId, files, type, message, isRead, callId } = newMessage;

        this.message = {
            id: uuid(),
            userId,
            chatId,
            files: files ?? null,
            type,
            createDate: new Date().toUTCString(),
            message,
            isRead,
            callId: callId ?? null,
        };
        this.friendInfo = friendInfo;
        this.router = router;
        this.socket = socket;
        this.dispatch = dispatch;
    };

    // Добавление сообщение с глобальное хранилище данных
    addMessageToStore() {
        this.dispatch(setMessage({ message: this.message }));
    };

    // Отправка по сокету
    sendBySocket() {
        this.socket.emit(SocketActions.MESSAGE, { data: this.message, friendId: this.friendInfo.id });
    };

    // Сохранение файлов в базе данных
    saveInFiles(files: File[], setLoadingSend: React.Dispatch<React.SetStateAction<boolean>>) {
        const formData = new FormData();

        files.forEach(file => {
            formData.append("file", file as any);
        });

        Request.post(
            ApiRoutes.saveFiles,
            formData,
            setLoadingSend,
            (data: { files: IFile[] }) => {
                if (data.files && data.files.length) {
                    const filesIds = data.files.map(file => file.id).join(",").toUpperCase();
                    this.message.files = data.files;

                    this.addMessageToStore();
                    this.sendBySocket();
                    this.saveInMessages(filesIds);
                }
            },
            (error: any) => CatchErrors.catch(error, this.router, this.dispatch),
            { headers: { "Content-type": "multipart/form-data" } }
        );
    };

    // Сохранение сообщений в базе данных
    saveInMessages(filesIds?: string) {
        Request.post(
            ApiRoutes.saveMessage,
            {
                message: {
                    ...this.message,
                    files: filesIds ? filesIds : null
                },
                isSingleChat: isSingleChat(this.message.chatId),
                userTo: this.friendInfo.id
            },
            () => this.dispatch(deleteFromTempChat(this.message.chatId)),
            undefined,
            (error: any) => CatchErrors.catch(error, this.router, this.dispatch)
        );
    };
};