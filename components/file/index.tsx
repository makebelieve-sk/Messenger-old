import React from "react";
import { useRouter } from "next/router";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ScreenRotationAltIcon from "@mui/icons-material/ScreenRotationAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import { currentSize, MAX_FILE_SIZE } from "../../common";
import { IFile } from "../../types/models.types";
import Request from "../../core/request";
import CatchErrors from "../../core/catch-errors";
import { ApiRoutes } from "../../types/enums";
import { useAppDispatch } from "../../hooks/useGlobalState";

import styles from "./file.module.scss";

interface IFileComponent {
    file: IFile;
    visibleButtons: boolean;
    setFiles?: React.Dispatch<React.SetStateAction<IFile[]>>;
    setOverSize?: React.Dispatch<React.SetStateAction<{ name: string; size: number; }[]>>;
};

export default React.memo(function FileComponent({ file, visibleButtons = false, setFiles, setOverSize }: IFileComponent) {
    const [contextMenu, setContextMenu] = React.useState<{ mouseX: number; mouseY: number; } | null>(null);

    const { id, name, size, path } = file;

    const router = useRouter();
    const dispatch = useAppDispatch();

    // Открытие файла при клике на него
    const onOpenFile = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();

        if (!contextMenu) {
            Request.post(
                ApiRoutes.openFile,
                { path },
                undefined,
                undefined,
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    };

    // Открытие контексного меню над файлом
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        setContextMenu(contextMenu === null
            ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
            : null
        );
    };

    // Закрытие контексного меню
    const handleClose = () => {
        setContextMenu(null);
    };

    // Скачать файл
    const onDownloadFile = async (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();

        setContextMenu(null);

        Request.downloadFile(
            window, 
            document, 
            `path=${path}&name=${name}`, 
            { name }, 
            (error: any) => CatchErrors.catch(error, router, dispatch)
        );
    };

    // Изменение файла
    const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && setOverSize && setFiles) {
            const newFile: any = e.target.files[0];

            if (newFile.size > MAX_FILE_SIZE) {
                setOverSize(prev => [...prev, { name: newFile.name, size: newFile.size }]);
            } else {
                newFile.id = id;

                setFiles(files => {
                    const indexOf = files.indexOf(file);

                    if (indexOf >= 0) {
                        return [...files.slice(0, indexOf), newFile, ...files.slice(indexOf + 1)];
                    }

                    return files;
                });
            }
        }
    }, [file, setFiles]);

    // Удаление файла
    const onDelete = React.useCallback(() => {
        if (setFiles) {
            setFiles(files => {
                const indexOf = files.indexOf(file);

                if (indexOf >= 0) {
                    return [...files.slice(0, indexOf), ...files.slice(indexOf + 1)];
                }

                return files;
            });
        }
    }, [file, setFiles]);

    return <div className={styles["file"]}>
        <div className={styles["file__main"]} onClick={onOpenFile} onContextMenu={handleContextMenu}>
            <div className={`${styles["file__main__icon"]} ${visibleButtons ? styles["blue"] : styles["green"]}`}>
                <InsertDriveFileIcon />
            </div>

            <div className={styles["file__main__info"]}>
                <span className={styles["file__main__info__name"]}>
                    {name.length > 25 && visibleButtons ? name.slice(0, 10) + "..." + name.slice(name.length - 10) : name}
                </span>
                <span className={`${styles["file__main__info__size"]} opacity-text`}>{currentSize(size)}</span>
            </div>

            <Menu
                open={contextMenu !== null}
                onClose={handleClose}
                autoFocus={false}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu !== null
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                    : undefined
                }
            >
                <MenuItem onClick={onDownloadFile} className={styles["menu-item"]}>
                    <FileDownloadOutlinedIcon /> Скачать
                </MenuItem>
            </Menu>
        </div>

        {visibleButtons
            ? <div className={styles["file__buttons"]}>
                <Tooltip title="Изменить файл" placement="top">
                    <IconButton
                        color="info"
                        aria-label="upload-files"
                        component="label"
                        className={styles["file__buttons__change"]}
                    >
                        <input hidden accept="files/*" type="file" onChange={onChange} />

                        <ScreenRotationAltIcon className={styles["file__buttons__change__icon"]} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Удалить файл" placement="top">
                    <IconButton
                        color="error"
                        className={styles["file__buttons__delete"]}
                        onClick={onDelete}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </div>
            : null
        }
    </div>
});