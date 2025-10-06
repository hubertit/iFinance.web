export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
  gpsCoordinates?: string;
  businessType: string;
  cattleCount: number;
  dailyProduction: number;
  farmType: string;
  collectionSchedule: string;
  sellingPricePerLiter: number;
  qualityGrades: string;
  paymentMethod: string;
  bankAccount?: string;
  mobileMoneyNumber?: string;
  idNumber?: string;
  notes?: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  phone: string;
  email?: string;
  location: string;
  gpsCoordinates?: string;
  businessType: string;
  cattleCount: number;
  dailyProduction: number;
  farmType: string;
  collectionSchedule: string;
  sellingPricePerLiter: number;
  qualityGrades: string;
  paymentMethod: string;
  bankAccount?: string;
  mobileMoneyNumber?: string;
  idNumber?: string;
  notes?: string;
  profilePhoto?: string;
  countryCode?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  gpsCoordinates?: string;
  businessType?: string;
  cattleCount?: number;
  dailyProduction?: number;
  farmType?: string;
  collectionSchedule?: string;
  sellingPricePerLiter?: number;
  qualityGrades?: string;
  paymentMethod?: string;
  bankAccount?: string;
  mobileMoneyNumber?: string;
  idNumber?: string;
  notes?: string;
  profilePhoto?: string;
  isActive?: boolean;
}
