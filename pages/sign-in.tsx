import React from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { LoadingButton } from "@mui/lab";
import { Avatar, Box, Checkbox, createTheme, CssBaseline, FormControlLabel, Grid, Link, Paper, TextField, ThemeProvider, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Copyright from "../components/copyright";
import { useAppDispatch } from "../hooks/useGlobalState";
import { setUser } from "../state/user/slice";
import { ApiRoutes, Pages } from "../types/enums";
import CatchErrors from "../core/catch-errors";
import { IUser } from "../types/models.types";
import { COOKIE_NAME, REQUIRED_FIELD } from "../common";
import Request from "../core/request";

const THEME = createTheme();

const initialValues = {
    values: {
        login: "",
        password: "",
        rememberMe: false
    },
    errors: {
        login: "",
        password: "",
        rememberMe: ""
    }
};

export default function SignIn() {
    const [saveDisabled, setSaveDisabled] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errorFromServer, setErrorFromServer] = React.useState(false);
    const [formValues, setFormValues] = React.useState(initialValues);

    const dispatch = useAppDispatch();
    const router = useRouter();

    React.useEffect(() => {
        setSaveDisabled(loading || !formValues.values.login || !formValues.values.password || Object.values(formValues.errors).some(Boolean));
    }, [loading, formValues]);

    const onChange = (field: string, value: string | boolean) => {
        setFormValues({
            values: { ...formValues.values, [field]: value },
            errors: errorFromServer ? { ...initialValues.errors } : { ...formValues.errors, [field]: value ? "" : REQUIRED_FIELD }
        });
        setErrorFromServer(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        try {
            event.preventDefault();

            if (!saveDisabled) {
                Request.post(ApiRoutes.signIn, formValues.values, setLoading, 
                    (data: { success: boolean, user: IUser }) => {
                        dispatch(setUser(data.user));
                        router.push(Pages.profile);
                    }, 
                    (error: any) => {
                        /**
                         * Обработка ошибок:
                         * 400: при неудачном входе {{ message: string; }}
                         * 500: при ошибке сервера {null}
                         */
                        const errorMessage = CatchErrors.catch(error, router, dispatch);

                        if (errorMessage && typeof errorMessage === "object" && errorMessage.message) {
                            setErrorFromServer(true);
                            setFormValues({
                                ...formValues,
                                errors: { ...formValues.errors, login: errorMessage.message, password: errorMessage.message }
                            });
                        }
                    }
                );
            }
        } catch (error) {
            setLoading(false);
            console.log("Произошла ошибка при входе: ", error);
            router.push(Pages.error);
        }
    };

    return (
        <ThemeProvider theme={THEME}>
            <Grid container component="main" sx={{ height: "100vh" }}>
                <CssBaseline />
                <Grid item xs={false} sm={4} md={7} sx={{
                    backgroundImage: "url(https://source.unsplash.com/random)",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: t => t.palette.mode === "light" ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }} />

                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box sx={{ my: 8, mx: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <Typography component="h1" variant="h5">
                            Вход
                        </Typography>

                        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                id="login"
                                name="login"
                                margin="normal"
                                variant="outlined"
                                label="Почта или телефон"
                                autoComplete="Почта или телефон"
                                required
                                fullWidth
                                autoFocus

                                error={Boolean(formValues.errors.login)}
                                helperText={formValues.errors.login ? formValues.errors.login : null}

                                onChange={e => onChange("login", e.target.value)}
                            />

                            <TextField
                                id="password"
                                name="password"
                                type="password"
                                margin="normal"
                                variant="outlined"
                                label="Пароль"
                                autoComplete="Пароль"
                                required
                                fullWidth

                                error={Boolean(formValues.errors.password)}
                                helperText={formValues.errors.password ? formValues.errors.password : null}

                                onChange={e => onChange("password", e.target.value)}
                            />

                            <FormControlLabel label="Запомнить меня" control={<Checkbox value={false} color="primary" />} />

                            <LoadingButton
                                fullWidth
                                type="submit"
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                loading={loading}
                                disabled={saveDisabled}
                            >
                                Войти
                            </LoadingButton>

                            <Grid container>
                                <Grid item xs>
                                    <Link href="/reset-password" variant="body2" onClick={() => router.push("/reset-password")}>
                                        Забыли пароль?
                                    </Link>
                                </Grid>

                                <Grid item>
                                    <Link href="/sign-up" variant="body2" onClick={() => router.push("/sign-up")}>
                                        Нет аккаунта? Зарегистрируйтесь!
                                    </Link>
                                </Grid>
                            </Grid>
                        </Box>

                        <Copyright sx={{ mt: 5 }} />
                    </Box>
                </Grid>
            </Grid>
        </ThemeProvider>
    );
};

export const getServerSideProps: GetServerSideProps = async function(context) {
    const cookie = context.req.cookies[COOKIE_NAME];

    return Boolean(cookie)
        ? { props: {}, redirect: { destination: Pages.profile, permanent: false } }
        : { props: {} };
};