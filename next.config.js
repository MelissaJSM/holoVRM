require('dotenv').config();

const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.BASE_PATH || "",
  basePath: process.env.BASE_PATH || "",
  trailingSlash: true,
  publicRuntimeConfig: {
    root: process.env.BASE_PATH || "",
  },
  env: {
    NEXT_PUBLIC_OPENAI_KEY: process.env.NEXT_PUBLIC_OPENAI_KEY,
    NEXT_PUBLIC_ELEVEN_LABS_KEY: process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY,
    NEXT_PUBLIC_AVATAR_BASE_URL: process.env.NEXT_PUBLIC_AVATAR_BASE_URL,
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  },
};

module.exports = nextConfig;
