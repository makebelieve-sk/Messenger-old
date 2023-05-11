import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { IFormState } from "../../pages/sign-up";
import ChangeAvatar from "../change-avatar";

import styles from "./sign-up.module.scss";

interface IChooseAvatar {
    username: string;
    formValues: IFormState;
    onChange: (field: string, value: string, validateCallback?: (value: string) => string, anotherField?: string) => void;
};

export default React.memo(function ChooseAvatar({ username, formValues, onChange }: IChooseAvatar) {
    const [avatarUrl, setAvatarUrl] = React.useState<string>(formValues.values.avatarUrl);
    const [loading, setLoading] = React.useState(false);

    const avatarLetters = username.split(" ").map(str => str[0]).join("");

    // Изменение своей аватарки
    const onChangeAvatar = (field: string, value: string) => {
        setAvatarUrl(value);           // Устанавливаем аватарку с сервера (jpeg, обрезанную)
        onChange(field, value);        // Обновляем поле avatarUrl в объекте пользователя
    };

    return (
        <Box className={styles["choose-avatar"]}>
            <Grid container spacing={2} className={styles["choose-avatar__container"]}>
                <Grid item xs={8}>
                    <Typography className={styles["choose-avatar__container__main-text"]}>{username}, как на счет такого аватара?</Typography>
                </Grid>

                <Grid item xs={8} className={styles["choose-avatar__container__avatar-wrapper"]}>
                    {loading
                        ? <Skeleton variant="rectangular" className={styles["choose-avatar__container__avatar-loading"]} />
                        : avatarUrl
                            ? <img alt="User avatar" src={avatarUrl} className={styles["choose-avatar__container__avatar"]} />
                            : <div className={styles["choose-avatar__container__avatar-without-user"]}>{avatarLetters}</div>
                    }
                </Grid>

                <Grid item xs={8}>
                    <ChangeAvatar 
                        labelClassname={styles["choose-avatar__container__diff-photo"]} 
                        labelText="Выбрать другое фото"
                        onChange={onChangeAvatar}
                        setLoading={setLoading}
                    />
                </Grid>
            </Grid>
        </Box>
    );
});