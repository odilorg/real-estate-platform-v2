import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { AmenityType } from '@repo/database';

export interface NearbyAmenityResult {
  id: string;
  name: string;
  type: AmenityType;
  distance: number; // in meters
  walkingTime: number; // in minutes
  latitude: number;
  longitude: number;
  address?: string;
}

export interface WalkingScoreData {
  score: number; // 0-100
  description: string;
  breakdown: {
    transport: number;
    education: number;
    healthcare: number;
    shopping: number;
    recreation: number;
  };
}

export interface LocationDataResponse {
  walkingScore: WalkingScoreData;
  nearbyAmenities: {
    transport: NearbyAmenityResult[];
    schools: NearbyAmenityResult[];
    kindergartens: NearbyAmenityResult[];
    hospitals: NearbyAmenityResult[];
    pharmacies: NearbyAmenityResult[];
    supermarkets: NearbyAmenityResult[];
    shoppingMalls: NearbyAmenityResult[];
    restaurants: NearbyAmenityResult[];
    cafes: NearbyAmenityResult[];
    parks: NearbyAmenityResult[];
    gyms: NearbyAmenityResult[];
    banks: NearbyAmenityResult[];
  };
}

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert distance to walking time (assuming 5 km/h walking speed)
   */
  private distanceToWalkingTime(distanceInMeters: number): number {
    const walkingSpeedKmH = 5;
    const walkingSpeedMS = (walkingSpeedKmH * 1000) / 60; // meters per minute
    return Math.round(distanceInMeters / walkingSpeedMS);
  }

  /**
   * Get nearby amenities of a specific type
   */
  async getNearbyAmenitiesByType(
    latitude: number,
    longitude: number,
    type: AmenityType,
    maxDistance: number = 2000, // 2km default
    limit: number = 5,
  ): Promise<NearbyAmenityResult[]> {
    // Get all amenities of this type in the same city
    // In a real implementation, you'd want to filter by a bounding box for performance
    const amenities = await this.prisma.nearbyAmenity.findMany({
      where: { type },
      take: 100, // Get more to filter by distance
    });

    // Calculate distances and filter
    const amenitiesWithDistance = amenities
      .map((amenity) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          amenity.latitude,
          amenity.longitude,
        );

        return {
          id: amenity.id,
          name: amenity.name,
          type: amenity.type,
          distance,
          walkingTime: this.distanceToWalkingTime(distance),
          latitude: amenity.latitude,
          longitude: amenity.longitude,
          address: amenity.address || undefined,
        };
      })
      .filter((a) => a.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return amenitiesWithDistance;
  }

  /**
   * Calculate walking score based on nearby amenities
   * Score ranges from 0-100
   */
  private calculateWalkingScore(
    nearbyAmenities: LocationDataResponse['nearbyAmenities'],
  ): WalkingScoreData {
    const calculateCategoryScore = (amenities: NearbyAmenityResult[]): number => {
      if (amenities.length === 0) return 0;

      // Score based on proximity of closest amenity
      const closest = amenities[0];
      if (!closest) return 0;

      const distance = closest.distance;

      // Excellent: < 400m (5 min walk)
      if (distance < 400) return 100;
      // Good: < 800m (10 min walk)
      if (distance < 800) return 75;
      // Fair: < 1200m (15 min walk)
      if (distance < 1200) return 50;
      // Poor: < 2000m (25 min walk)
      if (distance < 2000) return 25;
      return 0;
    };

    // Calculate scores for each category
    const transportScore = Math.max(
      calculateCategoryScore(nearbyAmenities.transport),
      calculateCategoryScore(nearbyAmenities.transport.filter(a => a.type === AmenityType.METRO))
    );

    const educationScore = Math.max(
      calculateCategoryScore(nearbyAmenities.schools),
      calculateCategoryScore(nearbyAmenities.kindergartens),
    );

    const healthcareScore = Math.max(
      calculateCategoryScore(nearbyAmenities.hospitals),
      calculateCategoryScore(nearbyAmenities.pharmacies),
    );

    const shoppingScore = Math.max(
      calculateCategoryScore(nearbyAmenities.supermarkets),
      calculateCategoryScore(nearbyAmenities.shoppingMalls),
    );

    const recreationScore = Math.max(
      calculateCategoryScore(nearbyAmenities.parks),
      calculateCategoryScore(nearbyAmenities.gyms),
      calculateCategoryScore([...nearbyAmenities.restaurants, ...nearbyAmenities.cafes]),
    );

    // Overall score is weighted average
    const overallScore = Math.round(
      (transportScore * 0.3 +
        educationScore * 0.15 +
        healthcareScore * 0.15 +
        shoppingScore * 0.25 +
        recreationScore * 0.15),
    );

    // Determine description
    let description: string;
    if (overallScore >= 90) {
      description = "Walker's Paradise - Daily errands do not require a car";
    } else if (overallScore >= 70) {
      description = 'Very Walkable - Most errands can be accomplished on foot';
    } else if (overallScore >= 50) {
      description = 'Somewhat Walkable - Some errands can be accomplished on foot';
    } else if (overallScore >= 25) {
      description = 'Car-Dependent - Most errands require a car';
    } else {
      description = 'Very Car-Dependent - Almost all errands require a car';
    }

    return {
      score: overallScore,
      description,
      breakdown: {
        transport: transportScore,
        education: educationScore,
        healthcare: healthcareScore,
        shopping: shoppingScore,
        recreation: recreationScore,
      },
    };
  }

  /**
   * Get comprehensive location data for a property
   */
  async getPropertyLocationData(
    latitude: number,
    longitude: number,
  ): Promise<LocationDataResponse> {
    // Get nearby amenities by category
    const [
      transport,
      schools,
      kindergartens,
      hospitals,
      pharmacies,
      supermarkets,
      shoppingMalls,
      restaurants,
      cafes,
      parks,
      gyms,
      banks,
    ] = await Promise.all([
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.METRO,
        2000,
        3,
      ).then(async (metros) => {
        const busStops = await this.getNearbyAmenitiesByType(
          latitude,
          longitude,
          AmenityType.BUS_STOP,
          1000,
          3,
        );
        return [...metros, ...busStops].sort((a, b) => a.distance - b.distance).slice(0, 5);
      }),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.SCHOOL,
        2000,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.KINDERGARTEN,
        1500,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.HOSPITAL,
        5000,
        3,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.PHARMACY,
        1000,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.SUPERMARKET,
        1500,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.SHOPPING_MALL,
        5000,
        3,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.RESTAURANT,
        1000,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.CAFE,
        1000,
        5,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.PARK,
        2000,
        3,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.GYM,
        2000,
        3,
      ),
      this.getNearbyAmenitiesByType(
        latitude,
        longitude,
        AmenityType.BANK,
        1500,
        5,
      ),
    ]);

    const nearbyAmenities = {
      transport,
      schools,
      kindergartens,
      hospitals,
      pharmacies,
      supermarkets,
      shoppingMalls,
      restaurants,
      cafes,
      parks,
      gyms,
      banks,
    };

    const walkingScore = this.calculateWalkingScore(nearbyAmenities);

    return {
      walkingScore,
      nearbyAmenities,
    };
  }
}
