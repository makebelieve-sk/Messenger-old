import express from "express";
import cluster from "cluster";
import os from "os";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import connectRedis from "connect-redis";

import { dbConnect, sequelize } from "./database";
import usePassport from "./passport";
import RedisWorks from "./redis";
import { ClientToServerEvents, InterServerEvents, ISocketUsers, ServerToClientEvents, SocketWithUser } from "../types/socket.types";
import { CallNames, CallTypes, MessageReadStatus, MessageTypes, RedisChannel, SocketActions, SocketChannelErrorTypes } from "../types/enums";
import AuthRouter from "./controllers/auth";
import FileRouter from "./controllers/file";
import UserRouter from "./controllers/user";
import FriendsRouter from "./controllers/friends";
import MessagesRouter from "./controllers/messages";
import useRelations from "./database/relations";
import MessagesModel from "./database/models/messages";
import CallsModel from "./database/models/calls";
import Message from "../core/message";
import { ICall, IMessage } from "../types/models.types";
import { IChatInfo, IFriendInfo } from "../pages/messages/[id]";
dotenv.config();

// Константы process.env
const PORT = process.env.PORT || 8008;
const MODE = process.env.NODE_ENV || "development";
const COOKIE_NAME = process.env.COOKIE_NAME || "sid";
const SECRET_KEY = process.env.SECRET_KEY || "SECRET_KEY";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Создание воркера и его слушателей
function createWorker() {
    const worker = cluster.fork();

    worker.on("error", error => {
        console.log(`Ошибка воркера (id=${worker.id}): ${error}`);
    });
};

