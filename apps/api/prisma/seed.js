import { PrismaClient, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Categories
  const categories = [
    {
      code: 'ARE_WE_DATING',
      nameEn: 'Are We Dating the Same Guy?',
      nameAm: 'እኛ አንድ ሰው ጋር እየተገናኘን ነው?',
      descriptionEn: 'Anonymous questions to find out whether community members may be experiencing overlapping relationships.',
      descriptionAm: 'ተደራራቢ ግንኙነቶችን በጨዋነት እና በሚስጥር ለማጣራት የቀረበ ክፍል።',
      hashtag: '#are_we_dating_the_same_guy',
      requiresReview: false,
      isActive: true
    },
    {
      code: 'RELATIONSHIP_SAFETY',
      nameEn: 'Relationship Safety Concern',
      nameAm: 'የግንኙነት ደህንነት ማስጠንቀቂያ',
      descriptionEn: 'Confidential reports regarding dishonesty, manipulation, fraud, or relationship safety concerns. Always requires moderator review.',
      descriptionAm: 'ስለ ማጭበርበር፣ ጥቃት ወይም የግንኙነት ደህንነት ስጋት የሚቀርብ ጥቆማ። ሁልጊዜ በአወያዮች ይገመገማል።',
      hashtag: '#relationship_safety',
      requiresReview: true,
      isActive: true
    }
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { code: cat.code }
    });

    if (!existing) {
      const created = await prisma.category.create({ data: cat });
      console.log(`✅ Created Category: ${created.nameEn} (${created.code})`);
    } else {
      console.log(`ℹ️ Category already exists: ${existing.nameEn}`);
    }
  }

  // 2. Seed Initial Super Admin
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@ethiopia-awareness.org';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword123!';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Platform Super Admin';

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const createdAdmin = await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        role: AdminRole.SUPER_ADMIN,
        isActive: true
      }
    });
    console.log(`✅ Created Super Admin: ${createdAdmin.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existingAdmin.email}`);
  }

  console.log('🌿 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

