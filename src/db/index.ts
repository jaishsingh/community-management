import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection pool
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: "default" });

// Export schema for use in other files
export * from "./schema";

