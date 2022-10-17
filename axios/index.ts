import axios from "axios";

const axiosInstanse = axios.create({
    baseURL: process.env.SERVER_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.SERVER_URL ?? false,
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE"
    }
});

export default axiosInstanse;