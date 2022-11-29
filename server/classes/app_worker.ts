import fs from "fs";
import { NextRouter } from "next/router";
import catchErrors from "../../axios/catch-errors";

// TODO
// Перепроверить
class AppWorker {
    filedata: null | any;

    constructor() {
        this.filedata = null;
    }

    readFile(filePath: string, dispatch: any) {
        fs.readFile(filePath, { encoding: "utf-8" }, (error, data) => {
            if (error) {
                const errorText = "Возникла ошибка при чтении файла: " + filePath;
                catchErrors.catch(errorText, {} as NextRouter, dispatch);
            }

            this.filedata = data;
        });

        return this.filedata;
    }
};

export default new AppWorker();