import React from "react";
import { useRouter } from "next/router";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import CircularProgress from "@mui/material/CircularProgress";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import useDebounce from "../hooks/useDebounce";
import Request from "../core/request";
import CatchErrors from "../core/catch-errors";
import { ApiRoutes, MessageTypes } from "../types/enums";
import { ICall, IFile, IUser } from "../types/models.types";
import { selectUserState } from "../state/user/slice";
import { selectMessagesState, setDialogs } from "../state/messages/slice";
import SkeletonBlock from "../components/skeleton-block";
import DialogComponent from "../components/dialog";

import styles from "../styles/pages/messages.module.scss";

export type UserExt = Pick<IUser, "id" | "firstName" | "thirdName" | "avatarUrl">;
export type MessageExt = {
    message: string;
    type: MessageTypes;
    files: IFile[];
    call: ICall | undefined | null;
    createDate: string;
    notifyWrite: string;
};

export interface IDialog {
    id: string;
    messageObject: MessageExt;
    userFrom: UserExt;
    unReadMessagesCount: number;
    userTo: UserExt;
    name?: string;
};

// TODO
// Каждую работу делать в отдельных ветках!
// В БД избавиться от всех "некорректных" полей - Chats, Calls - поля user_ids. User_details - photos
// Посмотреть работу с изображениями (как устанавливать конкретный размер - высоту/ширину, и чтобы изображение само подстраивалось) - ВЕЗДЕ!!!

// Добавить крестик для удаления фотографии при наведении на свою аватарку/остальные фотографии профиля (удалить из бд, с диска и в состоянии) - модалка (вы точно хотите удалить свою аватарку?)
// Во всех модалках обнулять значение в сторе (например error и тд) + можно продумать и вынести общую логику всех модалок и стилей
// Если в поиске ничего не найдено, то выдаются все сообщения
// Сильно лагает при скролле большого кол-ва сообщений
// Исправить фон времени у сообщения с одним изображением

// Добавить подгрузку еще диалогов
// Добавить иконку создания группового чата (сделать модалку создания группового чата)
// Добавить иконку настроек (реализовать модальное окно с настройками)

export default function Messages() {
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(0);
    const [isMore, setIsMore] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Хук useDebounce (кастомный)
    const debouncedSearchValue = useDebounce(searchValue);

    const { user } = useAppSelector(selectUserState);
    const { dialogs } = useAppSelector(selectMessagesState);

    const router = useRouter();
    const dispatch = useAppDispatch();

    // Получаем список диалогов (чатов)
    React.useEffect(() => {
        if (user && (dialogs && !dialogs.length || !dialogs)) {
            Request.post(ApiRoutes.getDialogs, { userId: user.id, page }, setLoading,
                (data: { success: boolean, dialogs: IDialog[]; isMore: boolean; }) => {
                    dispatch(setDialogs(data.dialogs));
                    setIsMore(data.isMore);
                },
                (error) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user]);

    // Реализация поиска диалогов с использованием хука useDebounce
    React.useEffect(() => {
        if (user) {
            Request.post(ApiRoutes.getDialogs, { userId: user.id, page, search: debouncedSearchValue }, setLoading,
                (data: { success: boolean, dialogs: IDialog[]; isMore: boolean; }) => {
                    dispatch(setDialogs(data.dialogs));
                    setIsMore(data.isMore);
                },
                (error) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [debouncedSearchValue]);

    return <Paper className={styles["messages-container"]}>
        <TextField
            id="standard-input"
            label="Поиск"
            variant="standard"
            fullWidth
            className={styles["messages-container--search-field"]}
            size="small"
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
        />

        {loading
            ? <Stack spacing={1} className={styles["skeleton-container"]}>
                <SkeletonBlock 
                    keyProp="messages-container " 
                    className={styles["skeleton-container__row"] + " " + styles["messages-container__skeleton-container"]} 
                />
            </Stack>
            : dialogs && dialogs.length
                ? <List className={styles["messages-container__list"]}>
                    {isMore
                        ? <div id="loading-dialogs-is-more" className={styles["messages-container__list__is-more"]}>
                            <CircularProgress />
                        </div>
                        : null
                    }

                    {dialogs.map(dialog => <DialogComponent key={dialog.id} dialog={dialog} />)}
                </List>
                : <div className={styles["messages-container__no-dialogs"] + " opacity-text"}>
                    У Вас пока нет диалогов. Напишите кому-нибудь!
                </div>
        }
    </Paper>
};