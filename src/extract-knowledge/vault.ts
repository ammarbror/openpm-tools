import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class VaultPathNotFoundError extends Error {
  constructor() {
    super(
      'Obsidian vault path not found. Specify via --vault/--out flag, or OBSIDIAN_VAULT_PATH / OBSIDIAN_VAULT env var, or create standard directory ~/Documents/Obsidian Vault or ~/Obsidian.'
    );
    this.name = 'VaultPathNotFoundError';
  }
}

export function resolveVaultPath(options: { vaultPath?: string; outDir?: string } = {}): string {
  if (options.vaultPath) {
    return path.resolve(options.vaultPath);
  }

  if (options.outDir) {
    return path.resolve(options.outDir);
  }

  const envPath = process.env.OBSIDIAN_VAULT_PATH || process.env.OBSIDIAN_VAULT;
  if (envPath) {
    return path.resolve(envPath);
  }

  const home = os.homedir();
  const std1 = path.join(home, 'Documents', 'Obsidian Vault');
  if (fs.existsSync(std1)) {
    return std1;
  }

  const std2 = path.join(home, 'Obsidian');
  if (fs.existsSync(std2)) {
    return std2;
  }

  throw new VaultPathNotFoundError();
}

export function ensureDirExist(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
