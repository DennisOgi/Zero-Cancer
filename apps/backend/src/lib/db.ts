import { PrismaClient } from "@prisma/client";

// Type definitions
declare global {
  var prisma: PrismaClient | undefined;
}

export const getDB = (c: { env?: { DATABASE_URL?: string } }) => {
  // In Node.js environment, use process.env
  const databaseUrl = c.env?.DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  // Use singleton pattern for Node.js to avoid too many connections
  // This is especially important for serverless environments like Vercel
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  
  return global.prisma;
};

export type TDB = PrismaClient;
