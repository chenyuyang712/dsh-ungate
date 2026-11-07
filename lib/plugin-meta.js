import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedCommunityPackage } from "./installed-package.js";
import { resolveProfile } from "./instance.js";

// 正在运行的这份代码的根目录（社区版包根）。
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PACKAGE_NAME = "dsh-ungate";

export function pluginRoot() {
  return PLUGIN_ROOT;
}

export function localVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "package.json"), "utf8"));
    return String(pkg.version || "");
  } catch {
    return "";
  }
}

// Capture once at module evaluation. localVersion() deliberately remains a disk
// read for installation diagnostics; it must not stand in for loaded code.
const LOADED_VERSION = localVersion();
export function runningVersion() { return LOADED_VERSION; }

export function installedVersion(home) {
  const profile = resolveProfile(home).directory;
  return installedCommunityPackage(profile).package.version;
}
