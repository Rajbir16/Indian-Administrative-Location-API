const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Promoting test@example.com to ADMIN...");

  const user = await prisma.user.update({
    where: {
      email: "test@example.com",
    },
    data: {
      role: "ADMIN",
      approvalStatus: "ACTIVE",
      status: "ACTIVE",
      rejectionReason: null,
      approvedAt: new Date(),
    },
    select: {
      email: true,
      role: true,
      approvalStatus: true,
      status: true,
    },
  });

  console.log("ADMIN UPDATE SUCCESS:");
  console.log(user);
}

main()
  .catch((error) => {
    console.error("ADMIN UPDATE FAILED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });