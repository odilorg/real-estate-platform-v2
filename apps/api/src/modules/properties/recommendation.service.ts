import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { PropertyType, ListingType } from '@repo/shared';

export interface SimilarProperty {
  id: string;
  title: string;
  price: number;
  priceUsd: number;
  currency: string;
  propertyType: PropertyType;
  listingType: ListingType;
  address: string;
  city: string;
  district: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  images: Array<{ url: string; isPrimary: boolean }>;
  similarityScore: number;
  matchReasons: string[];
}

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Find similar properties based on multiple weighted factors
   */
  async findSimilarProperties(
    propertyId: string,
    limit = 6,
  ): Promise<SimilarProperty[]> {
    // Get the source property
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        amenities: true,
      },
    });

    if (!property) {
      return [];
    }

    // Fetch candidate properties (same listing type, exclude current property)
    const candidates = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId },
        status: 'ACTIVE',
        listingType: property.listingType,
      },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        amenities: true,
      },
      take: 100, // Fetch more to score and filter
    });

    // Score each candidate
    const scoredProperties = candidates.map((candidate) => {
      const score = this.calculateSimilarityScore(property, candidate);
      const matchReasons = this.getMatchReasons(property, candidate);

      return {
        ...candidate,
        amenities: undefined, // Remove amenities from output
        similarityScore: score.total,
        matchReasons,
      };
    });

    // Sort by similarity score (highest first) and take top N
    const topSimilar = scoredProperties
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return topSimilar as SimilarProperty[];
  }

  /**
   * Calculate similarity score based on weighted factors
   */
  private calculateSimilarityScore(
    source: any,
    candidate: any,
  ): { total: number; breakdown: Record<string, number> } {
    const scores: Record<string, number> = {};

    // 1. Property Type Match (Weight: 20%)
    scores.propertyType =
      source.propertyType === candidate.propertyType ? 20 : 0;

    // 2. Price Similarity (Weight: 25%)
    if (source.priceUsd && candidate.priceUsd) {
      const priceDiff = Math.abs(source.priceUsd - candidate.priceUsd);
      const avgPrice = (source.priceUsd + candidate.priceUsd) / 2;
      const priceVariance = priceDiff / avgPrice;

      // Score decreases as price variance increases
      if (priceVariance <= 0.1)
        scores.price = 25; // Within 10%
      else if (priceVariance <= 0.2)
        scores.price = 20; // Within 20%
      else if (priceVariance <= 0.3)
        scores.price = 15; // Within 30%
      else if (priceVariance <= 0.5)
        scores.price = 10; // Within 50%
      else scores.price = 0;
    }

    // 3. Area Similarity (Weight: 15%)
    if (source.area && candidate.area) {
      const areaDiff = Math.abs(source.area - candidate.area);
      const avgArea = (source.area + candidate.area) / 2;
      const areaVariance = areaDiff / avgArea;

      if (areaVariance <= 0.1)
        scores.area = 15; // Within 10%
      else if (areaVariance <= 0.2)
        scores.area = 12; // Within 20%
      else if (areaVariance <= 0.3)
        scores.area = 8; // Within 30%
      else if (areaVariance <= 0.5)
        scores.area = 5; // Within 50%
      else scores.area = 0;
    }

    // 4. Bedrooms Match (Weight: 10%)
    if (source.bedrooms !== null && candidate.bedrooms !== null) {
      const bedroomsDiff = Math.abs(source.bedrooms - candidate.bedrooms);
      if (bedroomsDiff === 0) scores.bedrooms = 10;
      else if (bedroomsDiff === 1) scores.bedrooms = 7;
      else if (bedroomsDiff === 2) scores.bedrooms = 3;
      else scores.bedrooms = 0;
    }

    // 5. Location Similarity (Weight: 20%)
    // City match
    if (source.city === candidate.city) {
      scores.location = 10;

      // District match (additional points)
      if (source.district && source.district === candidate.district) {
        scores.location += 5;
      }

      // Geo-proximity (if coordinates available)
      if (
        source.latitude &&
        source.longitude &&
        candidate.latitude &&
        candidate.longitude
      ) {
        const distance = this.calculateDistance(
          source.latitude,
          source.longitude,
          candidate.latitude,
          candidate.longitude,
        );

        if (distance <= 1)
          scores.location += 5; // Within 1km
        else if (distance <= 3)
          scores.location += 3; // Within 3km
        else if (distance <= 5) scores.location += 1; // Within 5km
      }
    }

    // 6. Building Features (Weight: 5%)
    if (
      source.buildingClass &&
      source.buildingClass === candidate.buildingClass
    ) {
      scores.buildingClass = 2.5;
    }
    if (source.renovation && source.renovation === candidate.renovation) {
      scores.renovation = 2.5;
    }

    // 7. Amenities Overlap (Weight: 5%)
    if (source.amenities && candidate.amenities) {
      const sourceAmenities = new Set(
        source.amenities.map((a: any) => a.amenity),
      );
      const candidateAmenities = new Set(
        candidate.amenities.map((a: any) => a.amenity),
      );

      const intersection = new Set(
        [...sourceAmenities].filter((x) => candidateAmenities.has(x)),
      );
      const union = new Set([...sourceAmenities, ...candidateAmenities]);

      if (union.size > 0) {
        const jaccardIndex = intersection.size / union.size;
        scores.amenities = jaccardIndex * 5;
      }
    }

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

    return { total, breakdown: scores };
  }

  /**
   * Generate human-readable match reasons
   */
  private getMatchReasons(source: any, candidate: any): string[] {
    const reasons: string[] = [];

    // Property type
    if (source.propertyType === candidate.propertyType) {
      reasons.push('Тот же тип недвижимости');
    }

    // Price similarity
    if (source.priceUsd && candidate.priceUsd) {
      const priceDiff = Math.abs(source.priceUsd - candidate.priceUsd);
      const avgPrice = (source.priceUsd + candidate.priceUsd) / 2;
      const priceVariance = priceDiff / avgPrice;

      if (priceVariance <= 0.2) {
        reasons.push('Похожая цена');
      }
    }

    // Area similarity
    if (source.area && candidate.area) {
      const areaDiff = Math.abs(source.area - candidate.area);
      const avgArea = (source.area + candidate.area) / 2;
      const areaVariance = areaDiff / avgArea;

      if (areaVariance <= 0.2) {
        reasons.push('Похожая площадь');
      }
    }

    // Bedrooms
    if (
      source.bedrooms !== null &&
      candidate.bedrooms !== null &&
      source.bedrooms === candidate.bedrooms
    ) {
      reasons.push(`${source.bedrooms} спален`);
    }

    // Location
    if (source.city === candidate.city) {
      if (source.district && source.district === candidate.district) {
        reasons.push(`Тот же район (${source.district})`);
      } else {
        reasons.push(`Тот же город (${source.city})`);
      }
    }

    // Geo-proximity
    if (
      source.latitude &&
      source.longitude &&
      candidate.latitude &&
      candidate.longitude
    ) {
      const distance = this.calculateDistance(
        source.latitude,
        source.longitude,
        candidate.latitude,
        candidate.longitude,
      );

      if (distance <= 1) {
        reasons.push('В радиусе 1 км');
      } else if (distance <= 3) {
        reasons.push('В радиусе 3 км');
      }
    }

    // Building class
    if (
      source.buildingClass &&
      source.buildingClass === candidate.buildingClass
    ) {
      reasons.push('Тот же класс здания');
    }

    return reasons;
  }
}
