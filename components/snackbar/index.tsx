import { Snackbar } from "@mui/material";
import React from "react";

interface ISnackBarComponent {
    anchor: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right"; };
    message?: string;
    open: boolean;
    handleClose?: () => void;
    children?: JSX.Element;
};

export default function SnackBarComponent({ anchor, message, open, handleClose, children }: ISnackBarComponent) {
    return <Snackbar
        key={message + anchor.toString() + open}
        anchorOrigin={anchor}
        open={open}
        onClose={handleClose}
        message={message}
        autoHideDuration={5000}
    >
        {children}
    </Snackbar>
};