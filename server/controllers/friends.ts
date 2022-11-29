import { Request, Response, Express } from "express";
import { Op } from "sequelize";
import { Transaction } from "sequelize/types";
import { ApiRoutes, ErrorTexts, FriendsTab, HTTPStatuses } from "../../config/enums";
import { sequelize } from "../database";
import ChatsModel from "../database/models/chats";
import FriendsModel from "../database/models/friends";
import SubscribersModel from "../database/models/subscribers";
import UserModel from "../database/models/users";
import { mustAuthenticated } from "../middlewares";

class FriendsController {
    possibleUsersQuery(userId: string, all: boolean = false) {
        return `
            SELECT ${all ? "" : "TOP (5)"} users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
            FROM [VK_CLONE].[dbo].[Users] AS users
            LEFT JOIN [VK_CLONE].[dbo].[Friends] AS friends ON friends.user_id = users.id
            LEFT JOIN [VK_CLONE].[dbo].[Subscribers] AS subscribers ON subscribers.user_id = users.id
            WHERE users.id != '${userId}' AND users.id NOT IN (
                SELECT friend_id
                FROM [VK_CLONE].[dbo].[Friends] AS friendsIn
                WHERE friendsIn.user_id = '${userId}'
            ) AND users.id NOT IN (
                SELECT user_id
                FROM [VK_CLONE].[dbo].[Subscribers] AS subscribersIn
                WHERE subscribers.subscriber_id = '${userId}'
            )
        `;
    };

