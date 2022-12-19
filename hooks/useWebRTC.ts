import React from "react";
import { useRouter } from "next/router";
import freeice from "freeice";
import { SocketIOClient } from "../components/socket-io-provider";
import { CallStatus, MessageTypes, SettingType, SocketActions } from "../types/enums";
import useStateWithCallback from "./useStateWithCallback";
import { selectCallsState, setChatInfo, setLocalStream, setModalVisible, setStatus, setUsers } from "../state/calls/slice";
import { useAppDispatch, useAppSelector } from "./useGlobalState";
import { selectUserState } from "../state/user/slice";
import { IFriendInfo } from "../pages/messages/[id]";
import catchErrors from "../core/catch-errors";
import { AppDispatch } from "../types/redux.types";
import { setSystemError } from "../state/error/slice";

const LOCAL_VIDEO = "LOCAL_VIDEO";

interface IClients {
    peerId: string;
    avatarUrl: string;
    name: string;
    video: boolean;
    audio: boolean;
    isTalking: boolean;
};

export interface ICallSettings {
    [SettingType.AUDIO]: boolean;
    [SettingType.VIDEO]: boolean | { width: number; height: number; };
};

// Получение отрисовки для группового звонка
function getLayout(clientsNumber = 1) {
    const pairs = Array.from<number>({ length: clientsNumber })
        .reduce((acc, element, index, arr) => {
            if (index % 2 === 0) {
                acc.push(arr.slice(index, index + 2));
            }

            return acc;
        }, [] as (number[])[]);

    const rowsNumber = pairs.length;
    const height = `${100 / rowsNumber}%`;

    return pairs
        .map((row, index, arr) => {
            if (index === arr.length - 1 && row.length === 1) {
                return [{
                    width: "100%",
                    height,
                }];
            }

            return row.map(() => ({
                width: "45%",
                height,
            }));
        })
        .flat();
};

// Обнуление состояния звонка
export function resetCallStore(dispatch: AppDispatch) {
    dispatch(setModalVisible(false));
    dispatch(setStatus(CallStatus.NOT_CALL));
    dispatch(setChatInfo(null));
    dispatch(setUsers([]));
    dispatch(setLocalStream(null));
};

