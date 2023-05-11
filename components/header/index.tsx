import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { ApiRoutes, Pages } from "../../types/enums";
import CatchErrors from "../../core/catch-errors";
import { selectUserState, setUser } from "../../state/user/slice";
import { useAppDispatch, useAppSelector } from "../../hooks/useGlobalState";
import Request from "../../core/request";

import styles from "./header.module.scss";
import Logo from "../../public/img/logo";

export default React.memo(function Header() {
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
        }, (error: any) => CatchErrors.catch("Ошибка в компоненте Header при выходе пользователя: " + error, router, dispatch));
    };

    return <header className={styles["header"]}>
        <div className={styles["header-container"]}>
            <div className={styles["header-container__toolbar"]}>
                <div className={styles["header-container__logo"]} onClick={() => goTo(Pages.profile)}>
                    <Logo />
                </div>

                <div className={styles["header-container__avatar"]}>
                    <div onClick={event => setAnchorElUser(event.currentTarget)}>
                        {user
                            ? user.avatarUrl
                                ? <Avatar>
                                    <Image alt="User-avatar" src={user.avatarUrl} layout="fill" priority={true} />
                                </Avatar>
                                : user.firstName && user.thirdName
                                    ? <Avatar>{user.firstName[0] + user.thirdName[0]}</Avatar>
                                    : <Avatar>-</Avatar>
                            : <Avatar>-</Avatar>
                        }
                    </div>

                    <Menu
                        className={styles["header-container__menu"]}
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
                </div>
            </div>
        </div>
    </header>
});