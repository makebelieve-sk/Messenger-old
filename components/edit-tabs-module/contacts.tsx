import React from "react";
import { Box, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { ApiRoutes } from "../../config/enums";
import { useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";

import styles from "./edit-tab.module.scss";

const initialValues = {
    city: "",
    phone: "",
    email: ""
};

export type IContactsValues = typeof initialValues;

export interface IContacts {
    loading: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>, route: ApiRoutes, formValues: IContactsValues) => void;
    onChange: (field: string, value: string | boolean | Date | null, setFormValues: React.Dispatch<React.SetStateAction<IContactsValues>>, formValues: IContactsValues) => void;
};

export default function Contacts({ loading, onSubmit, onChange }: IContacts) {
    const [formValues, setFormValues] = React.useState(initialValues);
    const { user, userDetail } = useAppSelector(selectUserState);

    // Установка текущих значений в поля формы
    React.useEffect(() => {
        if (user && userDetail) {
            setFormValues({
                city: userDetail.city ?? "", 
                phone: user.phone ?? "",
                email: user.email ?? ""
            });
        }
    }, []);

    const onChangeField = (field: string, value: string | boolean | Date | null) => onChange(field, value, setFormValues, formValues);

    return <Box component="form" noValidate onSubmit={(event: React.FormEvent<HTMLFormElement>) => onSubmit(event, ApiRoutes.editContacts, formValues)} sx={{ mt: 1 }}>
        <TextField
            id="city"
            name="city"
            margin="normal"
            variant="outlined"
            label="Город"
            autoComplete="Город"
            fullWidth
            value={formValues.city}

            onChange={e => onChangeField("city", e.target.value)}
        />

        <TextField
            id="phone"
            name="phone"
            margin="normal"
            variant="outlined"
            label="Мобильный телефон"
            autoComplete="Мобильный телефон"
            fullWidth
            value={formValues.phone}

            onChange={e => onChangeField("phone", e.target.value)}
        />

        <TextField
            id="email"
            name="email"
            margin="normal"
            variant="outlined"
            label="Электронная почта"
            autoComplete="Электронная почта"
            fullWidth
            value={formValues.email}
            className={styles["edit-container_main--email"]}

            onChange={e => onChangeField("email", e.target.value)}
        />

        <LoadingButton
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            loading={loading}
        >
            Сохранить
        </LoadingButton>
    </Box>
};