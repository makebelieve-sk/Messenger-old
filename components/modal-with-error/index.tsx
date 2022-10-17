import React from "react";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAppSelector } from "../../hooks/useGlobalState";
import { selectErrorState } from "../../state/error/slice";

// TODO
// Сделать возможность копирования текста ошибки

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
};

const modalTitle = "modal-modal-title";
const modalDescription = "modal-modal-description";

export default function ModalWithError() {
    const [open, setOpen] = React.useState(false);
    const { error } = useAppSelector(selectErrorState);
    const router = useRouter();

    React.useEffect(() => {
        setOpen(Boolean(error));
    }, [error]);

    return <>
        <Modal open={open} onClose={() => setOpen(false)} aria-labelledby={modalTitle} aria-describedby={modalDescription}>
            <Box sx={style}>
                <Typography id={modalTitle} variant="h6" component="h2">
                    Упс! Возникла ошибка в работе сервера
                </Typography>

                <Typography id={modalDescription} sx={{ mt: 2 }}>
                    Пожалуйста, скопируйте текст ошибки и отправьте ее на почту разработчикам: skryabin.aleksey99@gmail.com
                </Typography>

                <Typography id={modalDescription} sx={{ mt: 2 }}>
                    { error }
                </Typography>

                <Typography id={modalDescription} sx={{ mt: 2 }} align="right">
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={router.reload}>Обновить страницу</Button>
                </Typography>
            </Box>
        </Modal>
    </>;
};