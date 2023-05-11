import React from "react";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectMainState, setImagesInCarousel } from "../../state/main/slice";
import { selectUserState } from "../../state/user/slice";
import { IImage } from "../messages-module/image-message";
import AvatarWithBadge from "../avatarWithBadge";
import { NO_PHOTO, transformDate } from "../../common";

import styles from "./modal-with-images-carousel.module.scss";

export default React.memo(function ModalWithImagesCarousel() {
    const [activeKey, setActiveKey] = React.useState(0);
    const [images, setImages] = React.useState<null | IImage[]>(null);

    const { user } = useAppSelector(selectUserState);
    const { imagesInCarousel } = useAppSelector(selectMainState);
    const dispatch = useAppDispatch();

    const userName = user ? user.firstName + " " + user.thirdName : "";

    // Установка активного ключа карусели
    React.useEffect(() => {
        if (imagesInCarousel) {
            setActiveKey(imagesInCarousel.index);
            setImages(imagesInCarousel.images);
        }
    }, [imagesInCarousel]);

    // Далее
    const handleNext = () => {
        setActiveKey(prevActiveStep => prevActiveStep + 1);
    };

    // Назад
    const handleBack = () => {
        setActiveKey(prevActiveStep => prevActiveStep - 1);
    };

    // Закрытие модального окна
    const onClose = () => {
        setImages(null);
        dispatch(setImagesInCarousel(null));
    };

    return <>
        {images && images.length && images[activeKey].authorName && images[activeKey].dateTime
            ? <div className={styles["modal-carousel-container__user-info"]}>
                <AvatarWithBadge
                    isOnline={false}
                    chatAvatar={images[activeKey].authorAvatarUrl ? images[activeKey].authorAvatarUrl as string : NO_PHOTO}
                    alt={images[activeKey].alt}
                    avatarClassName="modal-carousel-container__user-info_user-avatar"
                />

                <div className={styles["modal-carousel-container__user-info__container"]}>
                    <div className={styles["modal-carousel-container__user-info__user-name"]}>
                        {userName && userName === images[activeKey].authorName ? "Вы" : images[activeKey].authorName}
                    </div>
                    <div className={styles["modal-carousel-container__user-info__date-time"]}>{transformDate(images[activeKey].dateTime as string, true)}</div>
                </div>
            </div>
            : null
        }

        <Dialog open={Boolean(images && images.length)} onClose={onClose} fullWidth={true} maxWidth="lg">
            <div className={styles["modal-carousel-container"]}>
                {images && images.length
                    ? <>
                        <Box
                            component="img"
                            src={images[activeKey].src}
                            alt={images[activeKey].alt}
                            className={styles["modal-carousel-container__current-image"]}
                        />

                        {images.length > 1
                            ? <MobileStepper
                                steps={images.length}
                                position="static"
                                activeStep={activeKey}
                                nextButton={
                                    <Button size="small" onClick={handleNext} disabled={activeKey === images.length - 1}>
                                        Далее
                                        <KeyboardArrowRight />
                                    </Button>
                                }
                                backButton={
                                    <Button size="small" onClick={handleBack} disabled={activeKey === 0}>
                                        <KeyboardArrowLeft />
                                        Назад
                                    </Button>
                                }
                            />
                            : null
                        }
                    </>
                    : null
                }
            </div>
        </Dialog>
    </>;
});