// Prisma config file used for prisma-related tooling.
//
// This project previously referenced a module path `prisma/config` which is not
// available in the installed `prisma` package, causing build/type-check failures.

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

