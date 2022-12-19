import React from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, Modal, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SnackBarComponent from "../snackbar";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectErrorState } from "../../state/error/slice";
import CatchErrors from "../../core/catch-errors";

import styles from "./modal-with-error.module.scss";

const modalTitle = "modal-modal-title";
const modalDescription = "modal-modal-description";

export default function ModalWithError() {
    const [open, setOpen] = React.useState(true);
    const [visible, setVisible] = React.useState(false);

    const { error } = useAppSelector(selectErrorState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        setOpen(Boolean(error));
    }, [error]);

    // Копирование текста в буфер обмена
    const onCopy = () => {
        if (navigator && navigator.clipboard && error) {
            navigator.clipboard.writeText(error)
                .then(() => {
                    setVisible(true);
                })
                .catch(err => {
                    CatchErrors.catch("Ошибка при копировании текста в буфер обмена: " + err, router, dispatch);
                });
        }
    };

    return <>
        <SnackBarComponent anchor={{ vertical: "top", horizontal: "center" }} open={visible} handleClose={() => setVisible(false)}>
            <Alert onClose={() => setVisible(false)} severity="success" sx={{ width: "100%" }}>
                Текст успешно скопирован в буфер обмена!
            </Alert>
        </SnackBarComponent>

        <Modal open={open} onClose={() => setOpen(false)} aria-labelledby={modalTitle} aria-describedby={modalDescription}>
            <Box className={styles["modal-error-container"]}>
                <Typography id={modalTitle} variant="h6" component="h2">
                    Упс! Возникла ошибка в работе сервера
                </Typography>

                <Typography id={modalDescription} sx={{ mt: 2 }}>
                    Пожалуйста, скопируйте текст ошибки и отправьте ее на почту разработчикам: skryabin.aleksey99@gmail.com
                </Typography>

                <div className={styles["modal-error-container__error"]} onClick={onCopy}>
                    {error}
                </div>

                <Typography id={modalDescription} sx={{ mt: 4 }} align="right">
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={router.reload}>Обновить страницу</Button>
                </Typography>
            </Box>
        </Modal>
    </>
};