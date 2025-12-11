import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { PropertyType, ListingType, PropertyStatus } from '@repo/database';

export interface ValuationInput {
  propertyType: PropertyType;
  listingType: ListingType;
  city: string;
  district?: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  buildingClass?: string;
  renovation?: string;
  hasBalcony?: boolean;
  parkingType?: string;
  latitude?: number;
  longitude?: number;
}

export interface ValuationResult {
  estimatedPrice: number;
  priceRange: {
    low: number;
    high: number;
  };
  confidence: number; // 0-100
  comparableCount: number;
  marketInsights: {
    averagePricePerSqm: number;
    medianPricePerSqm: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  };
  comparableProperties: Array<{
    id: string;
    title: string;
    price: number;
    pricePerSqm: number;
    area: number;
    similarity: number;
    distance?: number;
  }>;
}

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate automated property valuation based on comparable properties
   */
  async calculateValuation(input: ValuationInput): Promise<ValuationResult> {
    this.logger.log(`Calculating valuation for ${input.propertyType} in ${input.city}`);

    // Find comparable properties
    const comparables = await this.findComparableProperties(input);

    if (comparables.length === 0) {
      throw new Error('Not enough comparable properties found for valuation');
    }

    // Calculate price per square meter for comparables
    const pricesPerSqm = comparables.map(p => p.price / (p.area || 1));
    const averagePricePerSqm = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
    const medianPricePerSqm = this.calculateMedian(pricesPerSqm);

    // Calculate similarity scores and weights
    const weightedComparables = comparables.map(comp => ({
      ...comp,
      similarity: this.calculateSimilarity(input, comp),
      pricePerSqm: comp.price / (comp.area || 1),
    }));

    // Sort by similarity (highest first)
    weightedComparables.sort((a, b) => b.similarity - a.similarity);

    // Take top 10 most similar properties for valuation
    const topComparables = weightedComparables.slice(0, 10);

    // Calculate weighted average price per sqm
    const totalWeight = topComparables.reduce((sum, c) => sum + c.similarity, 0);
    const weightedPricePerSqm = topComparables.reduce(
      (sum, c) => sum + (c.pricePerSqm * c.similarity),
      0
    ) / totalWeight;

    // Estimate price based on input area
    const estimatedPrice = Math.round(weightedPricePerSqm * input.area);

    // Calculate price range (±15%)
    const priceRange = {
      low: Math.round(estimatedPrice * 0.85),
      high: Math.round(estimatedPrice * 1.15),
    };

    // Calculate confidence based on number of comparables and similarity
    const avgSimilarity = topComparables.reduce((sum, c) => sum + c.similarity, 0) / topComparables.length;
    const confidence = Math.min(100, Math.round(
      (comparables.length / 20) * 40 + // More comparables = higher confidence (max 40)
      avgSimilarity * 60 // Higher similarity = higher confidence (max 60)
    ));

    // Analyze market trend
    const marketInsights = await this.analyzeMarketTrend(input);

    // Calculate distances if coordinates provided
    const comparablePropertiesWithDistance = topComparables.map(comp => {
      let distance: number | undefined;
      if (input.latitude && input.longitude && comp.latitude && comp.longitude) {
        distance = this.calculateDistance(
          input.latitude,
          input.longitude,
          comp.latitude,
          comp.longitude
        );
      }

      return {
        id: comp.id,
        title: comp.title,
        price: comp.price,
        pricePerSqm: Math.round(comp.pricePerSqm),
        area: comp.area || 0,
        similarity: Math.round(comp.similarity * 100),
        distance: distance !== undefined ? Math.round(distance * 1000) : undefined, // Convert to meters
      };
    });

    return {
      estimatedPrice,
      priceRange,
      confidence,
      comparableCount: comparables.length,
      marketInsights: {
        averagePricePerSqm: Math.round(averagePricePerSqm),
        medianPricePerSqm: Math.round(medianPricePerSqm),
        trend: marketInsights.trend,
        trendPercentage: marketInsights.trendPercentage,
      },
      comparableProperties: comparablePropertiesWithDistance,
    };
  }

  /**
   * Find comparable properties for valuation
   */
  private async findComparableProperties(input: ValuationInput) {
    const where: any = {
      propertyType: input.propertyType,
      listingType: input.listingType,
      city: input.city,
      status: PropertyStatus.ACTIVE,
      area: {
        gte: input.area * 0.7, // ±30% area
        lte: input.area * 1.3,
      },
    };

    // Add optional filters
    if (input.district) where.district = input.district;
    if (input.bedrooms) {
      where.bedrooms = {
        gte: Math.max(1, input.bedrooms - 1),
        lte: input.bedrooms + 1,
      };
    }
    if (input.buildingClass) where.buildingClass = input.buildingClass;

    // Fetch properties
    const properties = await this.prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        floor: true,
        totalFloors: true,
        yearBuilt: true,
        buildingClass: true,
        renovation: true,
        balcony: true,
        parkingType: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50 comparables
    });

    return properties;
  }

  /**
   * Calculate similarity score between input and comparable property (0-1)
   */
  private calculateSimilarity(input: ValuationInput, comparable: any): number {
    let score = 0;
    let _factors = 0;

    // Area similarity (weight: 25%)
    const areaDiff = Math.abs(input.area - comparable.area) / input.area;
    score += Math.max(0, 1 - areaDiff) * 0.25;
    _factors++;

    // Bedroom similarity (weight: 15%)
    if (input.bedrooms && comparable.bedrooms) {
      const bedroomDiff = Math.abs(input.bedrooms - comparable.bedrooms);
      score += Math.max(0, 1 - bedroomDiff / 3) * 0.15;
      _factors++;
    }

    // District match (weight: 15%)
    if (input.district && comparable.district) {
      score += (input.district === comparable.district ? 0.15 : 0);
      _factors++;
    }

    // Building class match (weight: 10%)
    if (input.buildingClass && comparable.buildingClass) {
      score += (input.buildingClass === comparable.buildingClass ? 0.10 : 0);
      _factors++;
    }

    // Renovation match (weight: 10%)
    if (input.renovation && comparable.renovation) {
      score += (input.renovation === comparable.renovation ? 0.10 : 0);
      _factors++;
    }

    // Year built similarity (weight: 10%)
    if (input.yearBuilt && comparable.yearBuilt) {
      const yearDiff = Math.abs(input.yearBuilt - comparable.yearBuilt);
      score += Math.max(0, 1 - yearDiff / 50) * 0.10;
      _factors++;
    }

    // Floor similarity (weight: 5%)
    if (input.floor && comparable.floor) {
      const floorDiff = Math.abs(input.floor - comparable.floor);
      score += Math.max(0, 1 - floorDiff / 10) * 0.05;
      _factors++;
    }

    // Parking match (weight: 5%)
    if (input.parkingType && comparable.parkingType) {
      score += (input.parkingType === comparable.parkingType ? 0.05 : 0);
      _factors++;
    }

    // Location proximity (weight: 5%)
    if (input.latitude && input.longitude && comparable.latitude && comparable.longitude) {
      const distance = this.calculateDistance(
        input.latitude,
        input.longitude,
        comparable.latitude,
        comparable.longitude
      );
      score += Math.max(0, 1 - distance / 5) * 0.05; // 5km threshold
      _factors++;
    }

    return score;
  }

  /**
   * Analyze market trend for the given property type and location
   */
  private async analyzeMarketTrend(input: ValuationInput) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const where: any = {
      propertyType: input.propertyType,
      listingType: input.listingType,
      city: input.city,
      status: PropertyStatus.ACTIVE,
    };

    if (input.district) where.district = input.district;

    // Get recent properties (last 3 months)
    const recentProperties = await this.prisma.property.findMany({
      where: {
        ...where,
        createdAt: { gte: threeMonthsAgo },
      },
      select: { price: true, area: true },
    });

    // Get older properties (3-6 months ago)
    const olderProperties = await this.prisma.property.findMany({
      where: {
        ...where,
        createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
      },
      select: { price: true, area: true },
    });

    const recentAvgPricePerSqm = recentProperties.length > 0
      ? recentProperties.reduce((sum, p) => sum + p.price / (p.area || 1), 0) / recentProperties.length
      : 0;

    const olderAvgPricePerSqm = olderProperties.length > 0
      ? olderProperties.reduce((sum, p) => sum + p.price / (p.area || 1), 0) / olderProperties.length
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (recentAvgPricePerSqm > 0 && olderAvgPricePerSqm > 0) {
      const change = ((recentAvgPricePerSqm - olderAvgPricePerSqm) / olderAvgPricePerSqm) * 100;
      trendPercentage = Math.round(change * 10) / 10;

      if (change > 2) trend = 'increasing';
      else if (change < -2) trend = 'decreasing';
    }

    return { trend, trendPercentage };
  }

  /**
   * Calculate distance between two coordinates in kilometers using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
