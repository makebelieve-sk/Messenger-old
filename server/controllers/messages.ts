import { v4 as uuid } from "uuid";
import { Request, Response, Express } from "express";
import { Op } from "sequelize";
import { Where } from "sequelize/types/utils";
import { isSingleChat, LIMIT, LOAD_MORE_LIMIT } from "../../common";
import { ApiRoutes, HTTPStatuses, MessageReadStatus } from "../../types/enums";
import { IDialog } from "../../pages/messages";
import { ICall, IFile, IMessage } from "../../types/models.types";
import { sequelize } from "../database";
import CallsModel from "../database/models/calls";
import ChatsModel from "../database/models/chats";
import MessagesModel from "../database/models/messages";
import UserModel from "../database/models/users";
import { mustAuthenticated } from "../middlewares";
import FilesModel from "../database/models/files";
import ReadMessagesModel from "../database/models/read_messages";

class MessagesController {
    // Получить список всех диалогов
    async getDialogs(req: Request, res: Response) {
        try {
            const { userId, page, search }: { userId: string; page: number; search: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            const prepearedSearch = search ? search.replace(/\`\'\.\,\;\:\\\//g, "\"").trim().toLowerCase() : "";

            const where = {
                userIds: { [Op.like]: `%${userId}%` }
            } as { userIds: any; search: Where };

            if (prepearedSearch) {
                where.search = sequelize.where(sequelize.fn("LOWER", sequelize.col("name")), "LIKE", `%${prepearedSearch}%`);
            }

            // Находим все чаты с пользователем
            const chats = await ChatsModel.findAll({
                where,
                attributes: ["id", "userIds", "name"],
                offset: page,
                limit: LIMIT + 1
            });
            const updatedChats: IDialog[] = [];

            if (chats && chats.length) {
                for (let i = 0; i < chats.length; i++) {
                    const chat = chats[i];
                    const chatObject = { id: chat.id, name: chat.name } as IDialog;

                    // Получаем количество непрочитанных сообщений для диалога
                    const unReadMessagesCount = await sequelize.query(`
                        SELECT COUNT(rm.message_id) AS unReadMessagesCount
                        FROM [VK_CLONE].[dbo].[Read_messages] AS rm
                        JOIN Messages AS m ON m.id = rm.message_id
                        WHERE rm.is_read = 0 AND rm.user_id = '${userId}' and m.chat_id = '${chat.id}'
                        GROUP BY m.chat_id
                    `) as [{ unReadMessagesCount?: number }[], number];

                    if (unReadMessagesCount && unReadMessagesCount[0]) {
                        chatObject.unReadMessagesCount = unReadMessagesCount[0][0] && unReadMessagesCount[0][0].unReadMessagesCount
                            ? unReadMessagesCount[0][0].unReadMessagesCount
                            : 0;
                    } else {
                        throw "Запрос выполнился некорректно и ничего не вернул (getDialogs/unReadMessagesCount)";
                    }

                    // При одиночном чате находим получателя сообщения
                    if (chat.userIds && isSingleChat(chat.id)) {
                        const parsedUserIds = (chat.userIds as never as string).split(",");

                        if (parsedUserIds && parsedUserIds.length) {
                            for (let j = 0; j < parsedUserIds.length; j++) {
                                const parsedUserId = parsedUserIds[j];

                                if (parsedUserId !== userId) {
                                    const friendInfo = await UserModel.findOne({ 
                                        where: {
                                            id: parsedUserId
                                        },
                                        attributes: ["id", "firstName", "thirdName", "avatarUrl"] 
                                    });

                                    if (friendInfo) {
                                        chatObject.userTo = friendInfo;
                                    }
                                }
                            }
                        }
                    }

                    // Получаем последнее сообщение для диалога
                    const topMessage = await MessagesModel.findOne({
                        where: { chatId: chat.id },
                        limit: 1,
                        order: [["createDate", "DESC"]]
                    });

                    if (topMessage) {
                        const files: IFile[] = [];
                        let callObject: ICall | null = null;

                        // Получаем автора сообщения
                        const userFrom = await UserModel.findOne({ 
                            where: {
                                id: topMessage.userId
                            },
                            attributes: ["id", "firstName", "thirdName", "avatarUrl"] 
                        });

                        if (userFrom) {
                            chatObject.userFrom = userFrom;
                        }

                        // Получаем объект звонка
                        if (topMessage.callId) {
                            const call = await CallsModel.findByPk(topMessage.callId, { attributes: ["initiatorId"] });

                            if (call) {
                                callObject = call;
                            }
                        }

                        // Получаем объект файла
                        if (topMessage.files) {
                            const filesIds = (topMessage.files as string).split(",");

                            for (let fileId of filesIds) {
                                const file = await FilesModel.findByPk(fileId, { attributes: ["name"] });

                                if (file) {
                                    files.push(file);
                                }
                            }
                        }

                        // Формируем объект messageObject
                        chatObject.messageObject = {
                            message: topMessage.message,
                            type: topMessage.type,
                            call: callObject,
                            files: files,
                            createDate: topMessage.createDate,
                            notifyWrite: ""
                        };

                        updatedChats.push(chatObject);
                    }
                };
            }

            const dialogs = updatedChats && updatedChats.length
                ? updatedChats.length > LIMIT
                    ? updatedChats.slice(0, LIMIT)
                    : updatedChats
                : [];
            const isMore = Boolean(updatedChats && updatedChats.length > LIMIT);

            return res.json({ 
                success: true, 
                dialogs: dialogs.sort((a, b) => Number(a.messageObject.createDate > b.messageObject.createDate)), 
                isMore 
            });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получить список сообщений для одиночного/группового чата
    async getMessages(req: Request, res: Response) {
        try {
            const { chatId, page, userId, loadMore = false, search = "" }: { chatId: string; page: number; userId: string; loadMore: boolean; search: string; } = req.body;

            if (!chatId) {
                throw new Error("Не передан уникальный идентификатор чата");
            }

            const prepearedSearch = search ? search.replace(/\`\'\.\,\;\:\\\//g, "\"").trim().toLowerCase() : "";

            const messagesLimit = loadMore ? LOAD_MORE_LIMIT : LIMIT;

            const where = {} as { search: Where };

            if (prepearedSearch) {
                where.search = sequelize.where(sequelize.fn("LOWER", sequelize.col("message")), "LIKE", `%${prepearedSearch}%`);
            }

            const moreMessages = await MessagesModel.findAll({
                where,
                order: [["create_date", "DESC"]],
                limit: messagesLimit + 1,
                offset: page * messagesLimit,
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
                ? moreMessages.length > messagesLimit
                    ? moreMessages.slice(0, messagesLimit)
                    : moreMessages
                : [];
            const isMore = Boolean(moreMessages && moreMessages.length && moreMessages.length > LIMIT);

            let messagesWithMixins: IMessage[] = [];

            // Дополняем каждый объект сообщения объектом звонка или файлами (при наличии)
            if (messages && messages.length) {
                for (const message of messages) {
                    // Статус прочтенности
                    if (message.userId !== userId) {
                        const findReadMessage = await ReadMessagesModel.findOne({
                            where: { messageId: message.id, userId }
                        });

                        if (findReadMessage) {
                            (message as any).dataValues.isRead = findReadMessage.isRead;
                        }
                    }

                    // Звонки
                    if (message.callId) {
                        const call = await CallsModel.findByPk(message.callId);

                        if (call) {
                            (message as any).dataValues.Call = call as ICall;
                        }
                    }

                    // Файлы
                    if (message.files) {
                        const filesIds = (message.files as string).split(",");
                        const files: IFile[] = [];

                        for (let fileId of filesIds) {
                            const file = await FilesModel.findByPk(fileId);

                            if (file) {
                                files.push(file);
                            }
                        }

                        (message as any).dataValues.files = files;
                    }

                    messagesWithMixins.push(message);
                }
            }

            return res.json({ success: true, messages: messagesWithMixins.reverse(), isMore });
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

            // Если чат - одиночный:
            // 1) Проверяем наличие чата и если его нет - создаем его
            if (isSingleChat) {
                const chat = await ChatsModel.findOne({
                    where: { id: message.chatId },
                    transaction
                });

                if (!chat) {
                    const userFromObject = await UserModel.findByPk(message.userId, { attributes: ["firstName", "thirdName"], transaction });
                    const userToObject = await UserModel.findByPk(userTo, { attributes: ["firstName", "thirdName"], transaction });

                    if (userFromObject && userToObject) {
                        await ChatsModel.create({ 
                            id: message.chatId, 
                            userIds: `${message.userId},${userTo}`, 
                            name: `${userFromObject.firstName + " " + userFromObject.thirdName},${userToObject.firstName + " " + userToObject.thirdName}` 
                        }, { transaction });
                    }
                }
            }

            // Сохраняем сообщение в таблицу Messages
            await MessagesModel.create({ ...message }, { transaction });

            // Если чат - одиночный (пришлось вынести, так как ругается на несуществующую связь с Messages - так как записи еще нет, поэтому вынес ниже создания Message):
            // 2) Создаем непрочитанное сообщение для одного пользователя, иначе для каждого пользователя в чате
            if (isSingleChat) {
                // При создании сообщения по умолчанию создаем запись в Read_messages в значении false
                await ReadMessagesModel.create({ id: uuid(), userId: userTo, messageId: message.id, isRead: message.isRead }, { transaction });
            }

            await transaction.commit();

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Читаем сообщение (сообщения)
    async readMessage(req: Request, res: Response) {
        const transaction = await sequelize.transaction();

        try {
            const { ids, userId }: { ids: string[]; userId: string; } = req.body;

            if (ids && ids.length) {
                await MessagesModel.update(
                    { isRead: MessageReadStatus.READ },
                    { where: { id: { [Op.in]: ids } }, transaction }
                );

                await ReadMessagesModel.update(
                    { isRead: MessageReadStatus.READ },
                    { where: { messageId: { [Op.in]: ids }, userId }, transaction }
                );
            }

            await transaction.commit();

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
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

    // Получаем количество непрочитанных сообщений в диалогах
    async getMessageNotification(req: Request, res: Response) {
        try {
            const { userId }: { userId: string; } = req.body;

            if (!userId) {
                throw "Не передан Ваш уникальный идентификатор";
            }

            const unreadChatIds = await sequelize.query(`
                SELECT ms.chat_id
                FROM Read_Messages as rm
                JOIN Messages as ms ON ms.id = rm.message_id
                WHERE rm.is_read = 0 and rm.user_id = '${userId}'
                GROUP BY ms.chat_id
            `) as [{ "chat_id": string }[], number];

            return res.json({ success: true, unreadChatIds: unreadChatIds[0] && unreadChatIds[0].length ? unreadChatIds[0].map(unreadChatId => unreadChatId.chat_id) : [] });
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
    app.post(ApiRoutes.getMessageNotification, mustAuthenticated, messagesController.getMessageNotification);
};