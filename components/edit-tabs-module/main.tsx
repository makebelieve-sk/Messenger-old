import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ApiRoutes } from "../../config/enums";
import { useAppSelector } from "../../hooks/useGlobalState";
import { selectUserState } from "../../state/user/slice";

import styles from "./edit-tab.module.scss";

const initialValues = {
    name: "",
    surName: "",
    sex: "",
    birthday: "",
    work: ""
};

export type IMainValues = typeof initialValues;

export interface IMain {
    loading: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>, route: ApiRoutes, formValues: IMainValues) => void;
    onChange: (field: string, value: string | boolean | Date | null, setFormValues: React.Dispatch<React.SetStateAction<IMainValues>>, formValues: IMainValues) => void;
};

export default function Main({ loading, onSubmit, onChange }: IMain) {
    const [formValues, setFormValues] = React.useState(initialValues);
    const { user, userDetail } = useAppSelector(selectUserState);

    // Установка текущих значений в поля формы
    React.useEffect(() => {
        if (user && userDetail) {
            setFormValues({
                name: user.firstName, 
                surName: user.thirdName,
                sex: userDetail.sex ?? "",
                birthday: userDetail.birthday ?? "01.01.2000",
                work: userDetail.work ?? ""
            });
        }
    }, []);

    const onChangeField = (field: string, value: string | boolean | Date | null) => onChange(field, value, setFormValues, formValues);

    return <Box component="form" noValidate onSubmit={(event: React.FormEvent<HTMLFormElement>) => onSubmit(event, ApiRoutes.editMain, formValues)} sx={{ mt: 1 }}>
        <TextField
            id="name"
            name="name"
            margin="normal"
            variant="outlined"
            label="Имя"
            autoComplete="Имя"
            fullWidth
            value={formValues.name}

            onChange={e => onChangeField("name", e.target.value)}
        />

        <TextField
            id="surName"
            name="surName"
            margin="normal"
            variant="outlined"
            label="Фамилия"
            autoComplete="Фамилия"
            fullWidth
            value={formValues.surName}

            onChange={e => onChangeField("surName", e.target.value)}
        />

        <FormControl fullWidth className={styles["edit-container_main--sex-select"]}>
            <InputLabel id="sex-input">Пол</InputLabel>
            <Select
                labelId="sex-input"
                id="sex-select"
                value={formValues.sex}
                label="Пол"
                onChange={e => onChangeField("sex", e.target.value)}
            >
                <MenuItem value="мужской">мужской</MenuItem>
                <MenuItem value="женский">женский</MenuItem>
            </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                disableFuture
                label="День рождения"
                inputFormat="MM.dd.yyyy"
                value={formValues.birthday ? formValues.birthday : "01.01.2000"}
                onChange={(newValue: Date | null) => onChangeField("birthday", newValue)}
                renderInput={(params) => <TextField fullWidth {...params} />}
            />
        </LocalizationProvider>

        <TextField
            id="work"
            name="work"
            margin="normal"
            variant="outlined"
            label="Место работы"
            autoComplete="Место работы"
            fullWidth
            value={formValues.work}
            className={styles["edit-container_main--work"]}

            onChange={e => onChangeField("work", e.target.value)}
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