    // Получение топ-5 возможных друзей
    async getPossibleUsers(req: Request, res: Response) {
        try {
            const { userId }: { userId: string } = req.body;

            const possibleUsers = await sequelize.query(new FriendsController().possibleUsersQuery(userId));

            if (possibleUsers && possibleUsers[0]) {
                return res.json({ success: true, possibleUsers: possibleUsers[0] });
            } else {
                throw new Error("Запрос выполнился некорректно и ничего не вернул (possibleUsers)");
            }
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получение 5 возможных друзей, всех друзей и друзей онлайн
    async getFriends(req: Request, res: Response) {
        try {
            const { userId, tab = 0 }: { userId: string; tab: number; } = req.body;

            switch (tab) {
                // Получение всех друзей
                case FriendsTab.all: {
                    const friends = await sequelize.query(`
                        SELECT users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
                        FROM [VK_CLONE].[dbo].[Users] AS users
                        JOIN [VK_CLONE].[dbo].[Friends] AS friends ON friends.user_id = users.id
                        WHERE users.id != '${userId}' AND users.id IN (
                            SELECT friend_id
                            FROM [VK_CLONE].[dbo].[Friends] AS friendsIn
                            WHERE friendsIn.user_id = '${userId}'
                        )
                    `);

                    if (friends && friends[0]) {
                        return res.json({ success: true, friends: friends[0] });
                    } else {
                        throw new Error("Запрос выполнился некорректно и ничего не вернул (tab=0)");
                    }
                }
                // Получение друзей-онлайн
                case FriendsTab.online: {

                }
                // Получение подписчиков
                case FriendsTab.subscribers: {
                    const friends = await sequelize.query(`
                        SELECT users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
                        FROM [VK_CLONE].[dbo].[Users] AS users
                        JOIN [VK_CLONE].[dbo].[Subscribers] AS subscribers ON subscribers.subscriber_id = users.id
                        WHERE users.id != '${userId}' AND users.id IN (
                            SELECT subscriber_id
                            FROM [VK_CLONE].[dbo].[Subscribers] AS subscribersIn
                            WHERE subscribersIn.user_id = '${userId}' AND left_in_subs = 1
                        )
                    `);

                    if (friends && friends[0]) {
                        return res.json({ success: true, friends: friends[0] });
                    } else {
                        throw new Error("Запрос выполнился некорректно и ничего не вернул (tab=3)");
                    }
                }
                // Получение входящих заявок
                case FriendsTab.friendRequests: {
                    const friends = await sequelize.query(`
                        SELECT users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
                        FROM [VK_CLONE].[dbo].[Users] AS users
                        JOIN [VK_CLONE].[dbo].[Subscribers] AS subscribers ON subscribers.subscriber_id = users.id
                        WHERE users.id != '${userId}' AND users.id IN (
                            SELECT subscriber_id
                            FROM [VK_CLONE].[dbo].[Subscribers] AS subscribersIn
                            WHERE subscribersIn.user_id = '${userId}' AND left_in_subs = 0
                        )
                    `);

                    if (friends && friends[0]) {
                        return res.json({ success: true, friends: friends[0] });
                    } else {
                        throw new Error("Запрос выполнился некорректно и ничего не вернул (tab=3)");
                    }
                }
                // Получение исходящих заявок
                case FriendsTab.incomingRequests: {
                    const friends = await sequelize.query(`
                        SELECT users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
                        FROM [VK_CLONE].[dbo].[Users] AS users
                        JOIN [VK_CLONE].[dbo].[Subscribers] AS subscribers ON subscribers.user_id = users.id
                        WHERE users.id != '${userId}' AND users.id IN (
                            SELECT user_id
                            FROM [VK_CLONE].[dbo].[Subscribers] AS subscribersIn
                            WHERE subscribersIn.subscriber_id = '${userId}'
                        )
                    `);

                    if (friends && friends[0]) {
                        return res.json({ success: true, friends: friends[0] });
                    } else {
                        throw new Error("Запрос выполнился некорректно и ничего не вернул (tab=4)");
                    }
                }
                // Поиск друзей
                case FriendsTab.search: {
                    const friends = await sequelize.query(new FriendsController().possibleUsersQuery(userId, true));

                    if (friends && friends[0]) {
                        return res.json({ success: true, friends: friends[0] });
                    } else {
                        throw new Error("Запрос выполнился некорректно и ничего не вернул (tab=5)");
                    }
                }
                default:
                    throw new Error("Тип вкладки не распознан");
            };
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получить специфичную информацию о друге, с которым открыт диалог
    async getFriendInfo(req: Request, res: Response) {
        try {
            const { chatId, userId }: { chatId: string; userId: string } = req.body;

            if (!userId) {
                throw new Error("Не передан Ваш уникальный идентификатор");
            }

            if (!chatId) {
                throw new Error("Не передан уникальный идентификатор чата");
            }

            const userIdsInChat: any = await ChatsModel.findOne({ where: { id: chatId }, attributes: ["userIds"] });
            let friendId: string | null = null;

            if (userIdsInChat) {
                const ids = userIdsInChat.userIds.split(",");
                const findFriendId = ids.find((id: string) => id !== userId);

                if (findFriendId) {
                    friendId = findFriendId;
                }
            }

            const friendInfo = friendId ? await UserModel.findByPk(friendId, { attributes: ["id", "avatarUrl", "firstName", "thirdName"] }) : null;

            if (!friendInfo) {
                throw new Error(ErrorTexts.NOT_TEMP_CHAT_ID);
            }

            return res.json({ 
                success: true, 
                friendInfo: { 
                    id: friendInfo.id, 
                    avatarUrl: friendInfo.avatarUrl, 
                    friendName: friendInfo.firstName + " " + friendInfo.thirdName 
                } 
            });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получить количество друзей, подписчиков, топ-6 друзей для отрисовки
    async getCountFriends(req: Request, res: Response) {
        try {
            const { userId }: { userId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            const friendsCount: [any[], any] = await sequelize.query(`
                SELECT COUNT(*) AS count
                FROM [VK_CLONE].[dbo].[Users] AS users
                JOIN [VK_CLONE].[dbo].[Friends] AS friends ON friends.user_id = users.id
                WHERE users.id != '${userId}' AND users.id IN (
                    SELECT friend_id
                    FROM [VK_CLONE].[dbo].[Friends] AS friendsIn
                    WHERE friendsIn.user_id = '${userId}'
                )
            `);

            const topFriends = await sequelize.query(`
                SELECT TOP(6) users.[id], [first_name] AS [firstName], [second_name] AS [secondName], [third_name] AS [thirdName], [email], [phone], [avatar_url] as avatarUrl
                FROM [VK_CLONE].[dbo].[Users] AS users
                JOIN [VK_CLONE].[dbo].[Friends] AS friends ON friends.user_id = users.id
                WHERE users.id != '${userId}' AND users.id IN (
                    SELECT friend_id
                    FROM [VK_CLONE].[dbo].[Friends] AS friendsIn
                    WHERE friendsIn.user_id = '${userId}'
                )
            `);

            const subscribersCount: [any[], any] = await sequelize.query(`
                SELECT COUNT(*) AS count
                FROM [VK_CLONE].[dbo].[Users] AS users
                JOIN [VK_CLONE].[dbo].[Subscribers] AS subscribers ON subscribers.subscriber_id = users.id
                WHERE users.id != '${userId}' AND users.id IN (
                    SELECT subscriber_id
                    FROM [VK_CLONE].[dbo].[Subscribers] AS subscribersIn
                    WHERE subscribersIn.user_id = '${userId}' AND left_in_subs = 1
                )
            `);

            return res.json({ 
                success: true, 
                friendsCount: friendsCount && friendsCount[0] ? friendsCount[0][0].count : null, 
                topFriends: topFriends && topFriends[0] ? topFriends[0] : null, 
                subscribersCount: subscribersCount && subscribersCount[0] ? subscribersCount[0][0].count : null
            });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Добавить пользователя в друзья
    async addToFriend(req: Request, res: Response) {
        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            if (!friendId) {
                throw new Error("Не передан id добавляемого пользователя");
            }

            const existSubscriber = await SubscribersModel.findOne({
                where: { userId, subscriberId: friendId }
            });

            // Если пользователь уже подписан на меня - сразу добавляем его в друзья
            if (existSubscriber) {
                return new FriendsController().acceptUser(req, res);
            } else {
                // Создаем запись - я подписан на добавленного пользователя
                await SubscribersModel.create({
                    userId: friendId,
                    subscriberId: userId,
                    leftInSubs: 0
                });

                return res.json({ success: true });
            }
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Отписаться от пользователя
    async unsubscribeUser(req: Request, res: Response) {
        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            if (!friendId) {
                throw new Error("Не передан id отписываемого пользователя");
            }

            await SubscribersModel.destroy({
                where: { userId: friendId, subscriberId: userId }
            });

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Добавить пользователя из подписчиков в друзья
    async acceptUser(req: Request, res: Response) {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            if (!friendId) {
                throw new Error("Не передан id принимаемого пользователя");
            }

            // Удаляем пользователя из подписчиков
            await SubscribersModel.destroy({
                where: { userId, subscriberId: friendId },
                transaction
            });

            // Я добавил этого пользователя
            await FriendsModel.create({
                userId,
                friendId
            }, { transaction });

            // Пользователь добавил меня
            await FriendsModel.create({
                userId: friendId,
                friendId: userId
            }, { transaction });

            await transaction.commit();

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Оставить пользователя в подписчиках
    async leftInSubscribers(req: Request, res: Response) {
        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            if (!friendId) {
                throw new Error("Не передан id подписанного пользователя");
            }

            await SubscribersModel.update(
                { leftInSubs: 1 },
                { where: { userId, subscriberId: friendId } }
            );

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Удалить из друзей
    async deleteFriend(req: Request, res: Response) {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const { userId, friendId }: { userId: string; friendId: string; } = req.body;

            if (!userId) {
                throw new Error("Не передан id пользователя");
            }

            if (!friendId) {
                throw new Error("Не передан id удаляемого пользователя");
            }

            await FriendsModel.destroy({
                where: { userId, friendId },
                transaction
            });

            await FriendsModel.destroy({
                where: { userId: friendId, friendId: userId },
                transaction
            });

            await SubscribersModel.create({
                userId,
                subscriberId: friendId,
                leftInSubs: 1
            }, { transaction });

            await transaction.commit();

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };
};

const friendsController = new FriendsController();

export default function FriendsRouter(app: Express) {
    app.post(ApiRoutes.getPossibleUsers, mustAuthenticated, friendsController.getPossibleUsers);
    app.post(ApiRoutes.getFriends, mustAuthenticated, friendsController.getFriends);
    app.post(ApiRoutes.getFriendInfo, mustAuthenticated, friendsController.getFriendInfo);
    app.post(ApiRoutes.getCountFriends, mustAuthenticated, friendsController.getCountFriends);
    app.post(ApiRoutes.addToFriend, mustAuthenticated, friendsController.addToFriend);
    app.post(ApiRoutes.unsubscribeUser, mustAuthenticated, friendsController.unsubscribeUser);
    app.post(ApiRoutes.acceptUser, mustAuthenticated, friendsController.acceptUser);
    app.post(ApiRoutes.leftInSubscribers, mustAuthenticated, friendsController.leftInSubscribers);
    app.post(ApiRoutes.deleteFriend, mustAuthenticated, friendsController.deleteFriend);
};