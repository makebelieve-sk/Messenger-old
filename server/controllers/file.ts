import multer from "multer";
import { v4 as uuid } from "uuid";
import open from "open";
// import sharp from "sharp";
import fs from "fs";
import { Request, Response, Express } from "express";
import { ApiRoutes, HTTPStatuses } from "../../types/enums";
import FilesModel from "../database/models/files";
import { sequelize } from "../database";
import { mustAuthenticated } from "../middlewares";
import UserDetailModel from "../database/models/user_details";

// enum FileExtensions {
//     png = ".png",
//     jpeg = ".jpeg",
//     bmp = ".bmp",
//     psd = ".psd",
//     gif = ".gif"
// };

class FileController {
    // Обработка multipart формата (файлы) пакетом multer
    public uploader = multer({
        storage: multer.diskStorage({
            // Создание и проверка директории
            destination: function (_, file, callback) {
                const folder = `public/${file.fieldname}s/`;

                if (!fs.existsSync(folder)) {
                    fs.mkdirSync(folder);
                }

                callback(null, folder);
            },
            // Создание файла в директории
            filename: function (_, file, callback) {
                callback(null, file.fieldname + "-" + uuid() + "." + file.mimetype.split("/").pop());
            }
        })
    });

    // private replaceFormat(filePath: string) {
    //     const dot = filePath.indexOf(".");
    //     const extension = filePath.slice(dot);
    //     const RESIZED_EXT = "-resized";

    //     switch (extension) {
    //         case FileExtensions.png:
    //             return filePath.replace(FileExtensions.png, RESIZED_EXT + FileExtensions.jpeg);
    //         case FileExtensions.bmp:
    //             return filePath.replace(FileExtensions.bmp, RESIZED_EXT + FileExtensions.jpeg);
    //         case FileExtensions.psd:
    //             return filePath.replace(FileExtensions.psd, RESIZED_EXT + FileExtensions.jpeg);
    //         case FileExtensions.gif:
    //             return filePath.replace(FileExtensions.gif, RESIZED_EXT + FileExtensions.gif);
    //         default:
    //             return filePath.replace(extension, RESIZED_EXT + FileExtensions.jpeg);
    //     }
    // };

    // Загрузка аватара (req.file)
    async uploadImage(req: Request, res: Response) {
        try {
            if (req.file) {
                const file = req.file;
                // const filePath = file.path;
                // const extension = file.mimetype.split("/").pop();

                return res.json({ success: true, url: `/${file.fieldname}s/${file.filename}` });

                // const outputFile = new FileController().replaceFormat(filePath);
                // const sharpConfig = extension === FileExtensions.gif ? { animated: true } : {};

                // sharp(filePath, sharpConfig)
                //     .resize(150, 150)
                //     .toFormat("jpeg")
                //     .toFile(outputFile)
                //     .then(() => {
                //         fs.unlinkSync(filePath);    // Удаляем файл оригинал

                //         const resultFile = new FileController().replaceFormat(file.filename);

                //         return res.json({ success: true, url: `/${file.fieldname}s/original/${resultFile}` });
                //     })
                //     .catch((error: Error) => {
                //         const errorText = `Произошла ошибка при сжатии изображения: ${error}`;
                //         console.log(errorText);
                //         return res.status(500).json({ message: errorText });
                //     });
            } else {
                throw new Error("В req.file не передан файл");
            }
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Сохраняем файлы (req.files) в таблице Files
    async saveFiles(req: Request, res: Response) {
        const transaction = await sequelize.transaction();

        try {
            if (req.files) {
                const files = req.files as Express.Multer.File[];

                if (files && files.length) {
                    const prepFiles = files.map(file => ({
                        id: uuid(),
                        name: Buffer.from(file.originalname, "latin1").toString("utf8"),
                        path: file.path,
                        size: file.size
                    }));

                    // Сохраняем файл в таблицу Files
                    await FilesModel.bulkCreate(prepFiles, { transaction });

                    await transaction.commit();

                    return res.json({ success: true, files: prepFiles });
                }
            } else {
                throw "Не переданы файлы";
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Сохраняем файлы (req.files) в таблице UserDetails в поле photos
    async addNewPhotos(req: Request, res: Response) {
        const transaction = await sequelize.transaction();

        try {
            if (req.files) {
                const files = req.files as Express.Multer.File[];
                const { userId } = req.body;

                if (files && files.length) {
                    const prepFiles = files.map(file => file.path.slice(6)).join(",");

                    const userDetails = await UserDetailModel.findOne({
                        where: { userId },
                        transaction
                    });

                    if (userDetails) {
                        userDetails.photos = userDetails.photos ? userDetails.photos + "," + prepFiles : prepFiles;
                        userDetails.save();
                    }

                    await transaction.commit();

                    return res.json({ success: true, photos: prepFiles });
                }
            } else {
                throw "Не переданы файлы";
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Открываем файл при клике на него
    async openFile(req: Request, res: Response) {
        try {
            const { path }: { path: string; } = req.body;

            if (!path) {
                throw "Не передан путь для открытия файла";
            }

            await open(path);

            return res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };

    // Скачивание файла
    async downloadFile(req: Request, res: Response) {
        try {
            const { name, path } = req.query as unknown as { name: string; path: string; };

            if (!path) {
                throw "Не передан путь для скачивания файла";
            }

            if (fs.existsSync(path)) {
                return res.download(path, name);
            } else {
                return res.status(HTTPStatuses.NotFound).send({ success: false, message: "Файл не найден" });
            }
        } catch (error: any) {
            console.log(error);
            return res.status(HTTPStatuses.ServerError).send({ success: false, message: error.message ?? error });
        }
    };
};

const fileController = new FileController();

export default function FileRouter(app: Express) {
    app.post(ApiRoutes.uploadImage, fileController.uploader.single("avatar"), fileController.uploadImage);
    app.post(ApiRoutes.uploadImageAuth, mustAuthenticated, fileController.uploader.single("avatar"), fileController.uploadImage);
    app.post(ApiRoutes.saveFiles, mustAuthenticated, fileController.uploader.array("file"), fileController.saveFiles);
    app.post(ApiRoutes.addNewPhotos, mustAuthenticated, fileController.uploader.array("photo"), fileController.addNewPhotos);
    app.post(ApiRoutes.openFile, mustAuthenticated, fileController.openFile);
    app.get(ApiRoutes.downloadFile, mustAuthenticated, fileController.downloadFile);
};