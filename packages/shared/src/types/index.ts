import type {
  UserRole,
  PropertyType,
  ListingType,
  PropertyStatus,
  BuildingType,
  BuildingClass,
  RenovationType,
  ParkingType,
  ViewingStatus,
} from '../constants';

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User
export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  banned: boolean;
  banReason?: string;
}

// Property
export interface Property extends BaseEntity {
  userId: string;
  title: string;
  description: string;
  price: number;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;

  // Location
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  nearestMetro?: string;
  metroDistance?: number;

  // Property details
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  livingArea?: number;
  kitchenArea?: number;
  rooms?: number;

  // Building info
  yearBuilt?: number;
  floor?: number;
  totalFloors?: number;
  ceilingHeight?: number;

  // Features
  parking?: number;
  parkingType?: ParkingType;
  balcony?: number;
  loggia?: number;

  // Building characteristics
  buildingType?: BuildingType;
  buildingClass?: BuildingClass;
  buildingName?: string;
  elevatorPassenger?: number;
  elevatorCargo?: number;
  hasGarbageChute: boolean;
  hasConcierge: boolean;
  hasGatedArea: boolean;

  // Apartment condition
  renovation?: RenovationType;
  windowView?: string;
  bathroomType?: string;
  furnished?: string;

  // Metadata
  views: number;
  featured: boolean;
  verified: boolean;

  // Relations
  images?: PropertyImage[];
  amenities?: PropertyAmenity[];
}

// Property Image
export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  order: number;
  isPrimary: boolean;
  createdAt: Date;
}

// Property Amenity
export interface PropertyAmenity {
  id: string;
  propertyId: string;
  amenity: string;
}

// Favorite
export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
  property?: Property;
}

// Review
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation
export interface Conversation {
  id: string;
  propertyId: string;
  participant1: string;
  participant2: string;
  lastMessageAt: Date;
  createdAt: Date;
  messages?: Message[];
}

// Message
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

// Viewing
export interface Viewing {
  id: string;
  propertyId: string;
  requesterId: string;
  ownerId: string;
  date: Date;
  time: string;
  status: ViewingStatus;
  message?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agency
export interface Agency extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  yearsOnPlatform: number;
  verified: boolean;
}

// Agent
export interface Agent extends BaseEntity {
  userId: string;
  agencyId?: string;
  firstName: string;
  lastName: string;
  photo?: string;
  bio?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  licenseNumber?: string;
  specializations?: string[];
  languages?: string[];
  areasServed?: string[];
  yearsExperience: number;
  totalDeals: number;
  verified: boolean;
  superAgent: boolean;
  responseTime?: string;
  rating: number;
  reviewCount: number;
  showPhone: boolean;
  showEmail: boolean;
}

// Saved Search
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, unknown>;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
