import { PrismaClient, Currency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding price history data...');

  // Fetch all properties
  const properties = await prisma.property.findMany({
    include: {
      user: true,
    },
  });

  console.log(`Found ${properties.length} properties`);

  for (const property of properties) {
    // Generate 3-4 price changes for each property
    const numberOfPriceChanges = Math.floor(Math.random() * 2) + 3; // 3 or 4

    let currentPrice = property.price;
    const priceHistory = [];

    // Generate historical prices going backwards in time
    for (let i = 0; i < numberOfPriceChanges; i++) {
      // Calculate a date in the past (spread over 6-12 months)
      const daysAgo = Math.floor(Math.random() * 180) + (i * 60); // Spread over time
      const changeDate = new Date();
      changeDate.setDate(changeDate.getDate() - daysAgo);

      // Calculate price variation (±5-15%)
      const variation = (Math.random() * 0.10 + 0.05) * (Math.random() > 0.5 ? 1 : -1);
      const oldPrice = Math.round(currentPrice * (1 - variation));

      priceHistory.push({
        propertyId: property.id,
        oldPrice: oldPrice,
        newPrice: currentPrice,
        currency: property.currency,
        changedBy: property.userId,
        createdAt: changeDate,
      });

      // Update current price for next iteration
      currentPrice = oldPrice;
    }

    // Sort by date (oldest first)
    priceHistory.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Insert price history records
    for (const record of priceHistory) {
      await prisma.priceHistory.create({
        data: record,
      });
    }

    console.log(`Created ${numberOfPriceChanges} price history records for property ${property.id}`);
  }

  console.log('Price history seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
