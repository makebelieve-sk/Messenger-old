export const COOKIE_NAME = process.env.COOKIE_NAME || "sid";
export const SOCKET_IO_CLIENT = process.env.SOCKET_IO_CLIENT || "http://localhost:8008";

// Получение часов или минут в формате 00:00
export const getHoursOrMinutes = (time: number) => {
    return time < 10 ? `0${time}` : time;
};

// Получение названия месяца
export const getMonthName = (month: number) => {
    const months = ["янв", "фев", "мар", "апр", "мая", "июня", "июля", "авг", "сент", "окт", "нояб", "дек"];

    return " " + months[month];
};

// Выводим конечную дату
export const transformDate = (d: string) => {
    const date = new Date(d);
    const months = [
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря",
    ];

    const dayNumber = date.getDate();
    const month = months[date.getMonth()];
    const year = new Date().getMonth() - date.getMonth() >= 6 ? " " + date.getFullYear() : "";

    return dayNumber + " " + month + year;
};

// Лимит подгружаемых записей
export const LIMIT = 20;

// Определяем, является ли чат групповым
export const isSingleChat = (id: string) => id.length === 36;

export const NO_PHOTO = "/img/no-avatar.jpg";
export const REQUIRED_FIELD = "Заполните поле";

export const rtcSettings = {
    audioCall: {
        audio: true,
        video: false,
    },
    videoCall: {
        audio: true,
        video: {
            width: 1280,
            height: 720,
        }
    }
};