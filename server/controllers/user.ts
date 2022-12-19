import { Request, Response, Express } from "express";
import { ApiRoutes, HTTPStatuses } from "../../types/enums";
import { IFormValues } from "../../pages/edit";
import { IUser, IUserDetails } from "../../types/models.types";
import { sequelize } from "../database";
import UserModel from "../database/models/users";
import UserDetailModel from "../database/models/user_details";
import { mustAuthenticated } from "../middlewares";

class UserController {
    // Изменение информации о пользователе
    async editInfo(req: Request, res: Response) {
        const transaction = await sequelize.transaction();

        try {
            const { name, surName, sex, birthday, work, userId, city, phone, email }: IFormValues & { userId: string } = req.body;

            const result: { user: Omit<IUser, "password" | "salt"> | null, userDetails: Omit<IUserDetails, "id" | "userId"> | null } = { 
                user: null, 
                userDetails: null 
            };

            const findUser = await UserModel.findByPk(userId);

            if (findUser) {
                result.user = {
                    ...findUser.getUserData(),
                    firstName: name, 
                    thirdName: surName, 
                    email, 
                    phone
                };

                await UserModel.update(result.user, { where: { id: userId }, transaction });
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ 
                    success: false, 
                    message: "Запись пользователя в таблице Users не найдена" 
                });
            }

            const findUserDetail = await UserDetailModel.findOne({ where: { userId } });

            if (findUserDetail) {
                result.userDetails = {
                    sex, 
                    birthday, 
                    work,
                    city
                };

                await UserDetailModel.update(result.userDetails, { where: { userId }, transaction });
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ 
                    success: false, 
                    message: "Запись информации о пользователе в таблице UserDetails не найдена" 
                });
            }

            await transaction.commit();

            return res.json({ success: true, ...result });
        } catch (error: any) {
            await transaction.rollback();
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Получить детальную информацию о пользователе
    async getUserDetail(req: Request, res: Response) {        
        try {
            const { userId }: { userId: string } = req.body;

            const userDetail = await UserDetailModel.findOne({ where: { userId } });

            if (!userDetail) {
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись информации о пользователе в таблице UserDetails не найдена" });
            }

            return res.json({ success: true, userDetail });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };
};

const userController = new UserController();

export default function UserRouter(app: Express) {
    app.post(ApiRoutes.editInfo, mustAuthenticated, userController.editInfo);
    app.post(ApiRoutes.getUserDetail, mustAuthenticated, userController.getUserDetail);
};