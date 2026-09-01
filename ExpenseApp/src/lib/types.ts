export type WaterType = 'FRESHWATER' | 'SALTWATER' | 'BRACKISH';
export type TankSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type SocialType = 'SOLITARY' | 'SCHOOLING' | 'AGGRESSIVE';
export type HungerRate = 'SLOW' | 'MEDIUM' | 'FAST';
export type FoodType = 'FLAKES' | 'PELLETS' | 'LIVE' | 'ALGAE';
export type RarityType = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
export type FishStatus = 'ALIVE' | 'DEAD' | 'SOLD';

export interface UserSession {
  id: string;
  email: string;
  username: string;
  cpBalance: number;
}

export interface FishSpeciesData {
  id: string;
  name: string;
  waterType: WaterType;
  minTankSize: TankSize;
  requiresMotor: boolean;
  requiresHeater: boolean;
  social: SocialType;
  predatory: boolean;
  lifespanDays: number;
  hungerRate: HungerRate;
  foodType: FoodType;
  spaceUnits: number;
  basePrice: number;
  sellPrice: number;
  breedEligible: boolean;
  gestationHours: number;
  rarity: RarityType;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  finShape: string;
  sizeScale: number;
}

export interface FishData {
  id: string;
  userId: string;
  tankId: string;
  speciesId: string;
  nickname: string;
  sex: 'MALE' | 'FEMALE';
  status: FishStatus;
  hunger: number;
  health: number;
  bornAt: string;
  ageDays?: number;
  lastFedAt: string;
  lastCalculatedAt: string;
  causeOfDeath?: string | null;
  isBreeding: boolean;
  breedingPartnerId?: string | null;
  breedingStartedAt?: string | null;
  isListed?: boolean;
  species: FishSpeciesData;
}

export interface TankData {
  id: string;
  userId: string;
  name: string;
  size: TankSize;
  capacity: number;
  waterType: WaterType;
  hasMotor: boolean;
  hasHeater: boolean;
  cleanliness: number;
  lastCleanedAt: string;
  lastCalculatedAt: string;
  createdAt: string;
  fish: FishData[];
  capacityUsed?: number;
  hasDangerFish?: boolean;
}

export interface FoodInventoryData {
  id?: string;
  foodType: FoodType;
  quantity: number;
  maxQuantity?: number;
  percentage?: number;
  percentageRemaining?: number;
}

export interface CPTransactionData {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface MarketplaceListingData {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    username: string;
  };
  fishId: string;
  fish: FishData;
  price: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  listedAt: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export interface ShopFoodItem {
  id: string;
  name: string;
  foodType: FoodType;
  quantity: number; // e.g. 20 servings
  price: number; // CP
  description: string;
  icon: string;
}

export interface ShopTankItem {
  size: TankSize;
  name: string;
  capacity: number;
  price: number;
  description: string;
}
