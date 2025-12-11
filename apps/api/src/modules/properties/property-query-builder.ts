import { Prisma } from '@repo/database';
import {
  PropertyFilterDto,
  Currency,
  EXCHANGE_RATE_UZS_TO_USD,
} from '@repo/shared';

/**
 * Builder class to construct Prisma where clauses for property queries
 * Extracts complex filter logic from the service layer
 */
export class PropertyQueryBuilder {
  private where: Prisma.PropertyWhereInput = {};
  private needsPricePerSqMPostFilter = false;

  constructor(private filters: PropertyFilterDto) {
    this.buildWhereClause();
  }

  private buildWhereClause(): void {
    this.applyStatusFilter();
    this.applySearchFilter();
    this.applyLocationFilters();
    this.applyPropertyTypeFilters();
    this.applyPriceFilter();
    this.applyPricePerSqMFilter();
    this.applyAreaFilter();
    this.applyBedroomsFilter();
    this.applyRoomsFilter();
    this.applyFloorFilters();
    this.applyBuildingFilters();
    this.applyYearBuiltFilter();
    this.applyAmenitiesFilter();
    this.applyBooleanFeatures();
    this.applyListingOptions();
  }

  private applyStatusFilter(): void {
    this.where.status = this.filters.status || 'ACTIVE';
  }

  private applySearchFilter(): void {
    if (this.filters.search) {
      this.where.OR = [
        { title: { contains: this.filters.search, mode: 'insensitive' } },
        { description: { contains: this.filters.search, mode: 'insensitive' } },
        { address: { contains: this.filters.search, mode: 'insensitive' } },
        { city: { contains: this.filters.search, mode: 'insensitive' } },
        { district: { contains: this.filters.search, mode: 'insensitive' } },
        {
          nearestMetro: { contains: this.filters.search, mode: 'insensitive' },
        },
        {
          buildingName: { contains: this.filters.search, mode: 'insensitive' },
        },
        { mahalla: { contains: this.filters.search, mode: 'insensitive' } },
      ];
    }
  }

  private applyLocationFilters(): void {
    if (this.filters.city) {
      this.where.city = { contains: this.filters.city, mode: 'insensitive' };
    }
    if (this.filters.district) {
      this.where.district = {
        contains: this.filters.district,
        mode: 'insensitive',
      };
    }
    if (this.filters.nearestMetro) {
      this.where.nearestMetro = {
        contains: this.filters.nearestMetro,
        mode: 'insensitive',
      };
    }
    if (this.filters.mahalla) {
      this.where.mahalla = {
        contains: this.filters.mahalla,
        mode: 'insensitive',
      };
    }
  }

  private applyPropertyTypeFilters(): void {
    if (this.filters.propertyType) {
      this.where.propertyType = this.filters.propertyType;
    }
    if (this.filters.listingType) {
      this.where.listingType = this.filters.listingType;
    }
  }

  private applyPriceFilter(): void {
    const { minPrice, maxPrice } = this.filters;
    if (minPrice || maxPrice) {
      this.where.priceUsd = {};

      const isUzs = this.filters.currency === Currency.UZS;
      const rate = EXCHANGE_RATE_UZS_TO_USD;

      const filterMin = isUzs && minPrice ? minPrice / rate : minPrice;
      const filterMax = isUzs && maxPrice ? maxPrice / rate : maxPrice;

      if (filterMin) this.where.priceUsd.gte = filterMin;
      if (filterMax) this.where.priceUsd.lte = filterMax;
    }
  }

  private applyPricePerSqMFilter(): void {
    const { minPricePerSqM, maxPricePerSqM } = this.filters;
    if (minPricePerSqM || maxPricePerSqM) {
      // Calculate price per square meter using priceUsd and area
      // This requires post-filtering since Prisma doesn't support computed fields in where clauses
      // We mark this for post-processing
      this.needsPricePerSqMPostFilter = true;
    }
  }

  private applyAreaFilter(): void {
    const { minArea, maxArea } = this.filters;
    if (minArea || maxArea) {
      this.where.area = {};
      if (minArea) this.where.area.gte = minArea;
      if (maxArea) this.where.area.lte = maxArea;
    }
  }

