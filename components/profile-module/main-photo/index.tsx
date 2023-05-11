import React from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { NO_PHOTO } from "../../../common";
import { useAppDispatch, useAppSelector } from "../../../hooks/useGlobalState";
import { changeUserField, selectUserState } from "../../../state/user/slice";
import { setImagesInCarousel } from "../../../state/main/slice";
import ChangeAvatar from "../../change-avatar";
import ImgComponent from "../../img";

import styles from "./main-photo.module.scss";

export default React.memo(function MainPhoto() {
    const [loading, setLoading] = React.useState(false);

    const { user } = useAppSelector(selectUserState);
    const dispatch = useAppDispatch();

    // Клик по своей аватарке
    const onClickMainPhoto = () => {
        if (user) {
            dispatch(setImagesInCarousel({
                images: [{
                    id: user.id,
                    src: user.avatarUrl ? user.avatarUrl : NO_PHOTO,
                    alt: user.firstName + " " + user.thirdName,
                    fromProfile: true
                }],
                index: 0
            }));
        }
    };

    // Изменение своей аватарки
    const onChangeAvatar = (field: string, value: string) => {
        dispatch(changeUserField({ field, value }))
    };

    if (!user) {
        return null;
    }

    return <Grid item>
        <Paper className="main-photo-container paper-block">
            <ImgComponent
                src={user.avatarUrl ? user.avatarUrl : NO_PHOTO}
                alt="user-avatar"
                closeIcon={true}
                wrapperClassName={styles["main-photo-container__avatar"]}
                clickHandler={onClickMainPhoto}
            />

            <LoadingButton variant="outlined" size="small" className={styles["main-photo-container__edit-button"]} disabled={loading} loading={loading}>
                <Typography variant="caption" className={styles["main-photo-container__edit-button__typegraphy"]}>
                    <ChangeAvatar
                        labelClassname={styles["main-photo-container__edit-button__text"]}
                        labelText="Изменить"
                        mustAuth={true}
                        onChange={onChangeAvatar}
                        setLoading={setLoading}
                    />
                </Typography>
            </LoadingButton>
        </Paper>
    </Grid>
});