import { Permission, PrismaClient } from "./generated";

const prisma = new PrismaClient()

async function main() {
  const allPermissions = Object.values(Permission)

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Superuser with all permissions',
      color: 'red-500'
    }
  })

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: adminRole.id, permission: perm } },
      update: {},
      create: { roleId: adminRole.id, permission: perm}
    })
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });