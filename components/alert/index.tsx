import React from "react";
import { Slide, Alert } from "@mui/material";

interface IAlertComponent {
    show: boolean;
    children: JSX.Element;
};

export default function AlertComponent({ show, children }: IAlertComponent) {
    return <Slide direction="down" in={show} mountOnEnter unmountOnExit timeout={1000} style={{ paddingTop: "10px" }}>
        <Alert severity="success" color="info">
            {children}
        </Alert>
    </Slide>
};