import { createClient } from "redis";

export type RedisClient = ReturnType<typeof createClient>;

export default class RedisWorks {
    static client: RedisClient;

    // Получение экземпляра клиента Redis-сервера
    static getRedisInstance() {
        this.client = createClient({ legacyMode: true });
        (async () => this.client && await this.client.connect())();

        this.client.on("error", (error: string) => {
            const errorText = "Ошибка в работе клиента Redis: " + error;
            console.log(errorText);
            throw errorText;
        });

        return this.client;
    };

    // Получение значения по ключу
    static async get(key: string): Promise<string | undefined> {
        try {
            return new Promise(resolve => {
                (this.client as any).get(key, function(error: string | undefined, value: string | undefined) {
                    if (error) {
                        throw error;
                    }

                    resolve(value);
                });
            });
        } catch (error) {
            const errorText = "Произошла ошибка при получении значения по ключу из Redis: " + error;
            console.log(errorText);
            throw errorText;
        }
    };

    // Запись значения по ключу
    static async set(key: string, value: string) {
        try {
            if (this.client) {
                await this.client.set(key, value);
            } else {
                throw "Клиента Redis-сервера не существует";
            }
        } catch (error) {
            const errorText = "Произошла ошибка при получении значения по ключу из Redis: " + error;
            console.log(errorText);
            throw errorText;
        }
    };

    // Удаление значения по ключу
    static async delete(key: string) {
        try {
            if (this.client) {
                await this.client.del(key);
            } else {
                throw "Клиента Redis-сервера не существует";
            }
        } catch (error) {
            const errorText = "Произошла ошибка при получении значения по ключу из Redis: " + error;
            console.log(errorText);
            throw errorText;
        }
    };
};