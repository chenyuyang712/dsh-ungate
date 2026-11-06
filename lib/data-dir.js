// Data directory name and one-way migration from the pre-0.2.0 package name.
// Kept in one place so audit, backups and snapshots never disagree about where
// "this plugin's" files live.
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = "dsh-ungate";
export const LEGACY_DATA_DIRS = ["dsh-purge-minimal"];

export function dataDir(home) {
  const base = path.join(home, DATA_DIR);
  try {
    if (!fs.existsSync(base)) {
      for (const legacy of LEGACY_DATA_DIRS) {
        const old = path.join(home, legacy);
        if (!fs.existsSync(old)) continue;
        fs.renameSync(old, base);
        break;
      }
    }
  } catch {
    // A failed migration must not block startup: fall back to whatever exists.
    for (const legacy of LEGACY_DATA_DIRS) {
      const old = path.join(home, legacy);
      try {
        if (fs.existsSync(old)) return old;
      } catch {}
    }
  }
  return base;
}
