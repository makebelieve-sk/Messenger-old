import React from "react";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";

import styles from "./smiles.module.scss";

interface ISmilesComponent {
    fromFiles?: boolean;
};

export const SmilesComponent = React.memo(React.forwardRef(({ fromFiles = false }: ISmilesComponent, inputRef: any) => {
    const [anchorEmoji, setAnchorEmoji] = React.useState<SVGSVGElement | null>(null);

    const emojiPopoverId = Boolean(anchorEmoji) ? "emoji-popover" : undefined;

    React.useEffect(() => {
        return () => {
            setAnchorEmoji(null);
        }
    }, []);

    // Добавление эмодзи в текстовое сообщение
    const onEmojiClick = (emoji: EmojiClickData) => {
        if (emoji && inputRef && inputRef.current) {
            inputRef.current.textContent += emoji.emoji;
        }
    };

    return <>
        <Tooltip title="Выбор смайлика" placement="top">
            <SentimentSatisfiedAltIcon
                aria-describedby={emojiPopoverId}
                className={styles["smiles-container__icon"]}
                onClick={event => setAnchorEmoji(event.currentTarget)}
            />
        </Tooltip>

        <Popover
            id={emojiPopoverId}
            className={`${styles["smiles-container__popover"]} ${fromFiles ? styles["show-right"] : ""}`}
            open={Boolean(anchorEmoji)}
            anchorEl={anchorEmoji}
            onClose={() => setAnchorEmoji(null)}
        >
            <EmojiPicker 
                emojiStyle={EmojiStyle.GOOGLE} 
                onEmojiClick={onEmojiClick} 
                lazyLoadEmojis={true} 
                searchPlaceHolder="Поиск..."
                height={fromFiles ? 350 : 450}
            />
        </Popover>
    </>
}));