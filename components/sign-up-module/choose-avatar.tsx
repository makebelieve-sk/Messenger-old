import React from "react";
import { Grid, Box, Typography, Skeleton } from "@mui/material";
import { IFormState } from "../../pages/sign-up";
import Axios from "../../axios";
import { ApiRoutes } from "../../types/enums";

import styles from "./sign-up.module.scss";

interface IChooseAvatar {
    username: string;
    formValues: IFormState;
    onChange: (field: string, value: string, validateCallback?: (value: string) => string, anotherField?: string) => void;
};

export default function ChooseAvatar({ username, formValues, onChange }: IChooseAvatar) {
    const [avatarUrl, setAvatarUrl] = React.useState<string>(formValues.values.avatarUrl);
    const [loading, setLoading] = React.useState(false);

    const inputFileRef = React.useRef<HTMLInputElement>(null);
    const avatarLetters = username.split(" ").map(str => str[0]).join("");

    // Если файл изменился, вызываем функцию handleChangeImage
    React.useEffect(() => {
        if (inputFileRef.current) inputFileRef.current.addEventListener("change", handleChangeImage);
    }, []);

    // Сжатие аватарки на сервере
    const uploadImage = async (file: File): Promise<any> => {
        try {
            setLoading(true);
            const formData = new FormData();    // Создаем объект FormData
            formData.append("avatar", file);    // Добавляем файл в объект formData (на сервере будет req.file, где мидлвар FileController.uploader.single("avatar"))
    
            // Получаем ответ от сервера
            const result = await Axios.post(ApiRoutes.uploadImage, formData, { headers: { "Content-Type": "multipart/form-data" } });
            
            if (result && result.data && result.data.success) {
                return result.data;
            } else {
                return null;
            }
        } catch (error: any) {
            console.error(error);
            throw new Error(error);
        } finally {
            setLoading(false);
        }
    };

    // Функция изменения аватарки
    const handleChangeImage = async (event: Event) => {
        try {
            const target = event.target as HTMLInputElement;

            if (target && target.files) {
                const file = target.files[0];

                if (file) {
                    target.value = "";                                      // Очищаем значение инпута
                    const data = await uploadImage(file);                   // Даем запрос на уменьшение аватарки

                    if (data && data.url) {
                        setAvatarUrl(data.url);                             // Устанавливаем аватарку с сервера (jpeg, обрезанную)
                        onChange("avatarUrl", data.url);                    // Обновляем поле avatarUrl в объекте пользователя
                    } else {
                        throw new Error("Нет ответа от сервера");
                    }
                }
            }
        } catch (error: any) {
            console.log(error);
            throw new Error(error);
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Grid item xs={8}>
                    <Typography className={styles["main-text"]}>{username}, как на счет такого аватара?</Typography>
                </Grid>

                <Grid item xs={8} className={styles["img-wrapper"]}>
                    {loading
                        ? <Skeleton variant="rectangular" className={styles["avatar-loading"]} />
                        : avatarUrl
                            ? <img alt="User avatar" src={avatarUrl} className={styles["avatar"]} />
                            : <div className={styles["avatar-without-user"]}>{avatarLetters}</div>
                    }
                </Grid>

                <Grid item xs={8}>
                    <label htmlFor="image" className={styles["diff-photo"]}>Выбрать другое фото</label>
                    <input id="image" ref={inputFileRef} type="file" hidden />
                </Grid>
            </Grid>
        </Box>
    );
};