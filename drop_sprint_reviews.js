const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Dropping sprint_reviews...');
    try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public."sprint_reviews" CASCADE;`);
        console.log('Dropped successfully.');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