export default function useWebRTC() {
    const [clients, updateClients] = useStateWithCallback<IClients[], () => void>([]);
    const [settings, setSettings] = React.useState<ICallSettings>({
        [SettingType.AUDIO]: false,
        [SettingType.VIDEO]: false
    });

    const socket = React.useContext(SocketIOClient);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { callId, chatInfo, localStream, users, status } = useAppSelector(selectCallsState);
    const { user } = useAppSelector(selectUserState);

    // Все RTC соединения (свой + других клиентов в комнате (звонке))
    const peerConnections = React.useRef<{ [key: string]: RTCPeerConnection }>({});
    // Локальные потоки (стримы) аудио/видео
    const localMediaStream = React.useRef<MediaStream | null>(null);
    // Содержит все потоки (стримы) аудио/видео
    const peerMediaElements = React.useRef<{ [key: string]: HTMLVideoElement | null }>({
        [LOCAL_VIDEO]: null,
    });

    // Добавляем нового участника звонка, после вызываем коллбек
    const addNewClient = React.useCallback((newClient: IClients, cb: () => void) => {
        updateClients(list => {
            const findClient = list.find(client => client.peerId === newClient.peerId);

            if (!findClient) {
                return [...list, newClient];
            }

            return list;
        }, cb);
    }, [clients, updateClients]);

    // Выделяем рамку у себя, когда говорим
    const highlightBorderSpeach = React.useCallback((stream: MediaStream, peerId: string) => {
        const num = 32;
        const array = new Uint8Array(num * 2);
        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const src = audioContext.createMediaStreamSource(stream);
        src.connect(analyzer);

        const loop = () => {
            window.requestAnimationFrame(loop);

            analyzer.getByteFrequencyData(array);

            updateClients(list => list.map(client => {
                if (client.peerId === peerId) {
                    const isTalking = Boolean(array[num / 2]);

                    if (socket && callId) {
                        socket.emit(SocketActions.IS_TALKING, { roomId: callId, isTalking });
                    }

                    return {
                        ...client,
                        isTalking
                    }
                }

                return client;
            }));
        };

        loop();
    }, [socket, callId, clients, updateClients]);

    // Получаем текущую отрисовку, в зависимости от количества участников
    const layout = React.useMemo((): {} | { width: string; height: string; }[] => {
        if (clients && clients.length) {
            return getLayout(clients.length);
        }

        return {};
    }, [clients]);

    // Обновлем настройки наших потоков (стримов)
    React.useEffect(() => {
        if (chatInfo && chatInfo.chatSettings) {
            setSettings({
                [SettingType.AUDIO]: chatInfo.chatSettings.audio,
                [SettingType.VIDEO]: chatInfo.chatSettings.video
            });
        }
    }, [chatInfo]);

    // Выделяем рамку у себя, если я - инициатор звонка
    React.useEffect(() => {
        if (localStream) {
            highlightBorderSpeach(localStream, LOCAL_VIDEO);
        }
    }, [localStream]);

    // Если в звонке остается только 1 человек - завершаем его
    // При размонтировании компонента очищаем все сохраненные локально потоки (стримы)
    React.useEffect(() => {
        if (user && users && users.length && users.length === 1) {
            // Уведомляем всех участников звонка о его завершении
            if (socket && callId) {
                socket.emit(SocketActions.GET_NEW_MESSAGE_ON_SERVER, { id: callId, type: MessageTypes.CALL });
            } else {
                dispatch(setSystemError("Не удалось загрузить сообщение с только что завершенным звонком. Пожалуйста, обновите страницу!"));
            }

            onLeaveHandler({ peerId: LOCAL_VIDEO, userId: user.id, isLocal: true });
            resetCallStore(dispatch);
        }
    }, [users, user]);

    // (2 ШАГ) Добавление нового подключения
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.ADD_PEER, async ({ peerId, createOffer, userId }) => {
                // Если у нас уже RTC соединение создано (свое/другого клиента в комнате) - выводим ошибку
                if (peerConnections.current[peerId]) {
                    return console.warn(`RTC соединение уже создано с ${peerId}`);
                }

                // Создаем новое RTC соединение
                peerConnections.current[peerId] = new RTCPeerConnection({
                    iceServers: freeice(),
                });

                // Добавляем обработчик onicecandidate
                // Он возникает после вызова setLocalDescription
                // Происходит подбор кандидатов для установки интерактивного соединения (ICE gathering)
                peerConnections.current[peerId].onicecandidate = (event) => {
                    if (event.candidate) {
                        // Передаем кандидата (себя) другой стороне
                        socket.emit(SocketActions.TRANSFER_CANDIDATE, {
                            peerId,
                            iceCandidate: event.candidate,
                        });
                    }
                };

                const name = users && users.length ? users.find(user => user.id === userId)?.friendName : "";
                const avatarUrl = users && users.length ? users.find(user => user.id === userId)?.avatarUrl : "";

                // Событие содержит медиапотоки, полученные от другой стороны, в виде массива
                peerConnections.current[peerId].ontrack = ({ streams }) => {
                    addNewClient({
                        peerId,
                        name: name ? name : "",
                        avatarUrl: avatarUrl ? avatarUrl : "",
                        video: Boolean(settings[SettingType.VIDEO]),
                        audio: Boolean(settings[SettingType.AUDIO]),
                        isTalking: false,
                    }, () => {
                        if (peerMediaElements.current && peerMediaElements.current[peerId]) {
                            (peerMediaElements.current[peerId] as HTMLVideoElement).srcObject = streams[0];
                        }
                    });
                };

                // Если я инициатор и если у меня нет моего сохраненного потока, то я сохраняю локальный поток
                if (!createOffer && localStream && !localMediaStream.current) {
                    localMediaStream.current = localStream;
                }

                // Добавляем все свои локальные захваченные треки в peerConnections
                if (localMediaStream.current) {
                    localMediaStream.current.getTracks().forEach(track => {
                        if (localMediaStream.current) {
                            peerConnections.current[peerId].addTrack(track, localMediaStream.current);
                        }
                    });

                    if (user) {
                        addNewClient({
                            peerId: LOCAL_VIDEO,
                            name: user.firstName + " " + user.thirdName,
                            avatarUrl: user.avatarUrl,
                            video: Boolean(settings[SettingType.VIDEO]),
                            audio: Boolean(settings[SettingType.AUDIO]),
                            isTalking: false,
                        }, () => {
                            if (peerMediaElements.current && peerMediaElements.current[LOCAL_VIDEO]) {
                                peerMediaElements.current[LOCAL_VIDEO].srcObject = localMediaStream.current;
                            }
                        });
                    }
                }

                // Если инициатор звонка не я
                // Генерируем предложение об установке соединения для других клиентов в комнате (звонке)
                if (createOffer) {
                    const offer = await peerConnections.current[peerId].createOffer();

                    await peerConnections.current[peerId].setLocalDescription(offer);

                    // Передаем сгенерированное предложение другим участникам звонка
                    socket.emit(SocketActions.TRANSFER_OFFER, {
                        peerId,
                        sessionDescription: offer,
                    });
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.ADD_PEER);
            }
        }
    }, [users, localStream]);

    // (3 ШАГ) Создание сессии передается от меня другому участнику звонка (я себе записываю ОТВЕТ от другого участника)
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.SESSION_DESCRIPTION, async ({ peerId, sessionDescription: remoteDescription }) => {
                if (peerConnections.current && peerConnections.current[peerId]) {
                    await peerConnections.current[peerId].setRemoteDescription(
                        new RTCSessionDescription(remoteDescription)
                    );
                }

                // Если тип - ответ, то мы сюда не заходим
                // Генерация ответа на предложенный оффер от другого участника звонка мне
                if (remoteDescription.type === "offer") {
                    const answer = await peerConnections.current[peerId].createAnswer();

                    await peerConnections.current[peerId].setLocalDescription(answer);

                    socket.emit(SocketActions.TRANSFER_OFFER, {
                        peerId,
                        sessionDescription: answer,
                    });
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.SESSION_DESCRIPTION);
            }
        }
    }, []);

    // (4 ШАГ ПОСЛЕДНИЙ) Получаем кандидата после события onicecandidate
    // После этого стороны могут напрямую обмениваться медиаданными
    // При размонтировании обнуляем все
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.GET_CANDIDATE, ({ peerId, iceCandidate }) => {
                if (peerConnections.current && peerConnections.current[peerId]) {
                    peerConnections.current[peerId].addIceCandidate(
                        new RTCIceCandidate(iceCandidate)
                    );

                    dispatch(setStatus(CallStatus.ACCEPT));
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.GET_CANDIDATE);
            }

            if (socket && callId) {
                socket.emit(SocketActions.END_CALL, { roomId: callId });
            }
        }
    }, []);

    // Выделение тех собеседников, кто говорит в данный момент
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.IS_TALKING, ({ peerId, isTalking }) => {
                if (peerId && clients && clients.length) {
                    const currentClient = clients.find(client => client.peerId === peerId);

                    if (currentClient) {
                        const indexOf = clients.indexOf(currentClient);

                        if (indexOf >= 0) {
                            updateClients(prev => {
                                currentClient.isTalking = isTalking;

                                return [...prev.slice(0, indexOf), currentClient, ...prev.slice(indexOf + 1)];
                            });
                        }
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.IS_TALKING);
            }
        }
    }, [clients]);

    // При изменении потоков аудио/видео у другого участника звонка обновляем информацию об этом клиенте у нас
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.CHANGE_STREAM, async ({ peerId, type, value }) => {
                if (clients && clients.length) {
                    const currentClient = clients.find(client => client.peerId === peerId);

                    if (currentClient) {
                        const indexOf = clients.indexOf(currentClient);

                        if (indexOf >= 0) {
                            updateClients(prev => {
                                switch (type) {
                                    case SettingType.VIDEO:
                                        currentClient.video = value;
                                        break;
                                    case SettingType.AUDIO:
                                        currentClient.audio = value;
                                        break;
                                    default:
                                        catchErrors.catch(
                                            "Невозможно изменить настройки звонка, так как пришел неизвестный тип: " + type,
                                            router,
                                            dispatch
                                        );
                                        break;
                                }

                                return [...prev.slice(0, indexOf), currentClient, ...prev.slice(indexOf + 1)];
                            });
                        }
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.CHANGE_STREAM);
            }
        }
    }, [clients]);

    // Удаление стримов(потоков) пользователя у себя
    React.useEffect(() => {
        if (socket) {
            socket.on(SocketActions.REMOVE_PEER, ({ peerId, userId }) => {
                const isLocal = Boolean(user && userId === user.id);
                onLeaveHandler({ peerId, userId, isLocal });
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.REMOVE_PEER);
            }
        }
    }, [users]);

    // (1 ШАГ) Захват камеры и микрофона 
    const startCapture = async () => {
        if (chatInfo && user) {
            dispatch(setStatus(CallStatus.SET_CONNECTION));                     // Статус - "Установка соединения"

            localMediaStream.current = await navigator.mediaDevices.getUserMedia(chatInfo.chatSettings);

            // Добавляем себя в качестве клиента (для отрисовки)
            addNewClient({
                peerId: LOCAL_VIDEO,
                name: user.firstName + " " + user.thirdName,
                avatarUrl: user.avatarUrl,
                video: Boolean(settings[SettingType.VIDEO]),
                audio: Boolean(settings[SettingType.AUDIO]),
                isTalking: false,
            }, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                if (localVideoElement) {
                    localVideoElement.volume = 0;                               // Убавляем себя (чтобы не дублировать звук)
                    localVideoElement.srcObject = localMediaStream.current;     // Сохраняем себе свои локальные потоки (стримы)

                    if (localMediaStream.current) {
                        highlightBorderSpeach(localMediaStream.current, LOCAL_VIDEO);
                    }
                }
            });
        }
    };

    // Принятие звонка
    const onAccept = React.useCallback(() => {
        if (socket && callId && chatInfo && users) {
            startCapture()
                .then(() => socket.emit(SocketActions.ACCEPT_CALL, { roomId: callId, chatInfo, usersInCall: users }))
                .catch((error) => catchErrors.catch(error, router, dispatch));
        }
    }, [socket, callId, chatInfo, users, router, dispatch]);

    // Выключение/включение аудио/видео
    const onToggle = async (type: SettingType) => {
        if (localMediaStream.current && chatInfo) {
            const newValue = !settings[SettingType.VIDEO] && type === SettingType.VIDEO && typeof chatInfo.chatSettings.video === "object"
                ? chatInfo.chatSettings.video
                : !settings[type];

            setSettings({ ...settings, [type]: newValue });

            switch (type) {
                case SettingType.AUDIO: {
                    localMediaStream.current.getAudioTracks().forEach(track => {
                        track.enabled = Boolean(newValue);
                    });

                    const currentClient = clients.find(client => client.peerId === LOCAL_VIDEO);

                    if (currentClient) {
                        const indexOf = clients.indexOf(currentClient);

                        if (indexOf >= 0) {
                            updateClients(prev => {
                                currentClient.audio = Boolean(newValue);

                                return [...prev.slice(0, indexOf), currentClient, ...prev.slice(indexOf + 1)];
                            });
                        }
                    }

                    if (socket && callId) {
                        socket.emit(SocketActions.CHANGE_STREAM, { type, value: Boolean(newValue), roomId: callId });
                    }

                    break;
                }

                case SettingType.VIDEO: {
                    localMediaStream.current.getVideoTracks().forEach(track => {
                        track.enabled = Boolean(newValue);
                    });

                    const currentClient = clients.find(client => client.peerId === LOCAL_VIDEO);

                    if (currentClient) {
                        const indexOf = clients.indexOf(currentClient);

                        if (indexOf >= 0) {
                            updateClients(prev => {
                                currentClient.video = Boolean(newValue);

                                return [...prev.slice(0, indexOf), currentClient, ...prev.slice(indexOf + 1)];
                            });
                        }
                    }

                    if (socket && callId) {
                        socket.emit(SocketActions.CHANGE_STREAM, { type, value: Boolean(newValue), roomId: callId });
                    }

                    break;
                }

                default:
                    catchErrors.catch("Невозможно изменить настройки звонка, так как пришел неизвестный тип: " + type, router, dispatch);
                    break;
            }

        }
    };

    // Обработчик удаления стримов и потоков при выходе из комнаты (звонка)
    const onLeaveHandler = ({ peerId, userId, isLocal }: { peerId: string, userId: string; isLocal: boolean }) => {
        if (peerConnections.current[peerId]) {
            peerConnections.current[peerId].close();
        }

        if (isLocal) {
            peerConnections.current = {};
            peerMediaElements.current = { [LOCAL_VIDEO]: null };

            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach(track => track.stop());
                localMediaStream.current = null;
            }

            updateClients(() => []);
        } else {
            delete peerConnections.current[peerId];
            delete peerMediaElements.current[peerId];

            updateClients(list => list.filter(c => c.peerId !== peerId));

            // Удаляю отключаемого пользователя из массива users
            if (users && users.length) {
                const newUsers = users.filter(user => user.id !== userId);
                dispatch(setUsers(newUsers));
            }
        }
    };

    // Завершение звонка (выход из комнаты)
    const onEnd = () => {
        if (socket && callId && user) {
            // Сначала удаляем локальные стримы и потоки
            onLeaveHandler({ peerId: LOCAL_VIDEO, userId: user.id, isLocal: true });

            const socketObject: { roomId: string; usersInCall?: IFriendInfo[]; } = {
                roomId: callId,
            };

            if (chatInfo && chatInfo.initiatorId && users) {
                socketObject.usersInCall = chatInfo.initiatorId === user.id ? users : undefined;
            }

            // Отправляем событие о выходе из комнаты на сервер
            socket.emit(SocketActions.END_CALL, socketObject);

            // Если статус звонка - Вызов, я иинциатор и отменяю звонок - то необходимо отрисовать сообщение с отмененным звонком
            if (chatInfo && chatInfo.initiatorId && status === CallStatus.WAIT) {
                socket.emit(SocketActions.GET_NEW_MESSAGE_ON_SERVER, { id: callId, type: MessageTypes.CALL });
            }

            // Обнуляем состояние звонка
            resetCallStore(dispatch);
        }
    };

    // Определяем корректный peerId для элемента video
    const provideMediaRef = React.useCallback((id: string, node: HTMLVideoElement | null) => {
        peerMediaElements.current[id] = node;
    }, []);

    return {
        LOCAL_VIDEO,
        clients,
        settings,
        layout,
        onAccept,
        onToggle,
        onEnd,
        provideMediaRef,
    };
};