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

// Лимит подгружаемых записей
export const LIMIT = 20;

// Определяем, является ли чат групповым
export const isSingleChat = (id: string) => id.length === 36;

export const NO_PHOTO = "/avatars/no-photo.jpg";