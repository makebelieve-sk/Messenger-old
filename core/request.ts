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
        route: ApiRoutes, 
        setLoading: ((value: any) => any) | undefined, 
        successCb: (result: any) => any, 
        failedCb: (error: string) => any
    ) {
        setLoading ? setLoading(true) : undefined;

        this.instance
            .get(route)
            .then(response => {
                const data = response.data;

                if (data.success) {
                    successCb(data);
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
        failedCb: (error: string) => any
    ) {
        setLoading ? setLoading(true) : undefined;

        this.instance
            .post(route, data)
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
};

// Pattern: Singleton
export default new Request();