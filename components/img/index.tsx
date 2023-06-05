import React from "react";
import { useRouter } from "next/router";
import { useAppDispatch } from "../../hooks/useGlobalState";
import { setModalConfirm } from "../../state/main/slice";
import Request from "../../core/request";
import CatchErrors from "../../core/catch-errors";

import styles from "./img.module.scss";
import { ApiRoutes } from "../../types/enums";
import { changeUserField } from "../../state/user/slice";

interface IImgComponent {
    src: string;
    alt: string;
    wrapperClassName?: string;
    closeIcon?: boolean
    clickHandler?: () => void;
};

export default React.memo(function ImgComponent({ src, alt, wrapperClassName, closeIcon, clickHandler }: IImgComponent) {
    const [visibleCloseIcon, setVisibleCloseIcon] = React.useState(false);
    const router = useRouter();

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
    const onDelete = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (closeIcon && visibleCloseIcon) {
            dispatch(setModalConfirm({
                text: "Вы действительно хотите удалить эту фотографию?",
                btnActionTitle: "Удалить",
                cb: async () => {
                    await Request.post(
                        ApiRoutes.addNewPhotos,
                        { path: src, isAvatar: true },
                        undefined,
                        (data: { success: boolean; }) => {
                            if (data.success) {
                                dispatch(changeUserField({ field: "avatarUrl", value: "" }));
                            }
                        },
                        (error: any) => CatchErrors.catch(error, router, dispatch),
                        { headers: { "Content-Type": "multipart/form-data" } }
                    );
                }
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
            ? <span className={styles["img-component__wrapper__close-icon"]} onClick={onDelete}>X</span>
            : null}
        <img src={src} alt={alt} />
    </div>
});