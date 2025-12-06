import { z } from 'zod';
import {
  PropertyType,
  ListingType,
  PropertyStatus,
  BuildingType,
  BuildingClass,
  RenovationType,
  ParkingType,
} from '../constants';

// Auth DTOs
export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDto>;

export const AuthResponseDto = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['USER', 'AGENT', 'ADMIN']),
  }),
});
export type AuthResponseDto = z.infer<typeof AuthResponseDto>;

// Property DTOs
export const CreatePropertyDto = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  price: z.number().positive(),
  propertyType: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),

  // Location
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  country: z.string().default('Uzbekistan'),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  district: z.string().optional(),
  nearestMetro: z.string().optional(),
  metroDistance: z.number().optional(),

  // Property details
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area: z.number().positive().optional(),
  livingArea: z.number().positive().optional(),
  kitchenArea: z.number().positive().optional(),
  rooms: z.number().int().min(0).optional(),

  // Building info
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  floor: z.number().int().min(0).optional(),
  totalFloors: z.number().int().min(1).optional(),
  ceilingHeight: z.number().positive().optional(),

  // Features
  parking: z.number().int().min(0).optional(),
  parkingType: z.nativeEnum(ParkingType).optional(),
  balcony: z.number().int().min(0).optional(),
  loggia: z.number().int().min(0).optional(),

  // Building characteristics
  buildingType: z.nativeEnum(BuildingType).optional(),
  buildingClass: z.nativeEnum(BuildingClass).optional(),
  buildingName: z.string().optional(),
  hasGarbageChute: z.boolean().default(false),
  hasConcierge: z.boolean().default(false),
  hasGatedArea: z.boolean().default(false),

  // Apartment condition
  renovation: z.nativeEnum(RenovationType).optional(),
  windowView: z.string().optional(),
  bathroomType: z.string().optional(),
  furnished: z.string().optional(),

  // Images and amenities
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
});
export type CreatePropertyDto = z.infer<typeof CreatePropertyDto>;

export const UpdatePropertyDto = CreatePropertyDto.partial();
export type UpdatePropertyDto = z.infer<typeof UpdatePropertyDto>;

export const PropertyFilterDto = z.object({
  city: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  bedrooms: z.number().optional(),
  buildingClass: z.nativeEnum(BuildingClass).optional(),
  renovation: z.nativeEnum(RenovationType).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'createdAt', 'area']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type PropertyFilterDto = z.infer<typeof PropertyFilterDto>;

// Review DTOs
export const CreateReviewDto = z.object({
  propertyId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});
export type CreateReviewDto = z.infer<typeof CreateReviewDto>;

// Message DTOs
export const SendMessageDto = z.object({
  conversationId: z.string().optional(),
  propertyId: z.string(),
  recipientId: z.string(),
  content: z.string().min(1).max(2000),
});
export type SendMessageDto = z.infer<typeof SendMessageDto>;

// Viewing DTOs
export const CreateViewingDto = z.object({
  propertyId: z.string(),
  date: z.string().datetime(),
  time: z.string(),
  message: z.string().max(500).optional(),
});
export type CreateViewingDto = z.infer<typeof CreateViewingDto>;

// Pagination Response
export const PaginatedResponseDto = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
