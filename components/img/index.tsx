import React from "react";
import { useAppDispatch } from "../../hooks/useGlobalState";
import { setModalConfirm } from "../../state/main/slice";

import styles from "./img.module.scss";

interface IImgComponent {
    src: string;
    alt: string;
    wrapperClassName?: string;
    closeIcon?: boolean
    clickHandler?: () => void;
};

export default React.memo(function ImgComponent({ src, alt, wrapperClassName, closeIcon, clickHandler }: IImgComponent) {
    const [visibleCloseIcon, setVisibleCloseIcon] = React.useState(false);

    const dispatch = useAppDispatch();
    
    // Обработка наведения на изображение
    const onMouseOver = () => {
        if (closeIcon) {
            setVisibleCloseIcon(true);
        }
    };

    // Обработка ухода курсора с изображения
    const onMouseOut = () => {
        if (closeIcon) {
            setVisibleCloseIcon(false);
        }
    };

    // Удаление изображения
    const onClose = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (closeIcon && visibleCloseIcon) {
            dispatch(setModalConfirm({
                text: "Вы действительно хотите удалить эту фотографию?",
                btnActionTitle: "Удалить",
                cb: () => console.log("Удаление")
            }));

            // Останавливаем всплытие события
            event.stopPropagation();
        }
    };


    return <div 
        className={`${styles["img-component__wrapper"]} ${wrapperClassName}`} 
        onClick={clickHandler} 
        onMouseEnter={onMouseOver} 
        onMouseLeave={onMouseOut}
    >
        {visibleCloseIcon 
            ? <span className={styles["img-component__wrapper__close-icon"]} onClick={onClose}>X</span>
            : null}
        <img src={src} alt={alt} />
    </div>
});