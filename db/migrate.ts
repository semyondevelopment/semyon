import { migrateDb } from "./client";
(async () => {
  await migrateDb();
  console.log("Migrated.");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
