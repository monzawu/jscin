// Copyright 2024 Google Inc. All Rights Reserved.

/**
 * @fileoverview All migration stuff.
 * @author Hung-Te Lin <hungte@gmail.com>
 */

import {ChromeStorage, CompressedStorage, Storage} from "./storage.js";
import { AddLogger } from "./logger.js";
const {log, debug, info, warn, error, assert, trace} = AddLogger("migrate");


const kTableOldMetadataKey = "table_metadata";
const kTableOldDataKeyPrefix = "table_data-";

export class Migration {
  constructor(ime, storage, old_storage) {
    if (!storage) {
      if (globalThis.chrome?.storage.local) {
        storage = new ChromeStorage();
      } else {
        storage = new Storage();
        debug("Migration: Selected Storage for new storage debugging.");
      }
    }
    if (!old_storage) {
      if (globalThis.localStorage) {
        old_storage = new CompressedStorage();
      } else {
        old_storage = new Storage();
        debug("Migration: Selected Storage for old storage for debugging.");
      }
    }
    this.storage = storage;
    this.old_storage = old_storage;
    this.ime = ime;
  }

  // Migrate from version <= v2.27.0
  migrateTable(data, meta) {
    if ('cin' in data)
      return data;

    // Ok, not a new format; let's try if it's ok for migration
    if (!data.ename || !data.cname || !data.chardef) {
      error("migrateTable: Unkown format:",  data.ename, data);
      return data;
    }

    let info = meta[data.ename] || {};
    let table = this.ime.createTable(data, meta.url, meta.setting);
    debug("Migrated the table to new format:", table.cin.ename, data, "=>", table);
    return table;
  }

  async migrateAllTables() {

    let old_meta = await this.old_storage.get(kTableOldMetadataKey);
    let infos = await this.storage.get(KEY_INFO_LIST) || {};
    debug("migrateAllTables: start to check...", old_meta, infos);
    // In case old_meta was corrupted, we want to keep migrating even if the
    // metadata does not have the
    for (let k of await this.old_storage.getKeys()) {
      if (!k.startsWith(kTableOldDataKeyPrefix))
        continue;
      assert(kTableOldDataKeyPrefix.endsWith('-'),
             "The old table data key must end with '-'");
      let name = k.substring(kTableOldDataKeyPrefix.length);
      let meta = old_meta[name] ||{};
      if (meta.builtin) {
        debug("Ignore built-in table:", name);
        continue;
      }
      debug("Checking if we need to migarte the old table:", name, k);
      let new_k = this.ime.tableKey(name);
      assert(new_k != k, "The key must be different for migration", k, new_k);
      if (await this.storage.has(new_k)) {
        debug("New table is already there, skip:", name, new_k);
        continue;
      }
      // Now we have a new table.
      let table = this.migrateTable(await this.old_storage.get(k), meta);
      infos[name] = table.info;
      await this.storage.set(new_k, table);
    }
    await this.storage.set(KEY_INFO_LIST, infos);
    debug("migrateTable: All tables migrated.", infos);
  }

  async removeLegacyBackupTables() {
    // These backups won't be really used. Instead we do the migration.
    let keys = await this.storage.getKeys();
    let to_remove = keys.filter((v)=>v.startsWith(kTableOldDataKeyPrefix));
    debug("removeLegacyBackupTables:", to_remove);
    for (let k of to_remove)
      this.storage.remove(k);
  }

  removeLocalStorageData() {
    // Raw tables
    const kRawdataKeyPrefix = "raw_data-";
    // Oauth credentials
    const kOauthPrefix = "oauth";

    for (let k in localStorage) {
      if (k.startsWith(kRawdataKeyPrefix) ||
          k.startsWith(kOauthPrefix))
        delete localStorage[k];
    }
  }

  async migrateAll() {
    this.removeLocalStorageData();
    this.removeLegacyBackupTables();
    return this.migrateAllTables();
  }
}
