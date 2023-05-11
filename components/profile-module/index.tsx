import React from "react";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import { FriendsTab, MainFriendTabs, Pages } from "../../types/enums";
import Friends from "./friends";
import MainPhoto from "./main-photo";
import PersonalInfo from "./personal-info";
import Photos from "./photos";

export default React.memo(function ProfileModule() {
    const router = useRouter();
    
    // Клик по названию блока
    const onClickBlock = (pathname: Pages, query: { mainTab: MainFriendTabs, tab?: FriendsTab }) => {
        router.push({ pathname, query });
    };
    
    return <Grid container spacing={2}>
        <Grid item container xs={4} spacing={2} direction="column">
            {/* Блок моей фотографии */}
            <MainPhoto />

            {/* Блок друзей */}
            <Friends onClickBlock={onClickBlock} />

            {/* Блок друзей онлайн */}
            <Friends onClickBlock={onClickBlock} onlineFriends={true} />
        </Grid>

        <Grid item container xs={8} spacing={2} direction="column">
            {/* Блок личной информации */}
            <PersonalInfo onClickBlock={onClickBlock} />

            {/* Блок фотографий */}
            <Photos />
        </Grid>
    </Grid>
});