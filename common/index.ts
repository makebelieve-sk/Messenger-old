import { FileVarieties, MessageTypes } from "../types/enums";
import { IFile, IMessage, IUser } from "../types/models.types";
import { v4 as uuid } from "uuid";

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
export const transformDate = (d: string, getYear = false) => {
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
    const year = getYear 
        ? " " + date.getFullYear() 
        : new Date().getMonth() - date.getMonth() >= 6 
            ? " " + date.getFullYear() 
            : "";

    return dayNumber + " " + month + year;
};

// Лимит подгружаемых сообщений при первоначальной загрузке
export const LIMIT = 25;
// Лимит подгружаемых сообщений при "Загрузить еще"
export const LOAD_MORE_LIMIT = 25;

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

// Максимальный размер файла в байтах (10 МБ)
export const MAX_FILE_SIZE = 10000000;

// Склонение переданного массива строк по переданому числу
export const muchSelected = (number: number, txt: string[]) => {
    const cases = [2, 0, 1, 1, 1, 2];

    return txt[(number % 100 > 4 && number % 100 < 20)
        ? 2
        : cases[(number % 10 < 5) ? number % 10 : 5]];
};

// Расчёт размера файла
export const currentSize = (size: number) => {
    const units = ["B", "KB", "MB", "GB"];

    const exponent = Math.min(
        Math.floor(Math.log(size) / Math.log(1024)),
        units.length - 1
    );

    const approx = size / 1024 ** exponent;
    const output = exponent === 0
        ? `${size} байт`
        : `${approx.toFixed(1)} ${units[exponent]}`;

    return output;
};

// Проверка, является ли файл изображением
export const isImage = (filename: string) => {
    const fileExt = filename.split(".").pop();
    const imgExts = ["png", "jpeg", "jpg"];

    return fileExt ? imgExts.includes(fileExt) : false;
};

// Обработка сообщений с файлами (разделение на отдельные сообщения)
export const handlingMessagesWithFiles = (messages: IMessage[]) => {
    return messages.reduce((acc, message) => {
        switch (message.type) {
            // Несколько файлов в сообщении
            case MessageTypes.FEW_FILES: {
                if (message.files && message.files.length) {
                    // Отделяем в отдельное сообщение сам текст (от файлов и изображений)
                    acc.push({
                        ...message,
                        type: MessageTypes.MESSAGE,
                        id: uuid(),
                        createDate: message.createDate
                    });

                    const images: IFile[] = [];

                    // Отделяем файлы от картинок в разные массивы
                    const files = (message.files as IFile[]).reduce((acc, file) => {
                        const isFileImage = isImage(file.name);

                        if (isFileImage) {
                            images.push(file);
                        } else {
                            acc.push(file);
                        }

                        return acc;
                    }, [] as IFile[]);

                    // Формируем для каждых 10 файлов новое сообщение
                    for (let i = 0; i < files.length / 10; i++) {
                        acc.push({
                            ...message,
                            type: MessageTypes.FEW_FILES,
                            id: uuid(),
                            files: files.slice(i * 10, i * 10 + 10),
                            fileExt: FileVarieties.FILES
                        });
                    }

                    // Формируем для каждых 4 изображений новое сообщение
                    if (images.length) {
                        for (let i = 0; i < images.length / 4; i++) {
                            acc.push({
                                ...message,
                                type: MessageTypes.FEW_FILES,
                                id: uuid(),
                                files: images.slice(i * 4, i * 4 + 4),
                                fileExt: FileVarieties.IMAGES
                            });
                        }
                    }
                }

                return acc;
            };

            // Один файл в сообщении
            case MessageTypes.WITH_FILE: {
                if (message.files && message.files.length) {
                    const file = message.files[0] as IFile;

                    const isFileImage = isImage(file.name);

                    acc.push({ 
                        ...message, 
                        fileExt: isFileImage ? FileVarieties.IMAGES : FileVarieties.FILES
                    });

                    return acc;
                }
            }; 
            
            default:
                acc.push(message);
                return acc;
        };
    }, [] as IMessage[]);
};

// Формирование массива объектов фотографий
export const getPhotosInstance = (photos: string[], user: IUser | null) => {
    if (photos && photos.length && user) {
        return photos.map(photo => ({
            id: uuid(),
            alt: user.firstName + " " + user.thirdName,
            src: photo
        }));
    }

    return null;
};