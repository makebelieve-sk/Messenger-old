import multer from "multer";
import { nanoid } from "nanoid";
// import sharp from "sharp";
import fs from "fs";
import { Request, Response, Express } from "express";
import { ApiRoutes, HTTPStatuses } from "../../config/enums";

// enum FileExtensions {
//     png = ".png",
//     jpeg = ".jpeg",
//     bmp = ".bmp",
//     psd = ".psd",
//     gif = ".gif"
// };

class FileController {
    public uploader = multer({
        storage: multer.diskStorage({
            destination: function (_, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) {
                const folder = `public/${file.fieldname}s/`;

                if (!fs.existsSync(folder)) {
                    fs.mkdirSync(folder);
                }
                
                callback(null, folder);
            },
            filename: function (_, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) {
                callback(null, file.fieldname + "-" + nanoid(6) + "." + file.mimetype.split("/").pop());
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
};

const fileController = new FileController();

export default function FileRouter(app: Express) {
    app.post(ApiRoutes.uploadImage, fileController.uploader.single("avatar"), fileController.uploadImage);
};