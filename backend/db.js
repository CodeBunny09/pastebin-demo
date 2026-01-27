import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve("pastebin.db");
const SCHEMA_PATH = path.resolve("schema.sql");

sqlite3.verbose();

export const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
});
