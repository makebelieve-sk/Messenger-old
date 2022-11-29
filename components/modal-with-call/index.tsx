import React from "react";
import { useRouter } from "next/router";
import freeice from "freeice";
import { Button, CircularProgress, Dialog, DialogContent } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";
import { selectCallsState, setStatus } from "../../state/calls/slice";
import { setError } from "../../state/error/slice";
import { CallStatus, SocketActions } from "../../config/enums";
import { NO_PHOTO } from "../../config";
import { SocketIOClient } from "../app";
import useStateWithCallback from "../../hooks/useStateWithCallback";
import catchErrors from "../../axios/catch-errors";

import styles from "./modal-with-call.module.scss";

export const LOCAL_VIDEO = "LOCAL_VIDEO";

// TODO
// Для аудио звонка изменить внешний вид

export default function ModalWithCall() {
    const [open, setOpen] = React.useState(false);
    const [clients, updateClients] = useStateWithCallback<string[], () => void>([]);

    const socket = React.useContext(SocketIOClient);
    // TODO
    // В options (вместо type) передавать объект {audio: true, video: true}, для того, чтобы можно было отключать видео/аудио
    const { visible, callingUser, status, type, callId } = useAppSelector(selectCallsState);
    const { user } = useAppSelector(selectUserState);

    const router = useRouter();
    const dispatch = useAppDispatch();

    const peerConnections = React.useRef({});       // Все RTC соединения (свой + других клиентов в комнате (звонке))
    const localMediaStream = React.useRef<any | null>(null);    // Локальные потоки (стримы) аудио/видео
    const peerMediaElements = React.useRef<any | null>({
        [LOCAL_VIDEO]: null,
    });                                             // Содержит все потоки (стримы) аудио/видео

    // Добавляем нового участника звонка, после вызываем коллбек
    const addNewClient = React.useCallback((newClient: string, cb: () => void) => {
        updateClients(list => {
            if (!list.includes(newClient)) {
                return [...list, newClient]
            }

            return list;
        }, cb);
    }, [clients, updateClients]);

    React.useEffect(() => {
        setOpen(Boolean(visible && status !== CallStatus.NOT_CALL));
    }, [visible, status]);

    // (2 ШАГ) Добавление нового подключения
    React.useEffect(() => {
        if (socket) {
            let i = 0;

            socket.on(SocketActions.ADD_PEER, async ({ peerId, createOffer }) => {
                if (!i) {
                    console.log("----------Начало установки соединения для -----------", peerId);

                    // Если у нас уже RTC соединение создано (свое/другого клиента в комнате) - выводим ошибку
                    if (!peerConnections.current[peerId]) {
                        // return console.warn(`RTC соединение уже создано с ${peerId}`);
                        // Создаем новое RTC соединение
                        peerConnections.current[peerId] = new RTCPeerConnection({
                            iceServers: freeice(),
                        });
                        console.log("----------Создание RTC соединения-----------");
                    }

                    // Добавляем обработчик onicecandidate
                    // Он возникает после вызова setLocalDescription
                    // Происходит подбор кандидатов для установки интерактивного соединения (ICE gathering)
                    peerConnections.current[peerId].onicecandidate = (event: any) => {
                        if (event.candidate) {
                            console.log("----------Передаем кандидата-----------", event.candidate);
                            // Передаем кандидата (себя) другой стороне
                            socket.emit(SocketActions.TRANSFER_CANDIDATE, {
                                peerId,
                                iceCandidate: event.candidate,
                            });
                        }
                    };

                    // Событие содержит медиапотоки, полученные от другой стороны, в виде массива
                    // В нашем случае в массиве будет только один такой поток
                    let tracksNumber = 0;

                    peerConnections.current[peerId].ontrack = ({ streams }) => {
                        tracksNumber++;

                        if (tracksNumber === 2) {
                            console.log("----------Добавляем поток (стрим) в peerMediaElements.current[peerId]-----------");
                            addNewClient(peerId, () => {
                                if (peerMediaElements.current) {
                                    peerMediaElements.current[peerId].srcObject = streams[0];
                                }
                            });
                        }
                    };

                    // Добавляем все захваченные треки в peerConnections
                    if (localMediaStream.current) {
                        console.log("----------Добавляем поток (стрим) в peerConnections.current[peerId]-----------");
                        localMediaStream.current.getTracks().forEach((track: any) => {
                            peerConnections.current[peerId].addTrack(track, localMediaStream.current);
                        });
                    }

                    console.log("----------createOffer-----------", createOffer);
                    
                    // Если инициатор звонка не я
                    // Генерируем предложение об установке соединения для других клиентов в комнате (звонке)
                    if (createOffer) {
                        const offer = await peerConnections.current[peerId].createOffer();
                        console.log("----------Отправка оффера + делаем setLocalDescription-----------");
                        await peerConnections.current[peerId].setLocalDescription(offer);
                        
                        // Передаем сгенерированное предложение другим участникам звонка
                        socket.emit(SocketActions.TRANSFER_OFFER, {
                            peerId,
                            sessionDescription: offer,
                        });
                    }

                    i++;
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.ADD_PEER);
            }
        }
    }, []);

    // (3 ШАГ) Создание сессии передается от меня другому участнику звонка (я себе записываю ОТВЕТ от другого участника)
    React.useEffect(() => {
        if (socket) {
            let i = 0;

            socket.on(SocketActions.SESSION_DESCRIPTION, async ({ peerId, sessionDescription: remoteDescription }) => {
                if (!i) {
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

                    i++;
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
    React.useEffect(() => {
        if (socket) {
            let i = 0;

            socket.on(SocketActions.GET_CANDIDATE, ({ peerId, iceCandidate }) => {
                if (!i) {
                    if (peerConnections.current && peerConnections.current[peerId]) {
                        peerConnections.current[peerId].addIceCandidate(
                            new RTCIceCandidate(iceCandidate)
                        );
                        console.log("Соединение установлено");
                        // TODO
                        // Сейчас соединение мое со звонком установлено (смена записи Установка соединения на Вызов только у меня!)
                        // dispatch(setStatus(CallStatus.ACCEPT));
                    }

                    i++;
                }
            });
        }

        return () => {
            if (socket) {
                socket.off(SocketActions.GET_CANDIDATE);
            }
        }
    }, []);

    React.useEffect(() => {
        if ((!callingUser || !user) && open) {
            dispatch(setError(`
                Невозможно открыть меню вызовов, так как произошла ошибка в загрузке информации о Вас или Вашем собеседнике. 
                Пожалуйста, обновите страницу.
            `));
        }
    }, [callingUser, user, open]);

    // При размонтировании компонента очищаем все сохраненные локально потоки (стримы)
    React.useEffect(() => {
        return () => {
            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach(track => track.stop());
                // socket.emit(ACTIONS.LEAVE);
            }
        };
    }, []);

    // (1 ШАГ) Захват камеры и микрофона 
    const startCapture = async () => {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: 1280,
                height: 720,
            }
        });

        // Добавляем себя в качестве клиента (для отрисовки)
        addNewClient(LOCAL_VIDEO, () => {
            const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
            console.log("----------Добавляем поток (стрим) в peerMediaElements.current[LOCAL_VIDEO]-----------");
            if (localVideoElement) {
                localVideoElement.volume = 0;                               // Убавляем себя (чтобы не дублировать звук)
                localVideoElement.srcObject = localMediaStream.current;     // Сохраняем себе свои локальные потоки (стримы)
            }
        });
    };

    // Принятие звонка
    const onAccept = () => {
        if (socket && callId && callingUser) {
            startCapture()
                .then(() => {
                    socket.emit(SocketActions.ACCEPT_CALL, { roomId: callId, callingUser, isSingle: true, chatName: "Алексей Скрябин" });
                })
                .catch((error) => catchErrors.catch(error, router, dispatch));
        }
    };

    return <Dialog
        fullWidth={true}
        maxWidth="xl"
        open={open}
        onClose={() => console.log("Закрытие")}
    >
        <DialogContent className={styles["call-container"]}>
            {clients && clients.length
                ? clients.map((clientID) => {
                    return (
                        <div key={clientID} id={clientID} className={styles["video-container"]}>
                            <video
                                width="100%"
                                height="100%"
                                ref={instance => {
                                    peerMediaElements.current[clientID] = instance;
                                }}
                                autoPlay
                                playsInline
                                muted={clientID === LOCAL_VIDEO}
                            />
                        </div>
                    );
                })
                : callingUser && user
                    ? <>
                        <div className={styles["call-container__content-block"]}>
                            {status
                                ? <div className={styles["call-container__wait-block"]}>
                                    <img alt={callingUser.friendName} src={callingUser.avatarUrl ? callingUser.avatarUrl : NO_PHOTO} />

                                    <div className={styles["call-container__wait-block__content"]}>
                                        <p>{callingUser.friendName}</p>
                                        {status === CallStatus.SET_CONNECTION
                                            ? <p>Установка соединения</p>
                                            : status === CallStatus.WAIT
                                                ? <p>Вызов</p>
                                                : status === CallStatus.NEW_CALL
                                                    ? <p>Видеозвонок</p>
                                                    : status === CallStatus.ACCEPT
                                                        ? <p>Длительность звонка: 00:00</p>
                                                        : null
                                        }
                                    </div>
                                </div>
                                : null
                            }
                        </div>

                        <div className={styles["call-container__buttons-block"]}>
                            {status === CallStatus.NEW_CALL
                                ? <>
                                    <Button color="error" className={styles["call-container__button"]}>
                                        Отклонить
                                    </Button>

                                    <Button className={styles["call-container__button"]} onClick={onAccept}>
                                        Принять
                                    </Button>
                                </>
                                : status === CallStatus.ACCEPT
                                    ? <>
                                        <>
                                            <Button color="error" className={styles["call-container__button"]}>
                                                Отключиться
                                            </Button>

                                            <Button className={styles["call-container__button"]}>
                                                Выключить камеру
                                            </Button>

                                            <Button className={styles["call-container__button"]}>
                                                Выключить микрофон
                                            </Button>
                                        </>
                                    </>
                                    : <Button color="error">
                                        Отключиться
                                    </Button>
                            }
                        </div>
                    </>
                    : <CircularProgress />
            }
        </DialogContent>
    </Dialog>
};