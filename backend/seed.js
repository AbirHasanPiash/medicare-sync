import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database...');
  // This wipes all existing users (and their profiles due to Cascade delete)
  await prisma.user.deleteMany({}); 

  console.log('Seeding new database...');
  const password = await bcrypt.hash('password123', 10);

  // 1. Create an Admin
  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@medicare.com',
      password,
      role: 'ADMIN',
    },
  });

  // 2. Create a Doctor
  const doctor = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'doctor@medicare.com',
      password,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          specialization: 'Cardiology',
          availableDays: ['Monday', 'Wednesday', 'Friday'],
        },
      },
    },
  });

  console.log(`Admin created: ${admin.firstName} ${admin.lastName}`);
  console.log(`Doctor created: Dr. ${doctor.firstName} ${doctor.lastName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });