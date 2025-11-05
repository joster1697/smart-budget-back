// config/config.ts
export interface Config {
    use_env_variable?: string;
    database: string;
    username: string;
    password: string;
    host: string;
    port: number;
    dialect: 'mysql';
  }