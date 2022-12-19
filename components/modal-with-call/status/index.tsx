import React from "react";
import { getHoursOrMinutes } from "../../../common";
import { CallStatus } from "../../../types/enums";

interface IStatus {
    status: CallStatus;
    type: string;
};

export default function Status({ status, type }: IStatus) {
    const [time, setTime] = React.useState({ min: 0, sec: 0 });

    const timer = React.useRef<any | null>(null);

    // Реализация таймера (продолжительность звонка)
    React.useEffect(() => {
        if (status && status === CallStatus.ACCEPT) {
            timer.current = setInterval(() => {
                let newSec = time.sec + 1;
                let newMin = time.min;

                if (newSec === 60) {
                    newMin += 1;
                    newSec = 0;
                }

                setTime({ min: newMin, sec: newSec });
            }, 1000);
        }

        return () => {
            if (timer.current) {
                clearInterval(timer.current);
                timer.current = null;
            }
        }
    }, [time, status]);

    switch (status) {
        case CallStatus.SET_CONNECTION:
            return <span>Установка соединения</span>;
        case CallStatus.WAIT:
            return <span>Вызов</span>;
        case CallStatus.NEW_CALL:
            return <span>{type}</span>;
        case CallStatus.ACCEPT:
            return <span>Длительность звонка: {getHoursOrMinutes(time.min) + ":" + getHoursOrMinutes(time.sec)}</span>;
        default:
            return null;
    }
};