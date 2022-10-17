import { useRouter } from "next/router";
import React from "react";
import { CircularProgress } from "@mui/material";
import { io, Socket } from "socket.io-client";
import { ApiRoutes, Pages, SocketActions } from "../../config/enums";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState, setUser } from "../../state/user/slice";
import Header from "../header";
import MenuComponent from "../menu";
import ModalWithError from "../modal-with-error";
import { ClientToServerEvents, ServerToClientEvents } from "../../types/socket.types";
import { IUser } from "../../types/models.types";
import { selectMainState, setFriendNotification, setGlobalUserLoading } from "../../state/main/slice";
import { setMessage, setTempChat } from "../../state/messages/slice";
import Request from "../../common/request";
import CatchErrors from "../../axios/catch-errors";
import { SOCKET_IO_CLIENT } from "../../config";

import styles from "./app.module.scss";

export const SocketIOClient = React.createContext<Socket | undefined>(undefined);

export default function App({ Component, pageProps }) {
    const { friendNotification, globalUserLoading } = useAppSelector(selectMainState);
    const { user } = useAppSelector(selectUserState);

    const dispatch = useAppDispatch();
    const router = useRouter();
    const socketRef = React.useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

    const component = <>
        <ModalWithError />
        <Component {...pageProps} />
    </>;

    // Получаем пользователя единственный раз
    React.useEffect(() => {
        Request.get(ApiRoutes.getUser, (loading: boolean) => dispatch(setGlobalUserLoading(loading)), (data: { success: boolean, user: IUser }) => {
            if (data.user) {
                dispatch(setUser(data.user));
            }
        }, (error: any) => CatchErrors.catch(error, router, dispatch));
    }, []);

    // Инициализируем сокет после получения данных о пользователе, обрабатываем все сокет-ендпоинты
    React.useEffect(() => {
        if (user) {
            if (socketRef.current) {
                socketRef.current.connect();
            } else if (typeof window !== "undefined") {
                socketRef.current = io(SOCKET_IO_CLIENT, { transports: ["websocket", "polling", "flashsocket"] });
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
                            dispatch(setFriendNotification(friendNotification + 1));
                        });
    
                        // Отписываемся от пользователя
                        socketRef.current.on(SocketActions.UNSUBSCRIBE, () => {
                            dispatch(setFriendNotification(friendNotification ? friendNotification - 1 : 0));
                        });
    
                        // Получаем сообщение от пользователя
                        socketRef.current.on(SocketActions.SEND_MESSAGE, (message) => {
                            console.log("===Пришло сообщение=====", message, window.location.pathname)
                            if (window.location.pathname.toLowerCase() === Pages.messages + "/" + message.chatId.toLowerCase()) {
                                dispatch(setMessage(message));
                                Request.post(ApiRoutes.readMessage, { ids: [message.id] }, undefined, undefined, (error: any) => CatchErrors.catch(error, router, dispatch));
                            }
                        });
    
                        // Сохраняем временный chatId
                        socketRef.current.on(SocketActions.SET_TEMP_CHAT_ID, ({ chatId, userFrom, userTo }) => {
                            if (chatId && userFrom && userTo) {
                                dispatch(setTempChat({ chatId, userFrom, userTo }));
                            }
                        });
                    }
                });
            }
        }

        // Отключаем сокет-соединение
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, [user]);

    return <SocketIOClient.Provider value={socketRef.current}>
        {router.pathname !== Pages.signIn && router.pathname !== Pages.signUp
            ? <div className={styles.body}>
                <Header />
                <div className={styles["body-container"]}>
                    <MenuComponent />
                    <div className={styles["body-container_page-content-wrapper"]}>
                        {globalUserLoading
                            ? <CircularProgress />
                            : component
                        }
                    </div>
                </div>
            </div>
            : component
        }
    </SocketIOClient.Provider>
};