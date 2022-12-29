import React from "react";
import { Alert, Button, IconButton, Modal, Snackbar, Tooltip } from "@mui/material";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import { v4 as uuid } from "uuid";
import { MessageTypes } from "../../types/enums";
import FileComponent from "../file";
import { SmilesComponent } from "../smiles";
import { currentSize, MAX_FILE_SIZE, muchSelected } from "../../common";
import { IFile } from "../../types/models.types";
import { InputComponent } from "../input";
import { IFriendInfo } from "../../pages/messages/[id]";

import styles from "./upload-files.module.scss";

const modalTitle = "modal-message-with-files-title";
const modalDescription = "modal-message-with-files-description";

interface IModalWithFiles {
    className: string;
    friendInfo: IFriendInfo | null;
    onSubmit: ({ type, files }: { type: MessageTypes, files: File[] }) => void;
    setCurrentValueRef: (newValue: string, cb?: (oldValue: string) => void) => void;
};

export const UploadFiles = React.memo(({ className, friendInfo, onSubmit, setCurrentValueRef }: IModalWithFiles) => {
    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const [overSize, setOverSize] = React.useState<{ name: string; size: number; }[]>([]);

    const filesRef = React.useRef<any | null>(null);
    const inputFilesRef = React.useRef<HTMLDivElement>(null);

    // Обнуляем файлы в рефе (иначе не сработает изменение при повторном выборе файлов и не откроется модальное окно)
    React.useEffect(() => {
        if (files && !files.length && filesRef.current && filesRef.current.files.length) {
            filesRef.current.value = null;
        }
    }, [files, filesRef.current]);

    // Устанавливаем в инпут с файлами старое значение из инпута в сообщениях
    React.useEffect(() => {
        if (open) {
            setCurrentValueRef("", (oldValue: string) => {
                setTimeout(() => {
                    if (inputFilesRef.current) {
                        inputFilesRef.current.textContent = oldValue;
                    }
                });
            });
        }
    }, [open, inputFilesRef]);

    // Преобразование файлов + проверка на допустимый размер
    const workWithFiles = (files: File[]) => {
        const newFiles = files.reduce((acc, file) => {
            if (file.size > MAX_FILE_SIZE) {
                setOverSize(prev => [...prev, { name: file.name, size: file.size }]);
            } else {
                acc.push(file);
            }

            return acc;
        }, [] as File[]);

        return newFiles;
    };

    // Выбор файлов
    const onChooseFiles = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length) {
            setFiles(workWithFiles(Object.values(e.target.files)));
            setOpen(true);
        }
    }, [setFiles]);

    // Добавление файлов
    const onAddFiles = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length) {
            const newFiles = workWithFiles(Object.values(e.target.files));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, [setFiles]);

    // Закрытие модального окна
    const onClose = () => {
        // Обновляем значение текстового поля в диалоге и после обнуляем содержимое инпута в модальном окне с файлами
        if (inputFilesRef.current && inputFilesRef.current.textContent) {
            setCurrentValueRef(inputFilesRef.current.textContent);
            inputFilesRef.current.textContent = "";
        }

        setFiles([]);
        setOpen(false);
    };

    // Отправка сообщения с файлами
    const onSubmitHandler = React.useCallback(() => {
        if (files && files.length) {
            const type = files.length > 1 ? MessageTypes.FEW_FILES : MessageTypes.WITH_FILE;

            onClose();
            onSubmit({ type, files });
        }
    }, [files]);

    // Закрываем уведомление
    const onCloseSnack = () => {
        setOverSize([]);
    };

    return <>
        <Tooltip title="Прикрепить файл" placement="top">
            <IconButton
                color="primary"
                aria-label="upload-files"
                component="label"
                className={className}
            >
                <input hidden accept="files/*" type="file" multiple onChange={onChooseFiles} ref={filesRef} />

                <AttachFileOutlinedIcon />
            </IconButton>
        </Tooltip>

        <Modal
            open={open}
            aria-labelledby={modalTitle}
            aria-describedby={modalDescription}
        >
            <div className={styles["modal-message-with-files"]}>
                <span className={styles["modal-message-with-files__title"]}>
                    {files.length} {muchSelected(files.length, ["файл выбран", "файла выбрано", "файлов выбрано"])}
                </span>

                <div className={styles["modal-message-with-files__files"]}>
                    {files.map(file => <FileComponent
                        key={uuid()}
                        file={file as unknown as IFile}
                        visibleButtons={true}
                        setFiles={setFiles as unknown as React.Dispatch<React.SetStateAction<IFile[]>>}
                        setOverSize={setOverSize}
                    />)}
                </div>

                <div className={styles["modal-message-with-files__input"]}>
                    <SmilesComponent ref={inputFilesRef} fromFiles={true} />

                    <InputComponent
                        ref={inputFilesRef}
                        friendInfo={friendInfo}
                        onSubmit={onSubmitHandler}
                    />
                </div>

                <div className={styles["modal-message-with-files__buttons"]}>
                    <Button
                        color="primary"
                        aria-label="add-files"
                        component="label"
                        className={styles["modal-message-with-files__buttons__add"]}
                    >
                        <input hidden accept="files/*" type="file" multiple onChange={onAddFiles} />

                        Добавить
                    </Button>

                    <div className={styles["modal-message-with-files__buttons-right"]}>
                        <Button
                            color="error"
                            className={styles["modal-message-with-files__buttons-right__close"]}
                            onClick={onClose}
                        >
                            Закрыть
                        </Button>

                        <Button
                            color="primary"
                            className={styles["modal-message-with-files__buttons-right__submit"]}
                            onClick={onSubmitHandler}
                        >
                            Отправить
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>

        {/* Предупреждение о больших файлах */}
        <Snackbar open={Boolean(overSize && overSize.length)}>
            <Alert onClose={onCloseSnack} severity="error">
                Невозможно загрузить файлы с размером более 10 МБ:
                <br />
                {overSize.map(file => <span key={uuid()} className={styles["filename-in-snack"]}>
                    {file.name} ({currentSize(file.size)})
                </span>)}
            </Alert>
        </Snackbar>
    </>
});