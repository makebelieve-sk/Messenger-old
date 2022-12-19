import { Request, Response, Express } from "express";
import { Op } from "sequelize";
import { isSingleChat, LIMIT } from "../../common";
import { ApiRoutes, HTTPStatuses, MessageReadStatus } from "../../types/enums";
import { IDialog } from "../../pages/messages";
import { ICall, IMessage } from "../../types/models.types";
import { sequelize } from "../database";
import CallsModel from "../database/models/calls";
import ChatsModel from "../database/models/chats";
import MessagesModel from "../database/models/messages";
import UserModel from "../database/models/users";
import { mustAuthenticated } from "../middlewares";

class MessagesController {
    // Получить список всех диалогов
    async getDialogs(req: Request, res: Response) {
        try {
            const { userId, page }: { userId: string; page: number; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            const query = `
                WITH a AS (
                    SELECT TOP (1) message, chat_id AS chatId, create_date as createDate, user_id AS userId
                    FROM [VK_CLONE].[dbo].[Messages]
                    ORDER BY create_date DESC
                )
                SELECT chats.id, a.message, a.createDate, a.userId, chats.user_ids as userIds, users.first_name, users.third_name, users.avatar_url as avatarUrl
                FROM [VK_CLONE].[dbo].[Chats] AS chats
                LEFT JOIN a ON chats.id = a.chatId
                LEFT JOIN [VK_CLONE].[dbo].[Users] AS users ON users.id = a.userId
                WHERE chats.user_ids LIKE '%${userId}%'
                ORDER BY a.createDate DESC
                OFFSET ${page} ROWS FETCH NEXT ${LIMIT + 1} ROWS ONLY
            `;

            const moreDialogs: any = await sequelize.query(query);

            if (moreDialogs && moreDialogs[0]) {
                const dialogs = moreDialogs[0].length
                    ? moreDialogs[0].length > LIMIT
                        ? moreDialogs[0].slice(0, LIMIT)
                        : moreDialogs[0]
                    : [];
                const isMore = Boolean(moreDialogs[0] && moreDialogs[0].length && moreDialogs[0].length > LIMIT);

                const updatedDialogs: IDialog[] = [];

                for (let i = 0; i < dialogs.length; i++) {
                    const dialog = dialogs[i];

                    if (dialog.userIds && isSingleChat(dialog.id)) {
                        // Выполнять только при одиночном чате - здесь написать проверку типа чата
                        const parsedUserIds = dialog.userIds.split(",");

                        if (parsedUserIds && parsedUserIds.length) {
                            for (let j = 0; j < parsedUserIds.length; j++) {
                                const parsedUserId: any = parsedUserIds[j];

                                if (parsedUserId !== userId) {
                                    const friendInfo = await UserModel.findByPk(parsedUserId, { attributes: ["id", "firstName", "thirdName", "avatarUrl"] });

                                    if (friendInfo) {
                                        dialog.userTo = friendInfo;
                                    }
                                }
                            }
                        }
                    }

                    dialog.userFrom = {
                        id: dialog.userId,
                        firstName: dialog.first_name,
                        thirdName: dialog.third_name,
                        avatarUrl: dialog.avatarUrl,
                    };
                    
                    delete dialog.userId;
                    delete dialog.first_name;
                    delete dialog.third_name;
                    delete dialog.avatarUrl;

                    updatedDialogs.push(dialog);
                }

                return res.json({ success: true, dialogs: updatedDialogs.reverse(), isMore });
            } else {
                return new Error("Запрос выполнился некорректно и ничего не вернул (getDialogs)");
            }
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получить список сообщений для одиночного/группового чата
    async getMessages(req: Request, res: Response) {
        try {
            const { chatId, page }: { chatId: string; page: number; } = req.body;

            if (!chatId) {
                throw new Error("Не передан уникальный идентификатор чата");
            }

            const moreMessages = await MessagesModel.findAll({
                order: [["create_date", "DESC"]],
                limit: LIMIT + 1,
                offset: page * LIMIT,
                include: [{
                    model: ChatsModel,
                    as: "Chat",
                    attributes: ["id"],
                    where: { id: chatId }
                }, {
                    model: UserModel,
                    as: "User",
                    attributes: ["id", "firstName", "thirdName", "avatarUrl"]
                }]
            });

            const messages = moreMessages && moreMessages.length
                ? moreMessages.length > LIMIT 
                    ? moreMessages.slice(0, LIMIT)
                    : moreMessages
                : [];
            const isMore = Boolean(moreMessages && moreMessages.length && moreMessages.length > LIMIT);

            let messagesWithCall: IMessage[] = [];

            // Дополняем каждый объект сообщения объектов звонка (при наличии)
            if (messages && messages.length) {
                for (let message of messages) {
                    if (message.callId) {
                        const call = await CallsModel.findByPk(message.callId);

                        if (call) {
                            (message as any).dataValues.Call = call as ICall;
                        }
                    }

                    messagesWithCall.push(message);
                }
            }

            return res.json({ success: true, messages: messagesWithCall.reverse(), isMore });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Сохранить сообщение для одиночного чата
    async saveMessage(req: Request, res: Response) {
        const transaction = await sequelize.transaction();

        try {
            const { message, isSingleChat, userTo }: { message: IMessage; isSingleChat: boolean; userTo: string; } = req.body;

            if (!message.userId) {
                throw "Не передан Ваш уникальный идентификатор";
            }

            if (!message.chatId) {
                throw "Не передан уникальный идентификатор чата";
            }

            // Если чат - одиночный, то проверяем наличие чата и если его нет - создаем его
            if (isSingleChat) {
                const chat = await ChatsModel.findOne({
                    where: { id: message.chatId },
                    transaction
                });
    
                if (!chat) {
                    await ChatsModel.create({ id: message.chatId, userIds: `${message.userId},${userTo}` }, { transaction });
                }
            }

            // Сохраняем сообщение в таблицу Messages
            await MessagesModel.create({ ...message }, { transaction });

            await transaction.commit();

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Читаем сообщение (сообщения)
    // TODO
    // Реализовать прочтение сообщений
    async readMessage(req: Request, res: Response) {
        try {
            const { ids }: { ids: string[] } = req.body;

            if (ids && ids.length) {
                await MessagesModel.update(
                    { isRead: MessageReadStatus.READ }, 
                    { where: { id: { [Op.in]: ids } } }
                );
            }

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получаем id чата
    async getChatId(req: Request, res: Response) {
        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw "Не передан Ваш уникальный идентификатор";
            }

            if (!friendId) {
                throw "Не передан уникальный идентификатор собеседника";
            }

            const chat = await ChatsModel.findOne({
                where: { 
                    name: null, 
                    userIds: { 
                        [Op.or]: [
                            { [Op.like]: `${userId},${friendId}` },
                            { [Op.like]: `${friendId},${userId}` }
                        ]
                    } 
                },
                attributes: ["id"]
            });

            return res.json({ success: true, chatId: chat ? chat.id : null });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };
};

const messagesController = new MessagesController();

export default function MessagesRouter(app: Express) {
    app.post(ApiRoutes.getDialogs, mustAuthenticated, messagesController.getDialogs);
    app.post(ApiRoutes.getMessages, mustAuthenticated, messagesController.getMessages);
    app.post(ApiRoutes.saveMessage, mustAuthenticated, messagesController.saveMessage);
    app.post(ApiRoutes.readMessage, mustAuthenticated, messagesController.readMessage);
    app.post(ApiRoutes.getChatId, mustAuthenticated, messagesController.getChatId);
};