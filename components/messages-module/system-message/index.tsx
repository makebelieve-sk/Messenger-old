import React from "react";
import { transformDate } from "../../../common";

import styles from "./system-message.module.scss";

interface ISystemMessage {
    date?: string;
};

export default function SystemMessage({ date }: ISystemMessage) {
    return <div className={styles["system-message-container"]}>
        {date 
            ? transformDate(date)
            : "Непрочитанные сообщения"
        }
    </div>
}