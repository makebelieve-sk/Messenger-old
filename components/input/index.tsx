import React from "react";
import { IFriendInfo } from "../../pages/messages/[id]";
import { MessageTypes, SocketActions } from "../../types/enums";
import { SocketIOClient } from "../socket-io-provider";

import styles from "./input.module.scss";

interface IInputComponent {
    friendInfo: IFriendInfo | null;
    onSubmit: (messageProps?: { type: MessageTypes; files: File[]; } | null) => void;
};

// Компонент получает реф из родительского компонента
export const InputComponent = React.forwardRef((
    { friendInfo, onSubmit }: IInputComponent, 
    ref: React.ForwardedRef<HTMLDivElement>
) => {
    const socket = React.useContext(SocketIOClient);
    
    let timerIsWrite: NodeJS.Timer | null = null;

    // Обработка нажатия на Enter или Shift + Enter
    const onKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
            if (event.shiftKey) return;

            event.preventDefault();
            onSubmit();
        }
    };

    // Отслеживание моего ввода (уведомляем собеседника о том, что я набираю сообщение)
    const onInput = () => {
        if (timerIsWrite) {
            clearTimeout(timerIsWrite);
            timerIsWrite = null;
        }

        if (socket && friendInfo) {
            socket.emit(SocketActions.NOTIFY_WRITE, { isWrite: true, friendId: friendInfo.id });
        }

        timerIsWrite = setTimeout(() => {
            if (socket && friendInfo) {
                socket.emit(SocketActions.NOTIFY_WRITE, { isWrite: false, friendId: friendInfo.id });
            }
        }, 7000);
    };

    return <div
        ref={ref}
        id="submit-input"
        className={styles["messages-container--search-field"]}
        contentEditable="true"
        role="textbox"
        aria-multiline="true"
        onKeyPress={onKeyPress}
        onInput={onInput}
    />
});