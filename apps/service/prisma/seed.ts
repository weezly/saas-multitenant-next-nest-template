import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (be careful in production!)
  await prisma.membership.deleteMany();
  await prisma.role.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  // Create a test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  });
  console.log(`✓ Created tenant: ${tenant.name}`);

  // Create roles for the tenant
  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      tenantId: tenant.id,
      permissions: {
        projects: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        roles: ['create', 'read', 'update', 'delete'],
        members: ['create', 'read', 'update', 'delete'],
        settings: ['create', 'read', 'update', 'delete'],
      },
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      tenantId: tenant.id,
      permissions: {
        projects: ['create', 'read', 'update', 'delete'],
        users: ['read'],
        roles: ['read'],
        members: ['read', 'update'],
        settings: ['read', 'update'],
      },
    },
  });

  const memberRole = await prisma.role.create({
    data: {
      name: 'Member',
      tenantId: tenant.id,
      permissions: {
        projects: ['read'],
        users: ['read'],
      },
    },
  });

  console.log(`✓ Created roles: Owner, Admin, Member`);

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: 'hashed_password_here',
      name: 'Owner User',
      provider: 'credentials',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: 'hashed_password_here',
      name: 'Admin User',
      provider: 'credentials',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'member@example.com',
      password: 'hashed_password_here',
      name: 'Member User',
      provider: 'credentials',
    },
  });

  console.log(`✓ Created users: owner@example.com, admin@example.com, member@example.com`);

  // Create memberships
  await prisma.membership.create({
    data: {
      userId: user1.id,
      tenantId: tenant.id,
      roleId: ownerRole.id,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user2.id,
      tenantId: tenant.id,
      roleId: adminRole.id,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user3.id,
      tenantId: tenant.id,
      roleId: memberRole.id,
    },
  });

  console.log(`✓ Created memberships`);

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Sample Project 1',
      description: 'This is a sample project',
      tenantId: tenant.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Sample Project 2',
      description: 'Another sample project',
      tenantId: tenant.id,
    },
  });

  console.log(`✓ Created projects: Sample Project 1, Sample Project 2`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📊 Database Summary:');
  console.log(`  - Tenants: 1`);
  console.log(`  - Users: 3`);
  console.log(`  - Roles: 3`);
  console.log(`  - Memberships: 3`);
  console.log(`  - Projects: 2`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
