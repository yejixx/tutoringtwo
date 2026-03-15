import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Use Neon's HTTP-based serverless driver for fast queries
  // connect_timeout of 10s handles cold starts without being too long
  const urlWithTimeout = connectionString.includes('connect_timeout')
    ? connectionString
    : `${connectionString}${connectionString.includes('?') ? '&' : '?'}connect_timeout=10`;

  const adapter = new PrismaNeon({ connectionString: urlWithTimeout });
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
