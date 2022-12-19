import { Request, Response, NextFunction } from "express";
import { HTTPStatuses } from "../types/enums";

// Пользователь должен быть авторизирован в системе
export function mustAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
        return res.status(HTTPStatuses.Unauthorized).send({ success: false, message: "Вы не авторизованы или время жизни токена сессии подошло к концу" });
    }

    // Обновляем время жизни токена сессии
    req.session.cookie.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    next();
};