  private applyBedroomsFilter(): void {
    const { bedrooms, minBedrooms, maxBedrooms } = this.filters;
    if (bedrooms !== undefined) {
      this.where.bedrooms = bedrooms;
    } else if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      this.where.bedrooms = {};
      if (minBedrooms !== undefined) this.where.bedrooms.gte = minBedrooms;
      if (maxBedrooms !== undefined) this.where.bedrooms.lte = maxBedrooms;
    }
  }

  private applyRoomsFilter(): void {
    const { rooms, minRooms, maxRooms } = this.filters;
    if (rooms !== undefined) {
      this.where.rooms = rooms;
    } else if (minRooms !== undefined || maxRooms !== undefined) {
      this.where.rooms = {};
      if (minRooms !== undefined) this.where.rooms.gte = minRooms;
      if (maxRooms !== undefined) this.where.rooms.lte = maxRooms;
    }
  }

  private applyFloorFilters(): void {
    const { floor, minFloor, maxFloor, notFirstFloor } = this.filters;

    if (floor !== undefined) {
      this.where.floor = floor;
    } else if (minFloor !== undefined || maxFloor !== undefined) {
      this.where.floor = {};
      if (minFloor !== undefined) this.where.floor.gte = minFloor;
      if (maxFloor !== undefined) this.where.floor.lte = maxFloor;
    }

    if (notFirstFloor) {
      this.where.floor = { ...((this.where.floor as object) || {}), gt: 1 };
    }

    // Note: notLastFloor requires post-filtering since it depends on totalFloors
    // This is handled via needsFloorPostFilter() method
  }

  private applyBuildingFilters(): void {
    if (this.filters.buildingClass) {
      this.where.buildingClass = this.filters.buildingClass;
    }
    if (this.filters.buildingType) {
      this.where.buildingType = this.filters.buildingType;
    }
    if (this.filters.renovation) {
      this.where.renovation = this.filters.renovation;
    }
    if (this.filters.parkingType) {
      this.where.parkingType = this.filters.parkingType;
    }
  }

  private applyYearBuiltFilter(): void {
    const { minYearBuilt, maxYearBuilt } = this.filters;
    if (minYearBuilt || maxYearBuilt) {
      this.where.yearBuilt = {};
      if (minYearBuilt) this.where.yearBuilt.gte = minYearBuilt;
      if (maxYearBuilt) this.where.yearBuilt.lte = maxYearBuilt;
    }
  }

  private applyAmenitiesFilter(): void {
    if (this.filters.amenities && this.filters.amenities.length > 0) {
      this.where.amenities = {
        some: {
          amenity: { in: this.filters.amenities },
        },
      };
    }
  }

  private applyBooleanFeatures(): void {
    if (this.filters.hasBalcony) {
      this.where.balcony = { gt: 0 };
    }
    if (this.filters.hasConcierge) {
      this.where.hasConcierge = true;
    }
    if (this.filters.hasGatedArea) {
      this.where.hasGatedArea = true;
    }
  }

  private applyListingOptions(): void {
    if (this.filters.featured !== undefined) {
      this.where.featured = this.filters.featured;
    }
    if (this.filters.verified !== undefined) {
      this.where.verified = this.filters.verified;
    }
  }

  getWhereClause(): Prisma.PropertyWhereInput {
    return this.where;
  }

  needsGeoFilter(): boolean {
    return !!(
      this.filters.latitude &&
      this.filters.longitude &&
      this.filters.radius
    );
  }

  needsFloorPostFilter(): boolean {
    return !!this.filters.notLastFloor;
  }

  needsPricePerSqMFilter(): boolean {
    return this.needsPricePerSqMPostFilter;
  }

  filterByPricePerSqM(properties: any[]): any[] {
    const { minPricePerSqM, maxPricePerSqM } = this.filters;
    if (!minPricePerSqM && !maxPricePerSqM) {
      return properties;
    }

    return properties.filter((property) => {
      if (!property.priceUsd || !property.area || property.area === 0) {
        return false;
      }

      const pricePerSqM = property.priceUsd / property.area;

      if (minPricePerSqM && pricePerSqM < minPricePerSqM) {
        return false;
      }

      if (maxPricePerSqM && pricePerSqM > maxPricePerSqM) {
        return false;
      }

      return true;
    });
  }
}
