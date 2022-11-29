import express, { NextFunction, Response, Request } from "express";
import cluster from "cluster";
import os from "os";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import connectRedis from "connect-redis";
import { v4 as uuid } from "uuid";

import { dbConnect, sequelize } from "./database";
import usePassport from "./passport";
import { ClientToServerEvents, InterServerEvents, ISocketUsers, ServerToClientEvents, SocketWithUser } from "../types/socket.types";
import { RedisChannel, SocketActions } from "../config/enums";
import AuthRouter from "./controllers/auth";
import FileRouter from "./controllers/file";
import UserRouter from "./controllers/user";
import FriendsRouter from "./controllers/friends";
import MessagesRouter from "./controllers/messages";
import useRelations from "./database/relations";
import RedisWorks from "./redis";
dotenv.config();

// Константы process.env
const PORT = process.env.PORT || 8080;
const MODE = process.env.NODE_ENV || "development";
const COOKIE_NAME = process.env.COOKIE_NAME || "sid";
const SECRET_KEY = process.env.SECRET_KEY || "SECRET_KEY";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Создание воркера и его слушателей
function createWorker() {
    const worker = cluster.fork();

    worker.on("error", error => {
        console.log(`Ошибка воркера (pid=${worker.id}): ${error}`);
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
        console.log(`Дочерний воркер (pid=${worker.process.pid}) отключился с кодом: ${code}`);
        createWorker();
    });

    // Если дочерний воркер корректно завершает свою работу
    cluster.on("disconnect", worker => {
        console.log(`Дочерний воркер (pid=${worker.id}) отключился`);
    });
} else {
    console.log(`Дочерний воркер запущен (id: ${cluster.worker?.id})`);

    const app = express();
    const server = http.createServer(app);
    const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, any>(server, {
        transports: ["websocket"]
    });

    // TODO
    // Клиент обращается к каждому серверу (должен к одному и тому же) - для примера - у меня создается несколько повторяющихся событий
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

    const sessionMiddleware = session({
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
    });

    const users: ISocketUsers = {};

    // Мидлвары сервера
    app.use(cors({ credentials: true, origin: CLIENT_URL }));        // Для CORS-заголовков
    app.use(express.json());                                         // Для парсинга json строки
    app.use(cookieParser());                                         // Парсим cookie (позволяет получить доступ к куки через req.cookie)
    app.use(sessionMiddleware);                                      // Инициализируем сессию для пользователей

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
    if (MODE === "production") {
        app.use("/", express.static(path.join(__dirname, "client", "dist")));
        app.get("*", (_, res) => res.sendFile(path.resolve(__dirname, "client", "dist", "index.html")));
    }

    // Милдвар сокета - проверка пользователя в сокете
    io.use((socket: SocketWithUser, next) => {
        // Инициализируем сессию для пользователей на socket.io
        sessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);

        const user = socket.handshake.auth.user;

        if (!user) {
            return next(new Error("Не передан пользователь"));
        }

        socket.user = user;
        next();
    });

    // Удаление сессии на сокете
    // io.on("session:destroy", (sessionId: any) => {
    //     console.log("Удалили сессию на сокете: ", sessionId);

    //     if (socket.request && socket.request.session) {
    //         // const sessionId = socket.request.session.id || socket.request.sessionID;
    //         console.log("Id сессии: ", socket.request.session.id, socket.request.sessionID);

    //         // Удаляем сессию юзера
    //         socket.request.session.destroy((error: any) => {
    //             if (error) {
    //                 throw new Error(`Ошибка при удалении сессии пользователя на сокете: ${error}`);
    //             }
    //         });
    //     }
    // });

    // Инициализация io
    io.on("connection", async (socket: SocketWithUser) => {
        try {
            if (!socket.user) {
                throw new Error("Не передан пользователь");
            }

            // TODO
            // Отслеживаем сколько одновременно у меня соединений (проверять, если подключение больше 1 -> отправлять событие на фронт на обновление уведомлений)
            // const session = socket.request.session;
            // session.connections++;
            // session.save();

            const userID = socket.user.id;
            const socketID = socket.id;
            const user = socket.handshake.auth.user || socket.user;

            users[userID] = {
                ...users[userID],
                userID,
                socketID,
                user
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

            // TODO
            // решить проблему множественного ответа по сокету
            // Начало звонка (одиночный/групповой)
            socket.on(SocketActions.CALL, async ({ roomId, type, userFrom, users: callingUsers, isSingle, chatName }) => {
                if (userFrom.id === userID) {
                    // Если я уже в этой комнате, то выводим предупреждение в консоль
                    if (Array.from(socket.rooms).includes(roomId)) {
                        console.warn(`[CALL] Вы уже находитесь в звонке: ${chatName}`);
                    }

                    // Одиночный звонок
                    if (isSingle) {
                        if (callingUsers.length === 1 && callingUsers[0]) {
                            const userTo = callingUsers[0];

                            if (users[userTo.id]) {
                                // Подключаемся в комнату (к звонку)
                                console.log(`Инициатор звонка ${userFrom.id} подключился в комнату ${roomId} `)
                                socket.join(roomId);

                                // Уведомляем собеседника о том, что мы ему звоним
                                socket.broadcast.to(users[userTo.id].socketID).emit(
                                    SocketActions.NOTIFY_CALL,
                                    { type, userFrom, roomId, isSingle, chatName }
                                );
                            } else {
                                // TODO
                                // Выводить сообщение событием CallStatus.OFFLINE
                                console.error(`Невозможно начать звонок, так как собеседник ${userTo.friendName} оффлайн`);
                                return null;
                            }
                        } else {
                            // TODO
                            // Создать канал ошибок
                            console.error("Невозможно начать звонок, так как не передан собеседник");
                            return null;
                        }
                    } else {
                        // Групповой звонок
                        // TODO
                        // Для каждого id проверять на наличие себя в комнате (если нет - добавлять) 
                        // и отправлять уведомление о звонке каждому собеседнику (проходить циклом)
                    }
                }
            });

            let i = 0;
            // Звонок принят
            socket.on(SocketActions.ACCEPT_CALL, async ({ roomId, callingUser, isSingle, chatName }) => {
                if (!i) {
                    if (roomId && callingUser) {
                        // Если я уже в этой комнате, то выводим предупреждение в консоль
                        if (Array.from(socket.rooms).includes(roomId)) {
                            console.warn(`[ACCEPT_CALL] Вы уже находитесь в звонке: ${chatName}`);
                        }
    
                        // Получаем всех пользователей из комнаты
                        const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                        console.log("Юзеры в комнате: ", clientsInRoom)
    
                        if (clientsInRoom && clientsInRoom.length) {
                            clientsInRoom.forEach(clientId => {
                                console.log(`Отправляем юзеру в комнате ${clientId} (инициатору)`)
                                // Каждому пользователю из комнаты шлем уведомление о новом подключении (обо мне) - не создаем оффер
                                io.to(clientId).emit(SocketActions.ADD_PEER, {
                                    peerId: socketID,
                                    createOffer: false
                                });
    
                                console.log(`Отправляем юзеру в комнате ${socket.id} (получателю)`)
                                // Себе отправляем информацию о каждом пользователе в комнате - создаем оффер
                                socket.emit(SocketActions.ADD_PEER, {
                                    peerId: clientId,
                                    createOffer: true
                                });
                            });
                        }
    
                        // Подключаемся в комнату
                        socket.join(roomId);
                        // Уведомляем собеседника о том, что мы приняли звонок
                        // socket.broadcast.to(users[callingUser.id].socketID).emit(SocketActions.ACCEPT_CALL);
                    }

                    i++;
                }
            });

            let j = 0;
            // Передача кандидата
            socket.on(SocketActions.TRANSFER_CANDIDATE, ({ peerId, iceCandidate }) => {
                if (!j) {
                    console.log("Передача кандидата ему: ", peerId);
                    io.to(peerId).emit(SocketActions.GET_CANDIDATE, {
                        peerId: socketID,
                        iceCandidate,
                    });

                    j++;
                }
            });

            let z = 0;
            // Передача моего созданного предложения другим участникам звонка
            socket.on(SocketActions.TRANSFER_OFFER, ({ peerId, sessionDescription }) => {
                if (!z) {
                    console.log("Передача предложения ему: ", peerId);
                    
                    io.to(peerId).emit(SocketActions.SESSION_DESCRIPTION, {
                        peerId: socketID,
                        sessionDescription,
                    });

                    z++;
                }
            });

            // TODO
            // Сначала сохранить id звонка (комнаты), а при отключении сокета уведомлять других учатсников звонка о выходе чела 
            // или завершении звонка (если звонок не групповой)
            // Здесь можно получить доступ к комнатам (выполняется чуть ранее события disconnect)
            // socket.on("disconnecting", (reason) => {
            // for (const room of socket.rooms) {
            // if (room !== socket.id) {
            // socket.to(room).emit("user has left the room", socket.id);
            // }
            // }
            // });

            // Отключение сокета
            socket.on("disconnect", (reason) => {
                console.log(`Сокет с id: ${userID} отключился по причине: ${reason}`);

                delete users[userID];   // Удаляем юзера из списка юзеров
            });
        } catch (error) {
            console.log("Произошла ошибка при работе с сокетом: ", error);
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