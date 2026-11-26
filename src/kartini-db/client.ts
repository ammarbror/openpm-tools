import { spawn } from 'node:child_process';
import { getKartiniDbConfig, KartiniDbEnvironment } from './config.ts';

export interface QueryResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeKartiniQuery(
  env: KartiniDbEnvironment,
  sql: string,
  options?: { json?: boolean; strictReadOnly?: boolean }
): Promise<QueryResult> {
  const config = getKartiniDbConfig(env);

  let formattedSql = sql.trim();
  const strictReadOnly = env === 'prod' || (options?.strictReadOnly ?? config.readonly);

  const psqlArgs = [
    '-h', config.host,
    '-p', String(config.port),
    '-U', config.user,
    '-d', config.dbname,
  ];

  if (options?.json) {
    formattedSql = `SELECT json_agg(t) FROM (${formattedSql.replace(/;+$/, '')}) t;`;
    // Keep transaction command tags out of the JSON output.
    psqlArgs.push('-q', '-t', '-A');
  }

  if (strictReadOnly) {
    // Use the same psql -c request so both statements share a transaction.
    formattedSql = `SET TRANSACTION READ ONLY;\n${formattedSql}`;
  }

  psqlArgs.push('-c', formattedSql);

  const envVars: NodeJS.ProcessEnv = {
    ...process.env,
  };
  if (config.password) {
    envVars.PGPASSWORD = config.password;
  } else {
    // If not explicitly provided in config, delete PGPASSWORD from inherited process.env
    // so psql can fall back to standard ~/.pgpass authentication
    delete envVars.PGPASSWORD;
  }

  return new Promise((resolve) => {
    const proc = spawn('psql', psqlArgs, { env: envVars });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (exitCode) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode ?? 0,
      });
    });

    proc.on('error', (err) => {
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
      });
    });
  });
}
