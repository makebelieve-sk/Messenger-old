import React from "react";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useAppDispatch, useAppSelector } from "../../../hooks/useGlobalState";
import { setImagesInCarousel } from "../../../state/main/slice";
import { changeUserDetailField, selectUserState, setPhotosCount } from "../../../state/user/slice";
import Request from "../../../core/request";
import CatchErrors from "../../../core/catch-errors";
import { IImage } from "../../messages-module/image-message";
import { ApiRoutes, Pages } from "../../../types/enums";
import { getPhotosInstance } from "../../../common";

import styles from "./photos.module.scss";

export default React.memo(function Photos() {
    const [photos, setPhotos] = React.useState<IImage[]>([]);
    const [loading, setLoading] = React.useState(false);

    const { user, userDetail } = useAppSelector(selectUserState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const inputFileRef = React.useRef<HTMLInputElement>(null)

    // Изначально устанавливаем свои фотографии
    React.useEffect(() => {
        const userPhotos: IImage[] = [];

        if (user && user.avatarUrl) {
            userPhotos.push({
                id: uuid(),
                alt: user.firstName + " " + user.thirdName,
                src: user.avatarUrl
            });
        }

        if (userDetail && userDetail.photos) {
            const userDetailPhotosSplit = userDetail.photos.split(",");
            const userDetailPhotos = getPhotosInstance(userDetailPhotosSplit, user);

            if (userDetailPhotos && userDetailPhotos.length) {
                userDetailPhotos.forEach(userDetailPhoto => {
                    userPhotos.push(userDetailPhoto);
                });
            }
        }

        setPhotos(userPhotos);
        // Обновляем глобальный счетчик количества моих фотографий
        dispatch(setPhotosCount(userPhotos.length));
    }, [user, userDetail]);

    // Клик по одной из своих фотографий
    const onClickMainPhoto = (index: number) => {
        if (user && photos && photos.length) {
            dispatch(setImagesInCarousel({
                images: photos,
                index
            }));
        }
    };

    // Добавление новых фотографий
    const addNewPhotos = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;

        if (fileList && fileList.length && user) {
            const formData = new FormData();
            const files = Array.from(fileList);

            files.forEach(file => {
                formData.append("photo", file);
            });

            formData.append("userId", user.id);

            await Request.post(
                ApiRoutes.addNewPhotos,
                formData,
                setLoading,
                (data: { success: boolean; photos: string; }) => {
                    if (data.success) {
                        dispatch(changeUserDetailField({ field: "photos", value: data.photos }));
                    }
                },
                (error: any) => CatchErrors.catch(error, router, dispatch),
                { headers: { "Content-Type": "multipart/form-data" } }
            );
        }
    }, []);

    if (!user) {
        return null;
    }

    return <Grid item>
        <Paper className="photo-container paper-block">
            <div className="block-title jc-sb ai-c">
                <div className={styles["photo-container__title"]}>
                    Мои фотографии <span className="counter">{photos.length}</span>
                </div>

                <Link href={Pages.photos} variant="body2" onClick={() => router.push(Pages.photos)} underline="hover" className={styles["photo-container__link"]}>
                    Посмотреть все
                </Link>
            </div>

            {loading
                ? <div className={styles["photo-container__loading"]}><CircularProgress /></div>
                : photos && photos.length
                    ? <div className={styles["photo-container__photos"]}>
                        {photos.slice(0, 3).map((photo, index) => {
                            return <div key={photo.id} className={styles["photo-container__photos__photo"]} onClick={() => onClickMainPhoto(index)}>
                                <img src={photo.src} alt={photo.alt} />
                            </div>
                        })}
                    </div>
                    : <div className="opacity-text">
                        Нет фотографий
                    </div>
            }

            <Button variant="outlined" size="small" className={styles["photo-container__button-container"]}>
                <label htmlFor="add-new-photos" className={styles["photo-container__add-new-photos"]}>
                    <Typography variant="caption">Добавить еще</Typography>
                    <input id="add-new-photos" ref={inputFileRef} type="file" accept="image/*" hidden onChange={addNewPhotos} multiple />
                </label>
            </Button>
        </Paper>
    </Grid>
});