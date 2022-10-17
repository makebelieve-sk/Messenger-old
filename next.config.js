/** @type {import("next").NextConfig} */

const nextConfig = {
    reactStrictMode: false,
    env: {
        SERVER_URL: "http://localhost:8008",
        COOKIE_NAME: "sid",
        SOCKET_IO_CLIENT: "http://localhost:8008",
    }
};

module.exports = nextConfig;