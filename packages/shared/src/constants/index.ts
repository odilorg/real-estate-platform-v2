// User Roles
export const UserRole = {
  USER: 'USER',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Property Types
export const PropertyType = {
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  CONDO: 'CONDO',
  TOWNHOUSE: 'TOWNHOUSE',
  LAND: 'LAND',
  COMMERCIAL: 'COMMERCIAL',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

// Listing Types
export const ListingType = {
  SALE: 'SALE',
  RENT: 'RENT',
  DAILY_RENT: 'DAILY_RENT',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

// Property Status
export const PropertyStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SOLD: 'SOLD',
  RENTED: 'RENTED',
  INACTIVE: 'INACTIVE',
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

// Building Types
export const BuildingType = {
  BRICK: 'BRICK',
  PANEL: 'PANEL',
  MONOLITHIC: 'MONOLITHIC',
  WOOD: 'WOOD',
  BLOCK: 'BLOCK',
} as const;
export type BuildingType = (typeof BuildingType)[keyof typeof BuildingType];

// Building Class
export const BuildingClass = {
  ECONOMY: 'ECONOMY',
  COMFORT: 'COMFORT',
  BUSINESS: 'BUSINESS',
  ELITE: 'ELITE',
} as const;
export type BuildingClass = (typeof BuildingClass)[keyof typeof BuildingClass];

// Renovation Types
export const RenovationType = {
  NONE: 'NONE',
  COSMETIC: 'COSMETIC',
  EURO: 'EURO',
  DESIGNER: 'DESIGNER',
  NEEDS_REPAIR: 'NEEDS_REPAIR',
} as const;
export type RenovationType = (typeof RenovationType)[keyof typeof RenovationType];

// Parking Types
export const ParkingType = {
  STREET: 'STREET',
  UNDERGROUND: 'UNDERGROUND',
  GARAGE: 'GARAGE',
  MULTI_LEVEL: 'MULTI_LEVEL',
} as const;
export type ParkingType = (typeof ParkingType)[keyof typeof ParkingType];

// Viewing Status
export const ViewingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type ViewingStatus = (typeof ViewingStatus)[keyof typeof ViewingStatus];
