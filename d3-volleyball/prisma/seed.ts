import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("Admin@123456", 12);

  // ✅ Fix: use string literals instead of importing enums
  // This works even before prisma generate completes
  const admin = await prisma.user.upsert({
    where: { email: "admin@d3volleyball.com" },
    update: {},
    create: {
      email: "admin@d3volleyball.com",
      password: hashedPassword,
      fullName: "D3 Admin",
      nickname: "Admin",
      gender: "MALE",         // ← string literal, not Gender.MALE
      skillLevel: "ADVANCED", // ← string literal, not SkillLevel.ADVANCED
      role: "ADMIN",          // ← string literal, not Role.ADMIN
      isApproved: true,
      isBanned: false,
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("🔑 Password: Admin@123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });