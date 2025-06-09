import { Permission, PrismaClient } from "./generated";

const prisma = new PrismaClient()

async function seedRole(name: string, description: string, color: string, permissions: Permission[]) {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description, color },
    create: { name, description, color },
  })

  await prisma.rolePermission.deleteMany({
    where: { roleId: role.id },
  })

  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map(perm => ({
        roleId: role.id,
        permission: perm,
      })),
    });
  }
}

async function seedCertificate(code: string, name: string, color: string) {
    await prisma.certificate.upsert({
        where: { code }, // Menggunakan 'code' sebagai unique identifier
        update: { name, color },
        create: { code, name, color },
    });
    console.log(`Seeded certificate: '${name} (${code})'`);
}


async function main() {
  await seedRole(
    'Admin (Superadmin)',
    'Full system access, manage users and content, full control over website settings, manage all data.',
    'red-600',
    [Permission.ADMINISTRATOR] // Permission ADMINISTRATOR sudah cukup untuk memberikan akses penuh
  )

  await seedRole(
    'Director (General)',
    'View all system data, manage overall operations.',
    'yellow-500',
    [Permission.VIEW_ALL_DATA, Permission.MANAGE_OPERATIONS]
  )

  await seedRole(
    'Training Director',
    'Manage training sessions, materials, schedules, monitor progress, access to participant data.',
    'blue-500',
    [Permission.MANAGE_TRAINING, Permission.VIEW_TRAINING_RECORDS] // Director juga harus bisa melihat
  )

  await seedRole(
    'Event Director',
    'Manage events, schedules, participants, post-event reports.',
    'green-500',
    [Permission.MANAGE_EVENTS, Permission.VIEW_EVENT_RECORDS]
  )

  await seedRole(
    'Facilities Director',
    'Manage facilities, ensure readiness for events and training.',
    'indigo-500',
    [Permission.MANAGE_FACILITIES]
  )

  await seedRole(
    'Public Relations',
    'Manage external communications and social media.',
    'pink-500',
    [Permission.MANAGE_COMMUNICATIONS]
  )

  await seedRole(
    'Webmaster',
    'Maintain technical aspects of the website, update and manage content.',
    'gray-600',
    [Permission.MANAGE_WEBSITE]
  )

  await seedRole(
    'Mentor',
    'Manage materials, provide feedback, mentor participants.',
    'teal-500',
    [Permission.MANAGE_TRAINING] // Diberi akses untuk mengelola training
  )

  await seedRole(
    'Instructor',
    'Manage sessions, upload materials, assess participants.',
    'cyan-500',
    [Permission.MANAGE_TRAINING] // Diberi akses yang sama dengan Mentor
  )

  await seedRole(
    'Student',
    'Participate in training, access materials, submit assignments.',
    'purple-500',
    [Permission.VIEW_TRAINING_RECORDS]
  )

  // --- Seed Default Role for New Users ---
  await seedRole(
    'Member',
    'Default role for all registered users.',
    'slate-400',
    [Permission.VIEW_ROSTER, Permission.VIEW_EVENT_RECORDS] // Member biasa bisa melihat roster dan daftar event
  )

  await seedCertificate('DEL', 'Delivery Controller', 'gray-400');
  await seedCertificate('GND', 'Ground Controller', 'amber-500');
  await seedCertificate('TWR', 'Tower Controller', 'red-500');
  await seedCertificate('APP', 'Approach Controller', 'blue-500');
  await seedCertificate('CTR', 'Center Controller', 'indigo-600');

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });