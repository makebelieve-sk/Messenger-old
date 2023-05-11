import React from "react";
import { transformDate } from "../../../common";

import styles from "./system-message.module.scss";

interface ISystemMessage {
    date?: string;
    deleteMarginTop?: boolean;
};

export default React.memo(function SystemMessage({ date, deleteMarginTop }: ISystemMessage) {
    return <div className={`${styles["system-message-container"]} ${date ? "" : "system-message-container__unread-message"} ${deleteMarginTop ? styles["system-message-container__mt-0"] : ""}`}>
        {date 
            ? transformDate(date)
            : "Непрочитанные сообщения"
        }
    </div>
});