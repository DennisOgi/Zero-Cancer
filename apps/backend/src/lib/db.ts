import { PrismaClient } from "@prisma/client";

// Type definitions
declare global {
  var prisma: PrismaClient | undefined;
}

export const getDB = (c: { env?: { DATABASE_URL?: string } }) => {
  // In Node.js environment, use process.env
  const databaseUrl = c.env?.DATABASE_URL || process.env.DATABASE_URL || "file:./prisma/dev.db";
  
  // If it's a local SQLite database, we don't need the Neon adapter
  if (databaseUrl.startsWith("file:")) {
    // Use singleton pattern for Node.js to avoid too many connections
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    return global.prisma;
  }

  // Fallback for production (PostgreSQL/Neon) - Using dynamic imports for edge compatibility
  // Note: Standard PrismaClient works for most local cases.
  return new PrismaClient();
};

export type TDB = PrismaClient;
