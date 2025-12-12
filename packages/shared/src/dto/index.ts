import { z } from 'zod';
import {
  PropertyType,
  ListingType,
  PropertyStatus,
  BuildingType,
  BuildingClass,
  RenovationType,
  ParkingType,
  Currency,
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
    email: z.string().optional(),
    phone: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['USER', 'AGENT', 'ADMIN']),
  }),
});
export type AuthResponseDto = z.infer<typeof AuthResponseDto>;

// Phone validation schema for Uzbekistan
const UzbekistanPhoneSchema = z
  .string()
  .regex(/^\+998[0-9]{9}$/, 'Phone must be in format +998XXXXXXXXX');

// Phone Authentication DTOs
export const PhoneRegisterRequestDto = z.object({
  phone: UzbekistanPhoneSchema,
});
export type PhoneRegisterRequestDto = z.infer<typeof PhoneRegisterRequestDto>;

export const PhoneRegisterVerifyDto = z.object({
  phone: UzbekistanPhoneSchema,
  code: z.string().length(6).regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
export type PhoneRegisterVerifyDto = z.infer<typeof PhoneRegisterVerifyDto>;

export const PhoneLoginRequestDto = z.object({
  phone: UzbekistanPhoneSchema,
});
export type PhoneLoginRequestDto = z.infer<typeof PhoneLoginRequestDto>;

export const PhoneLoginVerifyDto = z.object({
  phone: UzbekistanPhoneSchema,
  code: z.string().length(6).regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
});
export type PhoneLoginVerifyDto = z.infer<typeof PhoneLoginVerifyDto>;

export const SetPasswordDto = z.object({
  password: z.string().min(8),
});
export type SetPasswordDto = z.infer<typeof SetPasswordDto>;

// Property DTOs
export const CreatePropertyDto = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  price: z.number().positive(),
  currency: z.nativeEnum(Currency).default(Currency.YE),
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
  mahalla: z.string().optional(),
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
  // Full-text search
  search: z.string().optional(),

  // Location filters
  city: z.string().optional(),
  district: z.string().optional(),
  mahalla: z.string().optional(),
  nearestMetro: z.string().optional(),

  // Geo-location search
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().min(0.1).max(50).optional(), // km

  // Property type filters
  propertyType: z.nativeEnum(PropertyType).optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),

  // Price range
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  currency: z.nativeEnum(Currency).optional(),

  // Area range
  minArea: z.number().optional(),
  maxArea: z.number().optional(),

  // Rooms
  bedrooms: z.number().optional(),
  minBedrooms: z.number().optional(),
  maxBedrooms: z.number().optional(),
  rooms: z.number().optional(),
  minRooms: z.number().optional(),
  maxRooms: z.number().optional(),

  // Floor
  floor: z.number().optional(),
  minFloor: z.number().optional(),
  maxFloor: z.number().optional(),
  notFirstFloor: z.boolean().optional(),
  notLastFloor: z.boolean().optional(),

  // Building filters
  buildingClass: z.nativeEnum(BuildingClass).optional(),
  buildingType: z.nativeEnum(BuildingType).optional(),
  renovation: z.nativeEnum(RenovationType).optional(),
  parkingType: z.nativeEnum(ParkingType).optional(),

  // Year built range
  minYearBuilt: z.number().optional(),
  maxYearBuilt: z.number().optional(),

  // Price per square meter
  minPricePerSqM: z.number().optional(),
  maxPricePerSqM: z.number().optional(),

  // Amenities
  amenities: z.array(z.string()).optional(),

  // Boolean features
  hasBalcony: z.boolean().optional(),
  hasConcierge: z.boolean().optional(),
  hasGatedArea: z.boolean().optional(),

  // Listing options
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),

  // Pagination & sorting
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'createdAt', 'area', 'views', 'rating']).default('createdAt'),
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

// Saved Search DTOs
export const CreateSavedSearchDto = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.any()), // Allow flexible filter structure from frontend
  notificationsEnabled: z.boolean().default(false),
});
export type CreateSavedSearchDto = z.infer<typeof CreateSavedSearchDto>;

export const UpdateSavedSearchDto = CreateSavedSearchDto.partial();
export type UpdateSavedSearchDto = z.infer<typeof UpdateSavedSearchDto>;

// Agent DTOs
export const RegisterAgentDto = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  email: z.string().email(),
  bio: z.string().min(20).max(1000).optional(),
  photo: z.string().url().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  areasServed: z.array(z.string()).default([]),
  yearsExperience: z.number().int().min(0).default(0),
  agencyId: z.string().optional(),
});
export type RegisterAgentDto = z.infer<typeof RegisterAgentDto>;

export const UpdateAgentDto = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(5).max(20).optional(),
  email: z.string().email().optional(),
  bio: z.string().min(20).max(1000).optional(),
  photo: z.string().url().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  areasServed: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
});
export type UpdateAgentDto = z.infer<typeof UpdateAgentDto>;

// Agency DTOs
export const CreateAgencyDto = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});
export type CreateAgencyDto = z.infer<typeof CreateAgencyDto>;

export const UpdateAgencyDto = CreateAgencyDto.partial().omit({ slug: true });
export type UpdateAgencyDto = z.infer<typeof UpdateAgencyDto>;

// Collection DTOs
export const CreateCollectionDto = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // Hex color
  icon: z.string().max(50).optional(),
});
export type CreateCollectionDto = z.infer<typeof CreateCollectionDto>;

export const UpdateCollectionDto = CreateCollectionDto.partial();
export type UpdateCollectionDto = z.infer<typeof UpdateCollectionDto>;

export const AddPropertyToCollectionDto = z.object({
  propertyId: z.string(),
  notes: z.string().max(500).optional(),
});
export type AddPropertyToCollectionDto = z.infer<typeof AddPropertyToCollectionDto>;

// Pagination Response
export const PaginatedResponseDto = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
