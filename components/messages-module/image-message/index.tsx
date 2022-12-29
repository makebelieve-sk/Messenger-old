import React from "react";
import { ImageList, ImageListItem } from "@mui/material";
import { useAppDispatch } from "../../../hooks/useGlobalState";
import { setImagesInCarousel } from "../../../state/main/slice";

import styles from "./image-component.module.scss";

export interface IImage {
    id: string;
    src: string;
    alt: string;
    cols?: number;
    rows?: number;
};

interface IImageComponent {
    images: IImage[];
    showBottomRadius?: boolean;
};

export const ImageMessage = React.memo(({ images, showBottomRadius = false }: IImageComponent) => {
    images = images.map(image => ({ ...image, src: "http://localhost:3000/" + image.src.slice(7) }));

    const dispatch = useAppDispatch();
    
    // Клик по изображению
    const onSelect = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
        event.stopPropagation();

        dispatch(setImagesInCarousel({ images, index }));
    };

    return <ImageList
        sx={{ width: 450, height: 400 }}
        variant="quilted"
        cols={images.length > 1 ? 2 : 1}
        rowHeight={images.length === 4 ? 130.5 : images.length === 3 ? 197.5 : 400}
        className={`${styles["image-list"]} ${showBottomRadius ? styles["bottom-radius"] : ""}`}
    >
        {images.map((image, index) => (  
            <ImageListItem key={image.id} cols={image.cols || 1} rows={image.rows || 1} onClick={e => onSelect(e, index)}>
                <img src={image.src} alt={image.alt} />
            </ImageListItem>
        ))}
    </ImageList>
});