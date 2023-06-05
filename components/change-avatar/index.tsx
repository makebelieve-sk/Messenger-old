import React from "react";
import { useRouter } from "next/router";
import CatchErrors from "../../core/catch-errors";
import Request from "../../core/request";
import { useAppDispatch } from "../../hooks/useGlobalState";
import { ApiRoutes } from "../../types/enums";

interface ChangeAvatar {
    labelClassname: string;
    labelText: string;
    mustAuth?: boolean;
    onChange: (field: string, value: string) => void;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export default React.memo(function ChangeAvatar({ labelClassname, labelText, mustAuth = false, onChange, setLoading }: ChangeAvatar) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Функция изменения аватарки
    const handleChangeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const target = event.target as HTMLInputElement;

            if (target && target.files) {
                const file = target.files[0];

                if (file) {
                    target.value = "";                         // Очищаем значение инпута
                    await uploadImage(file);                   // Даем запрос на уменьшение аватарки
                }
            }
        } catch (error: any) {
            console.log("Ошибка при изменении аватара: ", error);
            CatchErrors.catch(error, router, dispatch);
        }
    };

    // Сжатие аватарки на сервере
    const uploadImage = async (file: File): Promise<any> => {
        const formData = new FormData();    // Создаем объект FormData
        formData.append("avatar", file);    // Добавляем файл в объект formData (на сервере будет req.file, где мидлвар FileController.uploader.single("avatar"))

        // Получаем ответ от сервера
        return Request.post(
            mustAuth ? ApiRoutes.uploadImageAuth : ApiRoutes.uploadImage,
            formData,
            setLoading,
            (data: { success: boolean; url: string; }) => {
                if (data.success) {
                    // Обновляем поле avatarUrl в объекте пользователя (data.url - обрезанный jpeg)
                    onChange("avatarUrl", data.url);
                }
            },
            (error: any) => CatchErrors.catch(error, router, dispatch),
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    };

    return <label htmlFor={`change-avatar-${labelText}`} className={labelClassname}>
        {labelText}
        <input id={`change-avatar-${labelText}`} type="file" accept="image/*" hidden onChange={handleChangeImage} />
    </label>
});