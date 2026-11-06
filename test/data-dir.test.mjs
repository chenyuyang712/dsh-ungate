import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dataDir, DATA_DIR } from "../lib/data-dir.js";

function tempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ungate-data-"));
}

test("new home gets dsh-ungate data dir", () => {
  const home = tempHome();
  const dir = dataDir(home);
  assert.equal(dir, path.join(home, DATA_DIR));
  assert.equal(fs.existsSync(dir), false, "helper must not create the directory itself");
});

test("legacy dsh-purge-minimal data dir is migrated once", () => {
  const home = tempHome();
  const legacy = path.join(home, "dsh-purge-minimal");
  fs.mkdirSync(path.join(legacy, "backups"), { recursive: true });
  fs.writeFileSync(path.join(legacy, "audit.jsonl"), '{"event":"apply"}\n');

  const dir = dataDir(home);
  assert.equal(dir, path.join(home, DATA_DIR));
  assert.equal(fs.existsSync(legacy), false, "legacy dir must be gone after migration");
  assert.equal(fs.readFileSync(path.join(dir, "audit.jsonl"), "utf8"), '{"event":"apply"}\n');
  assert.equal(fs.existsSync(path.join(dir, "backups")), true);
});

test("existing dsh-ungate dir wins over a leftover legacy dir", () => {
  const home = tempHome();
  const current = path.join(home, DATA_DIR);
  const legacy = path.join(home, "dsh-purge-minimal");
  fs.mkdirSync(current, { recursive: true });
  fs.mkdirSync(legacy, { recursive: true });
  fs.writeFileSync(path.join(current, "audit.jsonl"), "new\n");

  assert.equal(dataDir(home), current);
  assert.equal(fs.readFileSync(path.join(current, "audit.jsonl"), "utf8"), "new\n");
  assert.equal(fs.existsSync(legacy), true, "leftover legacy dir must not be deleted");
});
