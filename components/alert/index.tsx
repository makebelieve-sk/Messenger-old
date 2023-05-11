import React from "react";
import { Slide, Alert } from "@mui/material";

import styles from "./alert.module.scss";

interface IAlertComponent {
    show: boolean;
    children: JSX.Element;
    status?: "error" | "success" | "warning" | "info";
};

export default React.memo(function AlertComponent({ show, children, status = "success" }: IAlertComponent) {
    return <Slide in={show} mountOnEnter unmountOnExit timeout={1000} className={styles["slide"]}>
        <Alert color={status} className={styles["alert"]}>
            { children }
        </Alert>
    </Slide>
});