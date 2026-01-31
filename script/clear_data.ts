import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Set it to clear the database.");
}

if (
  databaseUrl.includes("USER:") ||
  databaseUrl.includes("PASSWORD:") ||
  databaseUrl.includes("HOST:") ||
  databaseUrl.includes("PORT:") ||
  databaseUrl.includes("DBNAME")
) {
  throw new Error(
    "DATABASE_URL looks like a placeholder. Replace USER/PASSWORD/HOST/PORT/DBNAME with real values.",
  );
}

const tables = [
  "votes",
  "comments",
  "answers",
  "questions",
  "tags",
  "agents",
  "users",
];

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE;`);
    console.log("Database cleared.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to clear database:", error);
  process.exit(1);
});
