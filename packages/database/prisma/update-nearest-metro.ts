import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function updateNearestMetro() {
  console.log('🚇 Starting nearest metro calculation for all properties...');

  // Get all metro stations
  const metroStations = await prisma.metroStation.findMany({
    where: { isOperational: true },
  });

  console.log(`Found ${metroStations.length} metro stations`);

  // Get all properties with coordinates
  const properties = await prisma.property.findMany({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ],
    },
    select: {
      id: true,
      title: true,
      latitude: true,
      longitude: true,
      city: true,
    },
  });

  console.log(`Found ${properties.length} properties with coordinates`);

  let updated = 0;
  let errors = 0;

  for (const property of properties) {
    if (!property.latitude || !property.longitude) continue;

    try {
      // Find nearest metro station
      let nearestStation = null;
      let minDistance = Infinity;

      for (const station of metroStations) {
        const distance = calculateDistance(
          property.latitude,
          property.longitude,
          station.latitude,
          station.longitude,
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = station;
        }
      }

      if (nearestStation) {
        // Update property with nearest metro
        await prisma.property.update({
          where: { id: property.id },
          data: {
            nearestMetro: nearestStation.nameRu,
            metroDistance: Math.round(minDistance),
          },
        });

        updated++;
        const distanceKm = (minDistance / 1000).toFixed(2);
        console.log(
          `✅ [${updated}/${properties.length}] ${property.title.slice(0, 40)}... → ${nearestStation.nameRu} (${distanceKm} km)`,
        );
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error updating property ${property.id}:`, error);
    }
  }

  console.log(`\n✅ Update complete!`);
  console.log(`   - Properties updated: ${updated}`);
  console.log(`   - Errors: ${errors}`);
}

updateNearestMetro()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
