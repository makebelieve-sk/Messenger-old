import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Box, IconButton, Avatar, createTheme, ThemeProvider, FormControl, Input, InputAdornment, AppBar, Container, MenuItem, Toolbar, Typography, Menu } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AdbIcon from "@mui/icons-material/Adb";
import { ApiRoutes, Pages } from "../../config/enums";
import CatchErrors from "../../axios/catch-errors";
import { selectUserState, setUser } from "../../state/user/slice";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import Request from "../../common/request";

import styles from "./header.module.scss";

const theme = createTheme({
    palette: {
        success: {
            main: "#f1f1f1",
            contrastText: "#fff",
        },
    },
});

export default function Header() {
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const { user } = useAppSelector(selectUserState);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Переход на страницу
    const goTo = (link: Pages) => {
        setAnchorElUser(null);
        router.push(link);
    };

    // Выход
    const logout = () => {
        setAnchorElUser(null);

        Request.get(ApiRoutes.logout, undefined, () => {
            router.push(ApiRoutes.signIn);
            dispatch(setUser(null));
        }, (error: any) => {
            /**
             * Обработка ошибок:
             * 401: при неудачном выходе {{ message: string; }}
             * 500: при ошибке сервера {null}
             */
            const errorMessage = CatchErrors.catch(error, router, dispatch);
            console.log("Ошибка в компоненте Header: ", errorMessage);
        });
    };

    return <ThemeProvider theme={theme}>
        <AppBar position="static">
            <Container className={styles["header-container"]}>
                <Toolbar disableGutters className={styles["header-container--toolbar"]}>
                    <div className={styles["header-container_block"]}>
                        <AdbIcon className={styles["header-container--logo"]} onClick={() => goTo(Pages.profile)} />
                        <Typography variant="h6" noWrap onClick={() => goTo(Pages.profile)} className={styles["header-container--title"]}>
                            ВК-КЛОН
                        </Typography>

                        <FormControl size="small" focused color="success" variant="standard" className={styles["header-container--search-input"]}>
                            <Input
                                placeholder="Поиск"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <SearchIcon className={styles["header-container_search-input--logo"]} color="success" />
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </div>

                    <Box sx={{ flexGrow: 0 }}>
                        <IconButton onClick={event => setAnchorElUser(event.currentTarget)} sx={{ p: 0 }}>
                            {
                                user
                                    ? user.avatarUrl 
                                        ? <Avatar>
                                            <Image alt="User-avatar" src={user.avatarUrl} layout="fill" priority={true} />
                                        </Avatar>
                                        : user.firstName && user.thirdName 
                                            ? <Avatar>{user.firstName[0] + user.thirdName[0]}</Avatar>
                                            : <Avatar>-</Avatar>
                                    : <Avatar>-</Avatar>
                            }
                        </IconButton>

                        <Menu
                            sx={{ mt: "48px" }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={_ => setAnchorElUser(null)}
                        >
                            <MenuItem onClick={() => goTo(Pages.settings)}>
                                <Typography textAlign="center">Настройки</Typography>
                            </MenuItem>

                            <MenuItem onClick={() => goTo(Pages.help)}>
                                <Typography textAlign="center">Помощь</Typography>
                            </MenuItem>

                            <MenuItem onClick={logout}>
                                <Typography textAlign="center">Выйти</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    </ThemeProvider>
};