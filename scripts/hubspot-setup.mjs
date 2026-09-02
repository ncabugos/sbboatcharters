#!/usr/bin/env node
/**
 * One-time HubSpot setup. Idempotent: safe to re-run.
 *
 *  1. Creates the custom contact properties the sync writes (see PROPERTIES in
 *     lib/hubspot.mjs). Existing properties are left alone, except that any
 *     missing dropdown options are added.
 *  2. Creates the active list "SB Boat Charters" (Business is SB Boat
 *     Charters) if the key has the crm.lists.write scope. Without it, the
 *     script prints how to build the list by hand.
 *
 * Usage:  npm run hubspot:setup
 * Reads HUBSPOT_ACCESS_TOKEN from .env.local (see scripts/hubspot-env.mjs).
 */
import { loadHubspotToken } from './hubspot-env.mjs';

loadHubspotToken();
const { hubspotApi, PROPERTIES, LIST_NAME, BUSINESS } = await import('../lib/hubspot.mjs');

async function ensureProperty(def) {
  let existing = null;
  try {
    existing = await hubspotApi('GET', `/crm/v3/properties/contacts/${def.name}`);
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  if (!existing) {
    await hubspotApi('POST', '/crm/v3/properties/contacts', def);
    console.log(`  created  ${def.name}`);
    return;
  }
  if (def.type === 'enumeration') {
    const have = new Set((existing.options || []).map((o) => o.value));
    const missing = def.options.filter((o) => !have.has(o.value));
    if (missing.length) {
      await hubspotApi('PATCH', `/crm/v3/properties/contacts/${def.name}`, {
        options: [...(existing.options || []), ...missing],
      });
      console.log(`  updated  ${def.name} (+${missing.map((o) => o.value).join(', ')})`);
      return;
    }
  }
  console.log(`  ok       ${def.name}`);
}

async function ensureList() {
  try {
    await hubspotApi('GET', `/crm/v3/lists/object-type-id/0-1/name/${encodeURIComponent(LIST_NAME)}`);
    console.log(`  ok       list "${LIST_NAME}"`);
    return;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  await hubspotApi('POST', '/crm/v3/lists', {
    name: LIST_NAME,
    objectTypeId: '0-1',
    processingType: 'DYNAMIC',
    filterBranch: {
      filterBranchType: 'OR',
      filterBranches: [{
        filterBranchType: 'AND',
        filterBranches: [],
        filters: [{
          filterType: 'PROPERTY',
          property: 'business',
          operation: { operationType: 'ENUMERATION', operator: 'IS_ANY_OF', values: [BUSINESS.value] },
        }],
      }],
      filters: [],
    },
  });
  console.log(`  created  list "${LIST_NAME}"`);
}

console.log('Contact properties:');
for (const def of PROPERTIES) await ensureProperty(def);

console.log('Segment list:');
try {
  await ensureList();
} catch (err) {
  if (err.status === 403) {
    console.log(
      `  skipped  the key lacks the crm.lists.write scope.\n` +
      `           Build it by hand: Contacts > Lists > Create list > Active > ` +
      `filter "Business is any of ${BUSINESS.label}".`
    );
  } else {
    throw err;
  }
}
console.log('Done.');
