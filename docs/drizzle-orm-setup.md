# Drizzle ORM Setup Guide

This document provides a comprehensive guide for using Drizzle ORM with MySQL in this project.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Connection](#database-connection)
- [Schema Definition](#schema-definition)
- [Migrations](#migrations)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

This project uses [Drizzle ORM](https://orm.drizzle.team/) with MySQL for database operations. Drizzle is a lightweight, performant TypeScript ORM that provides type-safe database queries.

### Key Features

- **Type-safe queries**: Full TypeScript support with autocomplete
- **Lightweight**: Minimal runtime overhead
- **SQL-like syntax**: Familiar query building
- **Migration management**: Built-in migration tools via Drizzle Kit

## Installation

The following packages are already installed:

```json
{
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "mysql2": "^3.16.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8"
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with your database connection string:

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

**Example:**
```env
DATABASE_URL="mysql://root:mypassword@localhost:3306/community_management"
```

### Drizzle Config

The Drizzle configuration is located in `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Database Connection

The database connection is set up in `src/db/index.ts`:

```typescript
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
```

### Connection Pool

The setup uses a connection pool (`createPool`) instead of a single connection, which provides:
- Better performance for concurrent requests
- Automatic connection management
- Connection reuse

## Schema Definition

### Schema File Structure

All schema definitions should be placed in `src/db/schema/` and exported from `src/db/schema/index.ts`.

### Example Schema

Here's an example of how to define a table:

```typescript
// src/db/schema/users.ts
import { mysqlTable, varchar, int, timestamp, text } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
```

### Common Column Types

- `int()` - Integer
- `varchar(length)` - Variable length string
- `text()` - Text (unlimited length)
- `boolean()` - Boolean
- `timestamp()` - Timestamp
- `decimal(precision, scale)` - Decimal number
- `json()` - JSON data

### Export Schema

Make sure to export your schema from `src/db/schema/index.ts`:

```typescript
// src/db/schema/index.ts
export * from "./users";
export * from "./chapters";
export * from "./events";
```

## Migrations

### Available Commands

The following npm scripts are available for database migrations:

```bash
# Generate migration files from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes directly to database (development only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Workflow

1. **Define your schema** in `src/db/schema/`
2. **Generate migrations**: `pnpm db:generate`
3. **Review generated files** in `./drizzle/` folder
4. **Apply migrations**: `pnpm db:migrate`

### Migration Files

Migration files are generated in the `./drizzle` folder (which is gitignored). These files contain SQL statements that will be executed to update your database schema.

## Usage Examples

### Basic Queries

#### Select All Records

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";

const allUsers = await db.select().from(users);
```

#### Select with Conditions

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.email, "user@example.com"));
```

#### Insert Record

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";

const newUser = await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
  bio: "Software developer",
});
```

#### Update Record

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1));
```

#### Delete Record

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

await db.delete(users).where(eq(users.id, 1));
```

### Advanced Queries

#### Joins

```typescript
import { db } from "@/db";
import { users, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

const usersWithChapters = await db
  .select()
  .from(users)
  .leftJoin(chapters, eq(users.id, chapters.ownerId));
```

#### Transactions

```typescript
import { db } from "@/db";
import { users, chapters } from "@/db/schema";

await db.transaction(async (tx) => {
  const newUser = await tx.insert(users).values({
    name: "John Doe",
    email: "john@example.com",
  });
  
  await tx.insert(chapters).values({
    name: "My Chapter",
    ownerId: newUser.insertId,
  });
});
```

#### Aggregations

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";

const userCount = await db.select({ count: count() }).from(users);
```

## Best Practices

### 1. Schema Organization

- Keep related tables in the same schema file
- Use descriptive table and column names
- Always include `createdAt` and `updatedAt` timestamps for audit trails

### 2. Type Safety

- Always import types from your schema files
- Use TypeScript's type inference for query results
- Define explicit types when needed:

```typescript
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "@/db/schema";

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;
```

### 3. Error Handling

Always wrap database operations in try-catch blocks:

```typescript
try {
  const user = await db.select().from(users).where(eq(users.id, 1));
} catch (error) {
  console.error("Database error:", error);
  // Handle error appropriately
}
```

### 4. Performance

- Use connection pooling (already configured)
- Add indexes for frequently queried columns
- Use transactions for multiple related operations
- Avoid N+1 queries by using joins

### 5. Security

- Never expose `DATABASE_URL` in client-side code
- Use parameterized queries (Drizzle does this automatically)
- Validate input before database operations
- Use environment variables for sensitive data

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle MySQL Guide](https://orm.drizzle.team/docs/get-started-mysql)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)

## Troubleshooting

### Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check MySQL server is running
- Ensure database exists
- Verify credentials

### Migration Issues

- Review generated migration files before applying
- Backup database before running migrations in production
- Use `db:push` for development, `db:migrate` for production

### Type Errors

- Ensure schema files are exported from `src/db/schema/index.ts`
- Restart TypeScript server after schema changes
- Check that all imports are correct

