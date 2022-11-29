import axiosInstanse from "../axios";
import { ApiRoutes } from "../config/enums";

// Класс, отвечающий за запросы к серверу
class Request {
    // GET запрос на сервер
    async get(
        route: ApiRoutes, 
        setLoading: ((value: any) => any) | undefined, 
        successCb: (result: any) => any, 
        failedCb: (error: string) => any
    ) {
        setLoading ? setLoading(true) : undefined;

        axiosInstanse
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

        axiosInstanse
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

export default new Request();