/**
 * Loads HUBSPOT_ACCESS_TOKEN for the one-off HubSpot scripts.
 *
 * Read from a gitignored env file, never from the command line: pasting a
 * secret into a shell leaks it into history and mangles characters like $.
 * Precedence is explicit env var, then .env.production.local, then .env.local.
 * The source is printed before anything connects.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILES = ['.env.production.local', '.env.local'];
const KEY = 'HUBSPOT_ACCESS_TOKEN';

function readKey(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return null;
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?HUBSPOT_ACCESS_TOKEN\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return null;
}

export function loadHubspotToken() {
  let value = process.env[KEY];
  let source = 'environment';
  if (!value) {
    for (const file of ENV_FILES) {
      const v = readKey(file);
      if (v) { value = v; source = file; break; }
    }
  }
  if (!value || value.length < 20 || /^(paste|your|xxx|\[)/i.test(value)) {
    console.error(
      `Missing ${KEY}.\n` +
      `Add one line to .env.local (open it in an editor, do not type the key into a terminal):\n` +
      `  ${KEY}=<the service key from HubSpot > Development > Keys > Service Keys>`
    );
    process.exit(1);
  }
  process.env[KEY] = value;
  console.log(`HubSpot token: from ${source} (ends in ...${value.slice(-4)})`);
  if (process.env.HUBSPOT_API_BASE) console.log(`HubSpot API base: ${process.env.HUBSPOT_API_BASE}`);
}
