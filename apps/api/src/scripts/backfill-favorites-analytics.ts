import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

/**
 * Backfill existing favorites into PropertyAnalytics table
 * This is a one-time migration script to track historical favorites
 */
async function backfillFavoritesAnalytics() {
  console.log('Starting favorites analytics backfill...');

  try {
    // Get all existing favorites
    const favorites = await prisma.favorite.findMany({
      select: {
        propertyId: true,
        createdAt: true,
      },
    });

    console.log(`Found ${favorites.length} existing favorites to backfill`);

    // Group favorites by property and date
    const favoritesByPropertyAndDate = new Map<string, number>();

    for (const favorite of favorites) {
      const date = new Date(favorite.createdAt);
      date.setHours(0, 0, 0, 0);

      const key = `${favorite.propertyId}_${date.toISOString()}`;
      favoritesByPropertyAndDate.set(
        key,
        (favoritesByPropertyAndDate.get(key) || 0) + 1,
      );
    }

    console.log(
      `Processing ${favoritesByPropertyAndDate.size} unique property-date combinations`,
    );

    // Insert or update PropertyAnalytics records
    let updated = 0;
    for (const [key, count] of favoritesByPropertyAndDate) {
      const [propertyId, dateStr] = key.split('_');
      const date = new Date(dateStr);

      await prisma.propertyAnalytics.upsert({
        where: {
          propertyId_date: {
            propertyId,
            date,
          },
        },
        create: {
          propertyId,
          date,
          favorites: count,
          views: 0,
          contacts: 0,
          unfavorites: 0,
        },
        update: {
          favorites: {
            increment: count,
          },
        },
      });

      updated++;
      if (updated % 10 === 0) {
        console.log(`Processed ${updated}/${favoritesByPropertyAndDate.size}`);
      }
    }

    console.log(
      `✅ Successfully backfilled ${favorites.length} favorites into analytics`,
    );
    console.log(`✅ Updated ${updated} PropertyAnalytics records`);
  } catch (error) {
    console.error('❌ Error backfilling favorites:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillFavoritesAnalytics()
  .then(() => {
    console.log('Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
