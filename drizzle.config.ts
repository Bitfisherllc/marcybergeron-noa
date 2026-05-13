import { defineConfig } from "drizzle-kit";

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: tursoUrl && tursoToken ? "turso" : "sqlite",
  dbCredentials:
    tursoUrl && tursoToken
      ? { url: tursoUrl, authToken: tursoToken }
      : { url: "file:./data/site.db" },
});
