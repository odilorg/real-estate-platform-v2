import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsInt, Min } from 'class-validator';

export class CreateListingDto {
  // Property basic info
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsEnum(['YE', 'UZS'])
  currency!: string;

  @IsEnum(['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'LAND', 'COMMERCIAL'])
  propertyType!: string;

  @IsEnum(['SALE', 'RENT_LONG', 'RENT_DAILY'])
  listingType!: string;

  @IsOptional()
  @IsEnum(['NEW_BUILDING', 'SECONDARY'])
  marketType?: string;

  // Location
  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  mahalla?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  // Property details
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalFloors?: number;

  @IsOptional()
  @IsEnum(['BRICK', 'PANEL', 'MONOLITHIC', 'WOOD', 'BLOCK'])
  buildingType?: string;

  @IsOptional()
  @IsEnum(['ECONOMY', 'COMFORT', 'BUSINESS', 'ELITE'])
  buildingClass?: string;

  @IsOptional()
  @IsEnum(['NONE', 'COSMETIC', 'EURO', 'DESIGNER', 'NEEDS_REPAIR'])
  renovation?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearBuilt?: number;

  @IsOptional()
  @IsArray()
  amenities?: string[];

  // Individual owner details
  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsBoolean()
  ownerIsAnonymous?: boolean;

  // Images
  @IsOptional()
  @IsArray()
  images?: string[]; // URLs

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(['ACTIVE', 'PENDING', 'SOLD', 'RENTED', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsBoolean()
  ownerIsAnonymous?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;
}

export class DeactivateListingDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class MarkSoldDto {
  @IsNumber()
  @Min(0)
  soldPrice!: number;

  @IsOptional()
  @IsString()
  soldDate?: string; // ISO date

  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
