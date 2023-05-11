import React from "react";
import TextField from "@mui/material/TextField";
import { ITabModule } from ".";

export default React.memo(function Contacts({ formValues, formErrors, onChange }: ITabModule) {
    const onChangeField = (field: string, value: string | boolean | Date | null) => onChange(field, value);

    return <>
        <TextField
            id="city"
            name="city"
            margin="normal"
            variant="outlined"
            label="Город"
            autoComplete="Город"
            fullWidth
            value={formValues.city}
            autoFocus

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
            required

            error={Boolean(formErrors && formErrors.phone)}
            helperText={formErrors && formErrors.phone ? formErrors && formErrors.phone : null}

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
            required

            error={Boolean(formErrors && formErrors.email)}
            helperText={formErrors && formErrors.email ? formErrors && formErrors.email : null}

            onChange={e => onChangeField("email", e.target.value)}
        />
    </>
});