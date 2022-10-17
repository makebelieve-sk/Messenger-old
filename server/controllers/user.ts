import { Request, Response, Express } from "express";
import { IContactsValues } from "../../components/edit-tabs-module/contacts";
import { IMainValues } from "../../components/edit-tabs-module/main";
import { ApiRoutes, HTTPStatuses } from "../../config/enums";
import { sequelize } from "../database";
import UserModel, { UserInstance } from "../database/models/users";
import UserDetailModel, { UserDetailsInstance } from "../database/models/user_details";
import { mustAuthenticated } from "../middlewares";

class UserController {
    // Изменение основной информации о пользователе
    async editMainInfo(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        
        try {
            const { name, surName, sex, birthday, work, userId }: IMainValues & { userId: string } = req.body;

            const findUser = await UserModel.findByPk(userId);
            let user: any = null;

            if (findUser) {
                await UserModel.update(
                    { firstName: name, thirdName: surName },
                    { where: { id: userId }, transaction }
                );

                user = await UserModel.findByPk(findUser.id, { transaction });

                if (user) {
                    user = user.getUserData();
                } else {
                    await transaction.rollback();
                    return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись пользователя в таблице Users не найдена" });
                }
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись пользователя в таблице Users не найдена" });
            }

            const findUserDetail = await UserDetailModel.findOne({ where: { userId } });
            let userDetail: UserDetailsInstance | null = null;

            if (findUserDetail) {
                await UserDetailModel.update(
                    { sex, birthday, work }, 
                    { where: { userId }, transaction }
                );

                userDetail = await UserDetailModel.findByPk(findUserDetail.id, { transaction });
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись информации о пользователе в таблице UserDetails не найдена" });
            }

            await transaction.commit();

            return res.json({ success: true, user, userDetail });
        } catch (error: any) {
            await transaction.rollback();
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Изменение контактов о пользователе
    async editContactsInfo(req: Request, res: Response) {
        const transaction = await sequelize.transaction();
        
        try {
            const { city, phone, email, userId }: IContactsValues & { userId: string } = req.body;

            const findUser = await UserModel.findByPk(userId);
            let user: any = null;

            if (findUser) {
                await UserModel.update(
                    { phone, email },
                    { where: { id: userId }, transaction }
                );

                user = await UserModel.findByPk(findUser.id, { transaction });

                if (user) {
                    user = user.getUserData();
                } else {
                    await transaction.rollback();
                    return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись пользователя в таблице Users не найдена" });
                }
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись пользователя в таблице Users не найдена" });
            }

            const findUserDetail = await UserDetailModel.findOne({ where: { userId } });
            let userDetail: UserDetailsInstance | null = null;

            if (findUserDetail) {
                await UserDetailModel.update(
                    { city }, 
                    { where: { userId }, transaction }
                );

                userDetail = await UserDetailModel.findByPk(findUserDetail.id, { transaction });
            } else {
                await transaction.rollback();
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Запись информации о пользователе в таблице UserDetails не найдена" });
            }

            await transaction.commit();

            return res.json({ success: true, user, userDetail });
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
    app.post(ApiRoutes.editMain, mustAuthenticated, userController.editMainInfo);
    app.post(ApiRoutes.editContacts, mustAuthenticated, userController.editContactsInfo);
    app.post(ApiRoutes.getUserDetail, mustAuthenticated, userController.getUserDetail);
};