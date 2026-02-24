import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.AUTH_USERNAME || "henry"
  const adminPassword = process.env.AUTH_PASSWORD || "password"

  // Create admin user (henry)
  const henryHash = await bcrypt.hash(adminPassword, 12)
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash: henryHash,
      displayName: "Henry",
      isAdmin: true,
    },
  })

  console.log("Seeded admin user:", adminUsername)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
