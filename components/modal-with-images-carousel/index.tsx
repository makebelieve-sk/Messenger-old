import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import { selectMainState, setImagesInCarousel } from "../../state/main/slice";
import { IImage } from "../messages-module/image-message";

import styles from "./modal-with-images-carousel.module.scss";

const modalTitle = "modal-carousel-title";
const modalDescription = "modal-carousel-description";

export default function ModalWithImagesCarousel() {
    const [activeKey, setActiveKey] = React.useState(0);
    const [images, setImages] = React.useState<null | IImage[]>(null);

    const { imagesInCarousel } = useAppSelector(selectMainState);
    const dispatch = useAppDispatch();

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

    return <Modal
        open={Boolean(images && images.length)}
        onClose={onClose}
        aria-labelledby={modalTitle}
        aria-describedby={modalDescription}
    >
        <div style={{
            position: "absolute",
            top: "47%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: 480,
            width: "50%",
            height: "80%",
            maxHeight: "calc(100vh - 100px)", 
            backgroundColor: "#babec2",
        }}>
            {images && images.length
                ? <>
                    <Box
                        component="img"
                        src={images[activeKey].src}
                        alt={images[activeKey].alt}
                        className={styles["current-image"]}
                    />

                    <MobileStepper
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
                </>
                : null
            }
        </div>
    </Modal>;
};