import { useRouter } from "next/router";
import React from "react";
import { CircularProgress } from "@mui/material";
import { io, Socket } from "socket.io-client";
import { ApiRoutes, CallStatus, Pages, SocketActions } from "../../config/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { setUser } from "../../state/user/slice";
import Header from "../header";
import MenuComponent from "../menu";
import ModalWithError from "../modal-with-error";
import ModalWithCall from "../modal-with-call";
import { ClientToServerEvents, ServerToClientEvents } from "../../types/socket.types";
import { IUser } from "../../types/models.types";
import { selectMainState, setFriendNotification, setGlobalUserLoading } from "../../state/main/slice";
import { setMessage, setTempChat } from "../../state/messages/slice";
import Request from "../../common/request";
import CatchErrors from "../../axios/catch-errors";
import { SOCKET_IO_CLIENT } from "../../config";
import { setCallId, setCallingUser, setModalVisible, setStatus, setType } from "../../state/calls/slice";

import styles from "./app.module.scss";

export const SocketIOClient = React.createContext<Socket | undefined>(undefined);

export default function App({ Component, pageProps }) {
    const { globalUserLoading } = useAppSelector(selectMainState);

    const dispatch = useAppDispatch();
    const router = useRouter();
    const socketRef = React.useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

    const component = <>
        <ModalWithError />
        <ModalWithCall />
        <Component {...pageProps} />
    </>;

    // Получаем пользователя единственный раз
    React.useEffect(() => {
        Request.get(ApiRoutes.getUser, (loading: boolean) => dispatch(setGlobalUserLoading(loading)),
            (data: { success: boolean, user: IUser }) => {
                const user = data.user;

                if (user) {
                    dispatch(setUser(user));

                    // Инициализируем сокет после получения данных о пользователе, обрабатываем все сокет-ендпоинты
                    if (socketRef.current) {
                        socketRef.current.connect();
                    } else if (typeof window !== "undefined") {
                        socketRef.current = io(SOCKET_IO_CLIENT, { transports: ["websocket"] });
                    }

                    if (socketRef.current) {
                        socketRef.current.auth = { user };

                        socketRef.current.on("connect", () => {
                            if (socketRef.current) {
                                // Список всех онлайн пользователей
                                socketRef.current.on(SocketActions.GET_ALL_USERS, (allUsers) => {
                                    console.log('Юзеры онлайн: ', allUsers);
                                });

                                // Новый пользователь онлайн
                                socketRef.current.on(SocketActions.GET_NEW_USER, (newUser) => {
                                    console.log('Новый юзер: ', newUser);
                                });

                                // Подписываемся на пользователя
                                socketRef.current.on(SocketActions.ADD_TO_FRIENDS, () => {
                                    dispatch(setFriendNotification(1));
                                });

                                // Отписываемся от пользователя
                                socketRef.current.on(SocketActions.UNSUBSCRIBE, () => {
                                    dispatch(setFriendNotification(- 1));
                                });

                                // Получаем сообщение от пользователя
                                socketRef.current.on(SocketActions.SEND_MESSAGE, (message) => {
                                    // console.log("===Пришло сообщение=====", message, window.location.pathname);

                                    if (window.location.pathname.toLowerCase() === Pages.messages + "/" + message.chatId.toLowerCase()) {
                                        dispatch(setMessage({ message, isVisibleUnReadMessages: message.id, updateCounter: true }));

                                        // Чтение сообщения
                                        // Request.post(ApiRoutes.readMessage, { ids: [message.id] }, undefined, undefined, 
                                        //     (error: any) => CatchErrors.catch(error, router, dispatch)
                                        // );
                                    }
                                });

                                // Сохраняем временный chatId
                                socketRef.current.on(SocketActions.SET_TEMP_CHAT_ID, ({ chatId, userFrom, userTo }) => {
                                    if (chatId && userFrom && userTo) {
                                        dispatch(setTempChat({ chatId, userFrom, userTo }));
                                    }
                                });

                                // Меня уведомляют о новом звонке (одиночный/групповой)
                                socketRef.current.on(SocketActions.NOTIFY_CALL, ({ type, userFrom, roomId, isSingle, chatName }) => {                                    
                                    if (roomId && userFrom && chatName) {
                                        // Одиночный звонок
                                        if (isSingle) {
                                            dispatch(setModalVisible(true));
                                            dispatch(setCallingUser({ 
                                                id: userFrom.id,
                                                avatarUrl: userFrom.avatarUrl, 
                                                friendName: userFrom.firstName + " " + userFrom.thirdName
                                            }));
                                            dispatch(setType(type));
                                            dispatch(setStatus(CallStatus.NEW_CALL));
                                            dispatch(setCallId(roomId));
                                            // TODO
                                            // Запоминать групповой/одиночный чат(isSingle) и название чата(chatName)
                                        } else {
                                            // Групповой звонок
                                            // TODO
                                        }
                                    }
                                });

                                // Текущий звонок приняли (хотя бы 1 человек, если это групповой звонок)
                                socketRef.current.on(SocketActions.ACCEPT_CALL, () => {
                                    dispatch(setStatus(CallStatus.ACCEPT));
                                });
                            }
                        });

                        // Событие возникает при невозможности установить соединение или соединение было отклонено сервером (к примеру мидлваром)
                        socketRef.current.on("connect_error", () => {
                            if (socketRef.current) {
                                // Обнлвляем авторизацию юзера
                                socketRef.current.auth = { user };
                                socketRef.current.connect();
                            }
                        });

                        socketRef.current.on("disconnect", (reason) => {
                            // Если сокет отключился по инициативе сервера
                            if (reason === "io server disconnect") {
                                if (socketRef.current) socketRef.current.connect();
                            }

                            // Иначе сокет попытается самостоятельно переподключиться
                        });
                    }
                }
            }, (error: any) => CatchErrors.catch(error, router, dispatch));

        // Отключаем сокет-соединение
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, []);

    return router.pathname !== Pages.signIn && router.pathname !== Pages.signUp
        ? <SocketIOClient.Provider value={socketRef.current}>
            <div className={styles["main__container"]}>
                <Header />

                <div className={styles["main__container__body"]}>
                    <MenuComponent />

                    <div className={styles["main__container__body_content"]}>
                        {globalUserLoading
                            ? <CircularProgress />
                            : component
                        }
                    </div>
                </div>
            </div>
        </SocketIOClient.Provider>
        : component

};