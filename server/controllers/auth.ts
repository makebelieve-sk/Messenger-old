import crypto from "crypto";
import { Request, Response, NextFunction, Express } from "express";
import { PassportStatic } from "passport";
import { v4 as uuid } from "uuid";
import { COOKIE_NAME } from "../../config";
import { ApiRoutes, HTTPStatuses } from "../../config/enums";
import UserModel from "../database/models/users";
import UserDetailModel from "../database/models/user_details";
import { mustAuthenticated } from "../middlewares";
import RedisWorks from "../redis";

class AuthController {
    errorSign = "Не верно указан логин или пароль";

    // Проверяем авторизирован ли пользователь в системе
    isAuthenticated(req: Request, res: Response, next: NextFunction) {
        if (req.isAuthenticated()) {
            // Обновляем время жизни токена сессии
            req.session.cookie.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            return res.status(HTTPStatuses.PermanentRedirect).send({ success: false, message: "Вы уже авторизированы" });
        }

        next();
    };

    // Регистрация пользователя
    async signUp(req: Request, res: Response) {
        try {
            const { firstName, thirdName, email, phone, password, avatarUrl } = req.body;

            // Проверка на существование почты и телефона
            const checkDublicateEmail = await UserModel.findOne({ where: { email } });

            if (checkDublicateEmail) {
                return res.status(HTTPStatuses.BadRequest).send({ success: false, message: `Пользователь с почтовым адресом ${email} уже существует`, field: "email" });
            }

            const checkDublicatePhone = await UserModel.findOne({ where: { phone } });

            if (checkDublicatePhone) {
                return res.status(HTTPStatuses.BadRequest).send({ success: false, message: `Пользователь с номером телефона ${phone} уже существует`, field: "phone" });
            }

            // "Соль"
            const salt = crypto.randomBytes(128);
            const saltString = salt.toString("hex");

            crypto.pbkdf2(password, saltString, 4096, 256, "sha256", function (error, hash) {
                if (error) {
                    throw error;
                }

                // Генерируем хеш пароля, приправленным "солью"
                const hashString = hash.toString("hex");

                UserModel
                    .create({ id: uuid(), firstName, thirdName, email, phone, password: hashString, avatarUrl, salt: saltString })
                    .then(newUser => {
                        if (newUser) {
                            const user = newUser.getUserData();

                            UserDetailModel
                                .create({ userId: user.id })
                                .then(newUserDetail => {
                                    if (newUserDetail) {
                                        req.login(user, function (error: string) {
                                            if (error) {
                                                throw new Error(error);
                                            }

                                            return res.json({ success: true, user });
                                        });
                                    } else {
                                        throw new Error("Пользователь не создался в базе данных в таблице UserDetails");
                                    }
                                })
                                .catch((error: Error) => {
                                    throw new Error(`Ошибка при создании записи в таблице UserDetails: ${error}`);
                                });
                        } else {
                            throw new Error("Пользователь не создался в базе данных в таблице Users");
                        }
                    })
                    .catch((error: Error) => {
                        throw new Error(`Создание новой записи в базе данных завершилось не удачно: ${error}`);
                    });
            });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Вход пользователя
    async signIn(req: Request, res: Response, next: NextFunction, passport: PassportStatic) {
        try {
            passport.authenticate("local", { session: true }, async (error, user, info: { message: string }) => {
                if (error) {
                    throw new Error(error);
                }

                if (!user) {
                    return res.status(HTTPStatuses.BadRequest).send({ success: false, message: info.message });
                }

                if (!req.sessionID) {
                    throw new Error("уникальный идентификатор сессии не существует");
                }

                return req.logIn(user, async (error: string) => {
                    if (error) {
                        throw new Error(error);
                    }

                    // Срок куки = 30 дней или до выхода (Обработка "Запомнить меня")
                    if (req.body.rememberMe) {
                        req.session.cookie.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    } else {
                        req.session.cookie.expires = undefined;
                    }

                    return res.json({ success: true, user: req.user });
                });
            })(req, res, next);
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Выход пользователя
    async logout(req: Request, res: Response) {
        try {
            // Выход из passport.js
            req.logout((error) => {
                if (error) {
                    throw new Error(`удаление пользователя из запроса завершилось неудачно: ${error}`);
                }

                // Удаляем текущую сессию пользователя
                req.session.destroy(async (error: string) => {
                    if (error) {
                        throw new Error(`удаление сессии пользователя завершилось не удачно: ${error}`);
                    }

                    if (!req.sessionID) {
                        throw new Error(`отсутствует id сессии пользователя (session=${req.session})`);
                    }

                    // Удаляем сессию в редисе
                    await RedisWorks.delete(`sess:${req.sessionID}`);

                    // Удаляем session-cookie (sid)
                    return res.clearCookie(COOKIE_NAME).json({ success: true });
                });
            });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };
};

const authController = new AuthController();

export default function AuthRouter(app: Express, passport: PassportStatic) {
    app.post(ApiRoutes.signUp, authController.isAuthenticated, authController.signUp);
    app.post(ApiRoutes.signIn, authController.isAuthenticated, (req, res, next) => authController.signIn(req, res, next, passport));
    app.get(ApiRoutes.logout, mustAuthenticated, authController.logout);
    app.get(ApiRoutes.getUser, mustAuthenticated, (req, res) => {console.log(req.user); res.json({ success: true, user: req.user })});
};