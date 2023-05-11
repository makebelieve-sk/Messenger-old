import React from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import { useRouter } from "next/router";
import { Pages } from "../../types/enums";

import styles from "./avatar-with-badge.module.scss";

interface IAvatarWithBadge {
    chatAvatar: string;
    alt: string;
    isOnline: boolean;
    avatarClassName?: string;
    size?: number;
    pushLeft?: boolean;
};

export default React.memo(function AvatarWithBadge({ alt, chatAvatar, isOnline, avatarClassName, size = 46, pushLeft = false }: IAvatarWithBadge) {
    const router = useRouter();

    return <Badge
        className={`${styles["avatar-badge"]} ${isOnline ? styles["avatar-badge__active"] : ""}`}
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        sx={{ marginLeft: pushLeft ? "auto" : "50%", transform: pushLeft ? "none" : "translateX(-50%)" }}
    >
        <Avatar 
            alt={alt} 
            src={chatAvatar} 
            className={`${styles["avatar-badge__avatar"]} ${avatarClassName ? styles[avatarClassName] : ""}`} 
            sx={{ width: size, height: size }}
            onClick={() => router.push(Pages.profile)} 
        />
    </Badge>
});