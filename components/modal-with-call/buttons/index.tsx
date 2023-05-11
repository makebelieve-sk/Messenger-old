import React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import PhoneDisabledOutlinedIcon from '@mui/icons-material/PhoneDisabledOutlined';
import { CallStatus, SettingType } from "../../../types/enums";
import { ICallSettings } from "../../../hooks/useWebRTC";

import styles from "./buttons.module.scss";

interface IButtons {
    status: CallStatus;
    settings: ICallSettings;
    visibleVideo: boolean;
    onAccept: () => void;
    onToggle: (type: SettingType) => void;
    onEnd: () => void;
};

export default React.memo(function Buttons({ status, settings, visibleVideo, onAccept, onToggle, onEnd }: IButtons) {
    // Завершение звонка
    const endCall = (title: string = "Завершить звонок") => <Tooltip title={title}>
        <Button color="error" variant="outlined" className={styles["call-container__button"]} onClick={onEnd}>
            <PhoneDisabledOutlinedIcon />
        </Button>
    </Tooltip>;

    switch (status) {
        case CallStatus.SET_CONNECTION:
            return endCall();
        case CallStatus.WAIT:
            return endCall();
        case CallStatus.NEW_CALL:
            return <>
                {endCall("Отклонить")}

                <Tooltip title="Принять">
                    <Button color="success" variant="outlined" className={styles["call-container__button"]} onClick={onAccept}>
                        <LocalPhoneOutlinedIcon />
                    </Button>
                </Tooltip>
            </>;
        case CallStatus.ACCEPT:
            return <>
                <Tooltip title={`${settings[SettingType.AUDIO] ? "Выключить" : "Включить"} микрофон`}>
                    <Button
                        variant="outlined"
                        color={settings[SettingType.AUDIO] ? "primary" : "error"}
                        className={styles["call-container__button"]}
                        onClick={_ => onToggle(SettingType.AUDIO)}
                    >
                        {settings[SettingType.AUDIO]
                            ? <MicNoneOutlinedIcon />
                            : <MicOffOutlinedIcon color="error" />
                        }
                    </Button>
                </Tooltip>

                {visibleVideo
                    ? <Tooltip title={`${settings[SettingType.VIDEO] ? "Выключить" : "Включить"} видео`}>
                        <Button
                            variant="outlined"
                            color={settings[SettingType.VIDEO] ? "primary" : "error"}
                            className={styles["call-container__button"]}
                            onClick={_ => onToggle(SettingType.VIDEO)}
                        >
                            {settings[SettingType.VIDEO]
                                ? <VideocamOutlinedIcon />
                                : <VideocamOffOutlinedIcon color="error" />
                            }
                        </Button>
                    </Tooltip>
                    : null
                }

                {endCall()}
            </>;
        default:
            return null;
    }
});