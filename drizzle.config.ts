import { defineConfig } from "drizzle-kit";
import { resolveDatabaseUrl, withSslQueryParam } from "./src/db/connection-url";

const raw = resolveDatabaseUrl();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: raw ? withSslQueryParam(raw) : "postgresql://localhost:5432/placeholder" },
});
