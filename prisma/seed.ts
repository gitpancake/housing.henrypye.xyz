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

  // Create zoey user with a default password
  const zoeyHash = await bcrypt.hash("zoey2026!", 12)
  await prisma.user.upsert({
    where: { username: "zoey" },
    update: {},
    create: {
      username: "zoey",
      passwordHash: zoeyHash,
      displayName: "Zoey",
      isAdmin: false,
    },
  })

  console.log("Seeded users: henry (admin), zoey")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
