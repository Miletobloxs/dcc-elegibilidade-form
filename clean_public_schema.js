const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning public schema...');

    // Get all tables in the public schema
    const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public';
  `;

    for (const { tablename } of tables) {
        console.log(`Dropping table public."${tablename}" CASCADE...`);
        try {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public."${tablename}" CASCADE;`);
        } catch (e) {
            console.error(`Error dropping table ${tablename}:`, e.message);
        }
    }

    // Also drop enums/types if any
    const types = await prisma.$queryRaw`
    SELECT typname FROM pg_type t 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' AND t.typtype = 'e';
  `;

    for (const { typname } of types) {
        console.log(`Dropping type public."${typname}" CASCADE...`);
        try {
            await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS public."${typname}" CASCADE;`);
        } catch (e) {
            console.error(`Error dropping type ${typname}:`, e.message);
        }
    }

    console.log('Public schema cleaned successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
