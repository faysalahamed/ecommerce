const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://daraz_user:change_me_in_prod@localhost:5432/daraz?schema=public' });

async function main() {
  await client.connect();
  await client.query(`
    ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "model" TEXT,
      ADD COLUMN IF NOT EXISTS "sku" TEXT,
      ADD COLUMN IF NOT EXISTS "highlights" TEXT,
      ADD COLUMN IF NOT EXISTS "whatsInTheBox" TEXT,
      ADD COLUMN IF NOT EXISTS "warrantyType" TEXT,
      ADD COLUMN IF NOT EXISTS "warrantyPeriod" TEXT,
      ADD COLUMN IF NOT EXISTS "packageWeight" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "packageDimensions" TEXT,
      ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
  `);
  console.log('Successfully added columns to Product table!');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
