import axios, { AxiosInstance } from "axios";
import { ApiRoutes } from "../types/enums";

// Класс, отвечающий за запросы к серверу
class Request {
    private instance: AxiosInstance;

    constructor() {
        this.instance = axios.create({
            baseURL: process.env.SERVER_URL,
            withCredentials: true,
            timeout: 15000,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": process.env.SERVER_URL ?? false,
                "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
            }
        });
    };

    // GET запрос на сервер
    async get(
        route: ApiRoutes | string,
        setLoading: ((value: any) => any) | undefined,
        successCb: ((result: any) => any) | undefined,
        failedCb: (error: string) => any,
    ) {
        setLoading ? setLoading(true) : undefined;

        this.instance
            .get(route)
            .then(response => {
                const data = response.data;

                if (data.success) {
                    successCb ? successCb(data) : undefined;
                }
            })
            .catch(failedCb)
            .finally(() => {
                setLoading ? setLoading(false) : undefined;
            });
    };

    // POST запрос на сервер
    async post(
        route: ApiRoutes,
        data: any,
        setLoading: ((value: React.SetStateAction<boolean>) => void) | undefined,
        successCb: ((result: any) => any) | undefined,
        failedCb: (error: string) => any,
        config: { headers?: { [key: string]: string; }; } = {}
    ) {
        setLoading ? setLoading(true) : undefined;

        this.instance
            .post(route, data, config)
            .then(response => {
                const data = response.data;

                if (data.success) {
                    successCb ? successCb(data) : undefined;
                }
            })
            .catch(failedCb)
            .finally(() => {
                setLoading ? setLoading(false) : undefined;
            });
    };

    // GET запрос на скачивание файла с сервера
    async downloadFile(
        window: Window & typeof globalThis,
        document: Document,
        params: string,
        extra: { name: string; },
        failedCb: (error: string) => any,
    ) {
        this.instance
            .get(`${ApiRoutes.downloadFile}?${params}`, { responseType: "blob" })
            .then(response => {
                const blob = response.data;
                const downloadUrl = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = extra.name;

                document.body.appendChild(link);

                link.click();
                link.remove();
            })
            .catch(failedCb);
    }
};

// Pattern: Singleton
export default new Request();