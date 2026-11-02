import fs from 'node:fs';
import path from 'node:path';

export type KartiniDbEnvironment = 'staging' | 'prod';

export interface KartiniDbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  dbname: string;
  readonly: boolean;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return vars;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      vars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return vars;
}

export function getKartiniDbConfig(env: KartiniDbEnvironment): KartiniDbConfig {
  if (env === 'prod') {
    // 1. Check environment (prefers DB_PROD_*, falls back to KARTINI_DB_PROD_*)
    const host = process.env.DB_PROD_HOST || process.env.KARTINI_DB_PROD_HOST || 'localhost';
    const port = Number(process.env.DB_PROD_PORT || process.env.KARTINI_DB_PROD_PORT || 5432);
    const user = process.env.DB_PROD_USER || process.env.KARTINI_DB_PROD_USER || 'readonly_user';
    const dbname = process.env.DB_PROD_NAME || process.env.KARTINI_DB_PROD_NAME || 'postgres';
    const password = process.env.DB_PROD_PASSWORD || process.env.KARTINI_DB_PROD_PASSWORD;

    return {
      host,
      port,
      user,
      password,
      dbname,
      readonly: true,
    };
  }

  // Staging
  const stagingHost = process.env.DB_STAGING_HOST || process.env.KARTINI_DB_STAGING_HOST;
  const stagingPort = Number(process.env.DB_STAGING_PORT || process.env.KARTINI_DB_STAGING_PORT || 5432);
  const stagingUser = process.env.DB_STAGING_USER || process.env.KARTINI_DB_STAGING_USER;
  const stagingPassword = process.env.DB_STAGING_PASSWORD || process.env.KARTINI_DB_STAGING_PASSWORD;
  const stagingDb = process.env.DB_STAGING_NAME || process.env.KARTINI_DB_STAGING_NAME || 'postgres';

  if (stagingHost && stagingUser) {
    return {
      host: stagingHost,
      port: stagingPort,
      user: stagingUser,
      password: stagingPassword,
      dbname: stagingDb,
      readonly: false,
    };
  }

  // Fallback to local environment file if configured
  const fallbackPath = process.env.CORE_API_ENV_PATH || path.resolve(process.cwd(), '../kar-tini/core-api-v2/.env.staging');
  const coreEnv = parseEnvFile(fallbackPath);
  return {
    host: coreEnv.DB_HOST || 'localhost',
    port: Number(coreEnv.DB_PORT || 5432),
    user: coreEnv.DB_USERNAME || 'app_user',
    password: coreEnv.DB_PASSWORD,
    dbname: coreEnv.DB_NAME || 'postgres',
    readonly: false,
  };
}
