import crypto from "crypto";
import passport from "passport";
import { IVerifyOptions, Strategy } from "passport-local";
import UserModel, { UserInstance } from "./database/models/users";

type DoneType = (error: any, user?: any, options?: IVerifyOptions | undefined) => void;

const errorSign = "Не верно указан логин или пароль";

function comparePasswords(candidate: UserInstance, password: string, done: DoneType) {
    crypto.pbkdf2(password, candidate.salt, 4096, 256, "sha256", function (error, hash) {
        if (error) {
            throw error;
        }

        // Генерируем хеш пароля, приправленным "солью"
        const hashString = hash.toString("hex");
        const user = candidate.getUserData();

        hashString === candidate.password
            ? done(null, user)
            : done(null, false, { message: errorSign });
    });
};

async function verify(login: string, password: string, done: DoneType): Promise<void> {
    try {
        const candidateEmail = await UserModel.findOne({ where: { email: login } });

        if (candidateEmail) {
            return comparePasswords(candidateEmail, password, done);
        } else {
            let phone = login.replace(/[^0-9]/g, "");

            phone = phone[0] === "8" ? "+7" + phone.slice(1) : "+" + phone;

            const candidatePhone = await UserModel.findOne({ where: { phone } });

            if (candidatePhone) {
                return comparePasswords(candidatePhone, password, done);
            } else {
                return done(null, false, { message: errorSign });
            }
        }
    } catch (error: any) {
        console.log(error);
        done(null, false, { message: error.message ?? error });
    }
};

export default function() {
    passport.use(new Strategy({ usernameField: "login", passwordField: "password" }, verify));

    // Достаем данные о пользователе из его сессии
    passport.serializeUser(function (user: any, done) {
        console.log('serializeUser: ', user);

        process.nextTick(() => {
            done(null, user.id);
        });
    });

    // Сохраняем данные о пользователе в его сессию
    passport.deserializeUser(function (userId: number, done) {
        console.log('deserializeUser: ', userId);

        process.nextTick(() => {
            UserModel
                .findByPk(userId)
                .then(currectUser => {
                    if (currectUser) {
                        const user = currectUser.getUserData();
                        return done(null, user);
                    } else {
                        return new Error(`Пользователь с id=${userId} не найден`);
                    }
                })
                .catch((error: any) => {
                    console.log(error);
                    done(error.message ?? error);
                });
        });
    });
};