/**
 * Если кластер родительский - создаем воркеры
 * Иначе запускаем экземпляр приложения на каждом дочернем воркере
*/
if (cluster.isPrimary) {
    console.log(`Родительский воркер запущен (pid: ${process.pid})`);

    // Соединение с бд
    dbConnect();

    // Создаем дочерние воркеры
    for (let i = 0; i < os.cpus().length; i++) {
        createWorker();
    }

    // Если дочерний воркер не корректно завершает свою работу (не по команде) - его нужно перезапустить
    cluster.on("exit", (worker, code) => {
        console.log(`Дочерний воркер (id=${worker.id}) отключился с кодом: ${code}`);
        createWorker();
    });

    // Если дочерний воркер корректно завершает свою работу
    cluster.on("disconnect", worker => {
        console.log(`Дочерний воркер (id=${worker.id}) отключился`);
    });
} else {
    console.log(`Дочерний воркер запущен (id: ${cluster.worker?.id})`);

    const app = express();
    const server = http.createServer(app);
    const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, any>(server, {
        transports: ["websocket"]
    });

    // TODO
    // Проверить закрытие воркера/сокета
    // Отлавливать событие неконнекта к редису (выдать ошибку на фронт)
    // Добавить условие включения secure: true по протоколу https (включить ssl) - режим продакшена
    // Вместо socket.id (не рекомендуется в доке) использовать id сессии (которая передается в куках и храниться на Redis-сервере)

    // Инициализация Redis-сервера
    const RedisStore = connectRedis(session);
    const redisClient = RedisWorks.getRedisInstance();

    const publisher = redisClient.duplicate();          // Публикатор сообщений в каналы Redis
    const subscriber = redisClient.duplicate();         // Подписка на публикуемые сообщения в каналах Redis

    (async () => {
        await publisher.connect();
        await subscriber.connect();
    })();

    const users: ISocketUsers = {};

    // Мидлвары сервера
    app.use(cors({ credentials: true, origin: CLIENT_URL }));        // Для CORS-заголовков
    app.use(express.json());                                         // Для парсинга json строки
    app.use(cookieParser());                                         // Парсим cookie (позволяет получить доступ к куки через req.cookie)
    app.use(session({                                                // Инициализируем сессию для пользователей
        store: new RedisStore({ client: redisClient }),
        name: COOKIE_NAME,
        secret: SECRET_KEY,
        cookie: {
            secure: false,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            domain: "localhost"
        },
        resave: true,                       // Продлевает maxAge при каждом новом запросе
        rolling: true,                      // Продлевает maxAge при каждом новом запросе
        saveUninitialized: false            // Не помещает в store пустые сессии
    }));

    // Мидлвары авторизации через passport.js
    app.use(passport.initialize());
    app.use(passport.session());
    usePassport();

    // Мидлвар для установки ассоциаций (отношений) между таблицами
    useRelations();

    // Обработка маршрутов
    AuthRouter(app, passport);
    FileRouter(app);
    UserRouter(app);
    FriendsRouter(app);
    MessagesRouter(app);

    // В режиме production возвращаем билд фронтенда
    // if (MODE === "production") {
    //     app.use("/", express.static(path.join(__dirname, "client", "dist")));
    //     app.get("*", (_, res) => res.sendFile(path.resolve(__dirname, "client", "dist", "index.html")));
    // }

    // Милдвар сокета - проверка пользователя в сокете
    io.use((socket: SocketWithUser, next) => {
        const user = socket.handshake.auth.user;

        if (!user) {
            return next(new Error("Не передан пользователь"));
        }

        socket.user = user;
        next();
    });

    // Инициализация io
    io.on("connection", async (socket: SocketWithUser) => {
        try {
            if (!socket.user) {
                throw new Error("Не передан пользователь");
            }

            const userID = socket.user.id;
            const socketID = socket.id;
            const user = socket.handshake.auth.user || socket.user;

            users[userID] = {
                ...users[userID],
                userID,
                socketID,
                user,
            };

            // Отправляем всем пользователям обновленный список активных пользователей
            socket.emit(SocketActions.GET_ALL_USERS, users);

            // Оповещаем все сокеты (кроме себя) об обнаружении нового открытия приложения через браузер
            socket.broadcast.emit(SocketActions.GET_NEW_USER, user);

            // Отправка уведомления, если пользователь вошел после того, как я создал первый с ним диалог
            const tempChatId = await RedisWorks.get(`${RedisChannel.TEMP_CHAT_ID}-${userID}`);

            if (tempChatId) {
                const tempChatIdParsed = JSON.parse(tempChatId);

                if (tempChatIdParsed) {
                    const { userTo } = tempChatIdParsed;

                    // Отправляем себе по сокету значение временного chatId
                    io.to(users[userTo].socketID).emit(SocketActions.SET_TEMP_CHAT_ID, tempChatIdParsed);

                    // Удаляем из редиса временный chatId
                    await RedisWorks.delete(`${RedisChannel.TEMP_CHAT_ID}-${userID}`);
                }
            }

            if (users[userID] && users[userID].call) {
                const { id, usersInCall, chatInfo } = users[userID].call as { id: string; chatInfo: IChatInfo; usersInCall: IFriendInfo[]; };

                socket.emit(SocketActions.ALREADY_IN_CALL, { roomId: id, chatInfo, users: usersInCall });
            }

            // Обработка данных, переданных самому себе с фронта при добавлении пользователя в друзья
            socket.on(SocketActions.FRIENDS, (data) => {
                switch (data.type) {
                    case SocketActions.ADD_TO_FRIENDS: {
                        const { to } = data.payload;

                        if (users[to]) {
                            io.to(users[to].socketID).emit(SocketActions.ADD_TO_FRIENDS);
                        }

                        break;
                    }

                    case SocketActions.UNSUBSCRIBE: {
                        const { to } = data.payload;

                        if (users[to]) {
                            io.to(users[to].socketID).emit(SocketActions.UNSUBSCRIBE);
                        }

                        break;
                    }

                    default:
                        throw new Error("Не передан тип передаваемых данных");
                }
            });

            // Обработка данных, переданных самому себе с фронта при отправке сообщения пользователю
            socket.on(SocketActions.MESSAGE, async ({ data, friendId }) => {
                const { userId } = data;

                if (user && userId === userID) {
                    if (users[friendId] && users[userId]) {
                        socket.broadcast.to(users[friendId].socketID).emit(SocketActions.SEND_MESSAGE, data);
                    }
                }
            });

            // Обработка данных, переданных самому себе с фронта при отправке сообщения пользователю
            socket.on(SocketActions.SET_TEMP_CHAT_ID, async ({ chatId, userFrom, userTo }) => {
                try {
                    if (chatId && userFrom && userTo && socket.user && userID === userFrom && users[userTo] && users[userFrom]) {
                        socket.broadcast.to(users[userTo].socketID).emit(SocketActions.SET_TEMP_CHAT_ID, { chatId, userFrom, userTo });
                    } else {
                        await RedisWorks.set(`${RedisChannel.TEMP_CHAT_ID}-${userTo}`, JSON.stringify({ chatId, userFrom, userTo }));
                    }
                } catch (error) {
                    throw `Произошла ошибка на сокете при событии: ${SocketActions.SET_TEMP_CHAT_ID}`;
                }
            });

            // Начало звонка (одиночный/групповой)
            socket.on(SocketActions.CALL, async ({ roomId, users: usersInCall, chatInfo }) => {
                const { chatId, chatName, chatAvatar, chatSettings, isSingle, initiatorId } = chatInfo;

                // Если я уже в этой комнате, то выводим предупреждение в консоль
                if (Array.from(socket.rooms).includes(roomId)) {
                    console.warn(`Вы уже находитесь в звонке: ${chatName}`);
                }

                if (usersInCall && usersInCall.length) {
                    // Одиночный звонок
                    if (isSingle) {
                        const userTo = usersInCall[1];

                        if (users[userTo.id]) {
                            if (users[userID]) {
                                // Сохраняем id звонка к себе в сокет
                                users[userID].call = { id: roomId, chatInfo, usersInCall };
                            }

                            // Подключаемся в комнату (к звонку)
                            socket.join(roomId);

                            // Уведомляем собеседника о том, что мы ему звоним
                            socket.broadcast.to(users[userTo.id].socketID).emit(SocketActions.NOTIFY_CALL, {
                                roomId,
                                chatInfo,
                                users: usersInCall
                            });

                            const transaction = await sequelize.transaction();

                            try {
                                // Создаем новую запись звонка в таблице Calls
                                await CallsModel.create({
                                    id: roomId,
                                    name: CallNames.OUTGOING,
                                    type: CallTypes.SINGLE,
                                    initiatorId,
                                    chatId,
                                    userIds: usersInCall.map(user => user.id).join(","),
                                }, { transaction });

                                // Создаем запись звонка в таблице Messages
                                const newMessage = new Message({
                                    userId: initiatorId,
                                    chatId,
                                    type: MessageTypes.CALL,
                                    message: "Звонок",
                                    isRead: MessageReadStatus.READ,
                                    callId: roomId
                                });

                                await MessagesModel.create({ ...newMessage }, { transaction });

                                await transaction.commit();
                            } catch (error) {
                                socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                    message: `Возникла ошика при создании записей звонка и сообщения в базу данных: ${error}`,
                                    type: SocketChannelErrorTypes.CALLS
                                });

                                await transaction.rollback();
                            }
                        } else {
                            socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                message: `Невозможно начать звонок, так как собеседник ${userTo.friendName} не в сети`,
                                type: SocketChannelErrorTypes.CALLS
                            });
                        }
                    } else {
                        // Групповой звонок
                        // TODO
                        // Для каждого id проверять на наличие себя в комнате (если нет - добавлять) 
                        // и отправлять уведомление о звонке каждому собеседнику (проходить циклом)
                    }
                } else {
                    socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                        message: `Невозможно начать звонок, так как не ${isSingle ? "передан собеседник" : "переданы собеседники"}`,
                        type: SocketChannelErrorTypes.CALLS
                    });
                }
            });

            // Смена статуса звонка
            socket.on(SocketActions.CHANGE_CALL_STATUS, ({ status, userTo }) => {
                io.to(users[userTo].socketID).emit(SocketActions.SET_CALL_STATUS, { status });
            });

            // Звонок принят
            socket.on(SocketActions.ACCEPT_CALL, async ({ roomId, chatInfo, usersInCall }) => {
                if (roomId && chatInfo && users) {
                    const { chatId, chatName, chatAvatar, chatSettings, isSingle } = chatInfo;

                    // Если я уже в этой комнате, то выводим предупреждение в консоль
                    if (Array.from(socket.rooms).includes(roomId)) {
                        console.warn(`Вы уже находитесь в звонке: ${chatName}`);
                    }

                    // Получаем всех пользователей из комнаты (звонка)
                    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

                    if (clientsInRoom && clientsInRoom.length) {
                        // Событием ADD_PEER - меняем статус на время разговора (если не установлено, иначе устанавливаем)
                        clientsInRoom.forEach(clientId => {
                            // Каждому пользователю из комнаты шлем уведомление о новом подключении (обо мне) - не создаем оффер
                            io.to(clientId).emit(SocketActions.ADD_PEER, {
                                peerId: socketID,
                                createOffer: false,
                                userId: userID
                            });

                            let clientUserId: string | null = null;

                            // Среди онлайн пользователей ищем id i-ого пользователя в комнате
                            for (let key in users) {
                                if (users[key].socketID === clientId) {
                                    clientUserId = users[key].userID;
                                }
                            }

                            if (clientUserId) {
                                // Себе отправляем информацию о каждом пользователе в комнате - создаем оффер
                                socket.emit(SocketActions.ADD_PEER, {
                                    peerId: clientId,
                                    createOffer: true,
                                    userId: clientUserId,
                                });
                            }
                        });

                        if (users[userID]) {
                            // При принятии звонка сохраняем id звонка у себя в сокете
                            users[userID].call = { id: roomId, chatInfo, usersInCall };
                        }

                        // Подключаемся в комнату
                        socket.join(roomId);

                        try {
                            // Обновляем startTime
                            await CallsModel.update(
                                { startTime: new Date().toUTCString() },
                                { where: { id: roomId } }
                            );
                        } catch (error) {
                            socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                message: `Возникла ошибка при обновлении времени начала звонка: ${error}`,
                                type: SocketChannelErrorTypes.CALLS
                            });
                        }
                    }
                } else {
                    socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                        message: "Возникла ошибка при принятии звонка, возможно звонок был уже завершён",
                        type: SocketChannelErrorTypes.CALLS
                    });
                }
            });

            // Передача кандидата
            socket.on(SocketActions.TRANSFER_CANDIDATE, ({ peerId, iceCandidate }) => {
                io.to(peerId).emit(SocketActions.GET_CANDIDATE, {
                    peerId: socketID,
                    iceCandidate,
                });
            });

            // Передача моего созданного предложения другим участникам звонка
            socket.on(SocketActions.TRANSFER_OFFER, ({ peerId, sessionDescription }) => {
                io.to(peerId).emit(SocketActions.SESSION_DESCRIPTION, {
                    peerId: socketID,
                    sessionDescription,
                });
            });

            // Изменение одного из стримов (потоков) аудио/видео
            socket.on(SocketActions.CHANGE_STREAM, ({ type, value, roomId }) => {
                // Уведомляем всех участников звонка об изменении потока аудио/видео
                // Получаем всех пользователей из комнаты (звонка)
                const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

                if (clientsInRoom && clientsInRoom.length) {
                    clientsInRoom.forEach(clientId => {
                        io.to(clientId).emit(SocketActions.CHANGE_STREAM, {
                            peerId: socketID,
                            type,
                            value
                        });
                    });
                }
            });

            // Выход из комнаты
            const leaveRoom = ({ roomId, usersInCall }: { roomId: string; usersInCall?: IFriendInfo[]; }) => {
                // Получаем всех пользователей из комнаты (звонка)
                const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

                if (clientsInRoom && clientsInRoom.length) {
                    clientsInRoom.forEach((clientId) => {
                        // Уведомляем других участников звонка о нашем уходе
                        io.to(clientId).emit(SocketActions.REMOVE_PEER, { peerId: socketID, userId: userID });
                    });

                    // Уведомляем пользователей, которые еще не приняли звонок о том, что звонок был отменен
                    if (usersInCall && usersInCall.length) {
                        usersInCall.forEach(user => {
                            io.to(users[user.id].socketID).emit(SocketActions.CANCEL_CALL);
                        });
                    }

                    // Удаляем из своего сокета id звонка 
                    if (users[userID] && users[userID].call) {
                        users[userID].call = undefined;
                        socket.emit(SocketActions.NOT_ALREADY_IN_CALL);
                    }

                    // Покидаем комнату (звонок)
                    socket.leave(roomId);
                } else {
                    socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                        message: "Невозможно завершить звонок, так как он не найден. Возможно, он уже завершен.",
                        type: SocketChannelErrorTypes.CALLS
                    });
                }
            };

            // Завершение звонка
            socket.on(SocketActions.END_CALL, leaveRoom);

            // Уведомление об отрисовке сообщения на фронте (звонок/)
            socket.on(SocketActions.GET_NEW_MESSAGE_ON_SERVER, async ({ id, type }) => {
                if (id) {
                    switch (type) {
                        case MessageTypes.CALL: {
                            // Получаем всех пользователей из комнаты (звонка)

                            const transaction = await sequelize.transaction();
                            let message: IMessage | null = null;
                            let call: ICall | null = null;

                            try {
                                // Обновляем endTime
                                await CallsModel.update(
                                    { endTime: new Date().toUTCString() },
                                    { where: { id }, transaction }
                                );

                                message = await MessagesModel.findOne({
                                    where: { callId: id },
                                    transaction
                                });

                                call = await CallsModel.findByPk(id, { transaction });

                                await transaction.commit();
                            } catch (error) {
                                await transaction.rollback();

                                throw error;
                            }

                            if (message && call) {
                                const newMessage = {
                                    ...(message as any).dataValues,
                                    Call: call
                                };

                                const usersInCall = call.userIds.split(",");

                                if (usersInCall && usersInCall.length) {
                                    usersInCall.forEach(userId => {
                                        if (users[userId]) {
                                            // Каждому пользователю из звонка шлем уведомление об отрисовке нового сообщения
                                            io.to(users[userId].socketID).emit(SocketActions.ADD_NEW_MESSAGE, { newMessage });
                                        }
                                    });
                                } else {
                                    socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                        message: `Не заполнен массив пользователей в звонке: ${id}`,
                                        type: SocketChannelErrorTypes.CALLS
                                    });
                                }
                            } else {
                                socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                    message: `Запись звонка с id = ${id} не найдена.`,
                                    type: SocketChannelErrorTypes.CALLS
                                });
                            }

                            break;
                        }
                        default:
                            socket.emit(SocketActions.SOCKET_CHANNEL_ERROR, {
                                message: `Передан неизвестный тип сообщения: ${type}`,
                                type: SocketChannelErrorTypes.CALLS
                            });

                            break;
                    }
                }
            });

            // Уведомление собеседников о том, что я набираю сообщение
            socket.on(SocketActions.NOTIFY_WRITE, ({ isWrite, friendId }) => {
                if (users[friendId]) {
                    io.to(users[friendId].socketID).emit(SocketActions.NOTIFY_WRITE, { isWrite });
                }
            });

            // Уведомление других участников о том, что я сейчас говорю/молчу
            socket.on(SocketActions.IS_TALKING, ({ roomId, isTalking }) => {
                if (roomId) {
                    // Получаем всех пользователей из комнаты (звонка)
                    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

                    if (clientsInRoom && clientsInRoom.length) {
                        clientsInRoom.forEach(clientId => {
                            io.to(clientId).emit(SocketActions.IS_TALKING, {
                                peerId: socketID,
                                isTalking,
                            });
                        });
                    }
                }
            });

            // Событие отключения (выполняется немного ранее, чем disconnect) - можно получить доступ к комнатам
            socket.on("disconnecting", (reason) => {
                console.log("[SOCKET.disconnecting]: ", reason);

                const rooms = Array.from(socket.rooms);

                // Выходим из всех комнат только, если пользователь использует 1 (последнюю) вкладку
                if (rooms && rooms.length) {
                    rooms.forEach(roomId => {
                        leaveRoom({ roomId });
                    });
                }
            });

            // Отключение сокета
            socket.on("disconnect", (reason) => {
                console.log(`Сокет с id: ${socketID} отключился по причине: ${reason}`);

                delete users[userID];
            });
        } catch (error) {
            console.error("Произошла ошибка при работе с сокетом: ", error);
            return null;
        }
    });

    // Не нормальное отключение io
    io.engine.on("connection_error", (err: any) => {
        console.log("Не нормальное отключение сокета");
        console.log(err.req);       // the request object
        console.log(err.code);      // the error code, for example 1
        console.log(err.message);   // the error message, for example "Session ID unknown"
        console.log(err.context);   // some additional error context
    });

    // Запуск экземпляра сервера
    (async () => {
        try {
            server.listen(PORT, () => console.log(`Экземпляр сервера запущен на порту: ${PORT} в режиме: ${MODE}`));
        } catch (error) {
            console.error(`Возникла ошибка при запуске экземпляра сервера: ${error}`);

            // Закрываем соединение с бд
            sequelize.close()
                .then(() => console.log("Соединение с бд успешно закрыто"))
                .catch((error: string) => console.error("Соединение с бд завершилось с ошибкой: ", error));

            process.exit(1);
        }
    })();
};