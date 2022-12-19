import React from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import InputMask from "react-input-mask";
import dynamic from "next/dynamic";
import { IFormState } from "../../pages/sign-up";
import { REQUIRED_FIELD } from "../../common";

const NiceInputPassword = dynamic(() => import("react-nice-input-password"), { ssr: false });

interface ISignUpForm {
    formValues: IFormState;
    setFormValues: React.Dispatch<React.SetStateAction<IFormState>>;
    onChange: (field: string, value: string, validateCallback?: (value: string) => string, anotherField?: string, isValidPassword?: boolean) => void;
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function SignUpForm({ visible, setVisible, formValues, setFormValues, onChange }: ISignUpForm) {
    const checkPassword = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues({
            values: {
                ...formValues.values,
                passwordConfirm: e.target.value
            },
            errors: {
                ...formValues.errors,
                passwordConfirm: e.target.value && e.target.value === formValues.values.password
                    ? ""
                    : e.target.value !== formValues.values.password
                        ? "Введенные пароли не совпадают"
                        : REQUIRED_FIELD
            }
        });
    };

    const validateFullName = (value: string) => {
        return value
            ? value.length < 3
                ? "Длина поля должна быть не менее 3 символов"
                : ""
            : REQUIRED_FIELD;
    };

    const validateEmail = (value: string) => {
        return value
            ? value.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
                ? ""
                : "Не верный формат электронной почты (пример: test01@gmail.com)"
            : REQUIRED_FIELD;
    };

    const validatePhone = (value: string) => {
        if (value) {
            const numbersCount = value.match(/\d/g);

            return numbersCount && numbersCount.length && numbersCount.length !== 11
                ? "Длина номера телефона должна быть 11 символов"
                : "";
        }

        return REQUIRED_FIELD;
    };

    const validatePassword = (value: string) => {
        return value
            ? value === formValues.values.passwordConfirm
                ? ""
                : "Введенные пароли не совпадают"
            : REQUIRED_FIELD;
    };

    const onChangePassword = ({ name, value, isValid }: { name: string; value: string; isValid: boolean }) => {
        if (!visible) {
            setVisible(true);
        }

        onChange("password", value, validatePassword, "passwordConfirm", isValid);
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        id="firstName"
                        name="firstName"
                        margin="normal"
                        variant="outlined"
                        label="Имя"
                        autoComplete="Имя"
                        required
                        fullWidth
                        autoFocus

                        error={Boolean(formValues.errors.firstName)}
                        helperText={formValues.errors.firstName ? formValues.errors.firstName : null}
                        value={formValues.values.firstName}

                        onChange={e => onChange("firstName", e.target.value, validateFullName)}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        id="thirdName"
                        name="thirdName"
                        margin="normal"
                        variant="outlined"
                        label="Фамилия"
                        autoComplete="Фамилия"
                        required
                        fullWidth
                        autoFocus

                        error={Boolean(formValues.errors.thirdName)}
                        helperText={formValues.errors.thirdName ? formValues.errors.thirdName : null}
                        value={formValues.values.thirdName}

                        onChange={e => onChange("thirdName", e.target.value, validateFullName)}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        id="email"
                        name="email"
                        margin="normal"
                        type="email"
                        variant="outlined"
                        label="Электронная почта"
                        autoComplete="Электронная почта"
                        required
                        fullWidth
                        autoFocus

                        error={Boolean(formValues.errors.email)}
                        helperText={formValues.errors.email ? formValues.errors.email : null}
                        value={formValues.values.email}

                        onChange={e => onChange("email", e.target.value, validateEmail)}
                    />
                </Grid>

                <Grid item xs={12}>
                    <InputMask
                        mask="(+7) 999 999 99 99"
                        value={formValues.values.phone}
                        disabled={false}

                        onChange={e => onChange("phone", e.target.value, validatePhone)}
                    >
                        {() => <TextField
                            id="phone"
                            name="phone"
                            margin="normal"
                            type="tel"
                            variant="outlined"
                            label="Телефон"
                            autoComplete="Телефон"
                            required
                            fullWidth
                            autoFocus
                            disabled={false}

                            error={Boolean(formValues.errors.phone)}
                            helperText={formValues.errors.phone ? formValues.errors.phone : null}
                        />}
                    </InputMask>
                </Grid>

                <Grid item xs={12}>
                    <NiceInputPassword
                        name="passwordWrap"
                        visible={true}
                        value={formValues.values.password}
                        showSecurityLevelBar={visible}
                        showSecurityLevelDescription={visible}
                        onChange={onChangePassword}
                        InputComponent={TextField}
                        InputComponentProps={{
                            id: "password-in-register-page",
                            name: "password",
                            margin: "normal",
                            type: "password",
                            variant: "outlined",
                            label: "Пароль",
                            autoComplete: "Пароль",
                            required: true,
                            fullWidth: true,
                            error: Boolean(formValues.errors.phone),
                            helperText: formValues.errors.phone ? formValues.errors.phone : null,
                            InputProps: { endAdornment: <LockIcon /> }
                        }}
                        securityLevels={[
                            {
                                descriptionLabel: <Typography>1 цифра</Typography>,
                                validator: /.*[0-9].*/,
                            },
                            {
                                descriptionLabel: <Typography>1 буква в нижнем регистре</Typography>,
                                validator: /.*[a-z].*/,
                            },
                            {
                                descriptionLabel: <Typography>1 буква в верхнем регистре</Typography>,
                                validator: /.*[A-Z].*/,
                            },
                            {
                                descriptionLabel: <Typography>Пароль должен быть не менее 6 символов</Typography>,
                                validator: /^.{6,}$/,
                            },
                        ]}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        id="passwordConfirm"
                        name="passwordConfirm"
                        margin="normal"
                        type="password"
                        variant="outlined"
                        label="Повторите пароль"
                        autoComplete="Повторите пароль"
                        required
                        fullWidth
                        autoFocus

                        error={Boolean(formValues.errors.passwordConfirm)}
                        helperText={formValues.errors.passwordConfirm ? formValues.errors.passwordConfirm : null}
                        value={formValues.values.passwordConfirm}

                        onChange={checkPassword}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};