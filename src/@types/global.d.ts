export declare global {
  namespace Express {
    interface Request {
      context: Context;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      APP_PORT: number;
      APP_URL: string;
      CLIENT_URL: string;
      MONGODB_URI: string;
      REDIS_URI: string;
      REDIS_TOKEN_EXPIRATION: number;
      JWT_SECRET: string;
      JWT_EXPIRATION: string;
      MAIL_SERVICE: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_TPL_PATH: string;
      STORAGE_PATH: string;
      API_LOG_FILENAME: string;
    }
  }
}
