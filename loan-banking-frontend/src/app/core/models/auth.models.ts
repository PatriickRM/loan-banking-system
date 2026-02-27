export type UserRole = 'ADMIN' | 'ANALISTA' | 'CLIENTE';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  // Auth fields
  username: string;
  email: string;
  password: string;
  // Customer fields
  dni: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth: string; // ISO: "YYYY-MM-DD"
  address?: string;
  city?: string;
  country?: string;
  monthlyIncome?: number;
  workExperienceYears?: number;
  occupation?: string;
  employerName?: string;
  documentType?: 'DNI' | 'PASSPORT' | 'INCOME_PROOF' | 'ADDRESS_PROOF';
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  username: string;
  email: string;
  roles: string[];
}

// JWT payload
export interface DecodedToken {
  sub: string;        // username
  userId: number;
  customerId: number;
  email: string;
  emailVerified: boolean;
  roles: string[]
  iat: number;
  exp: number;
}

export interface AuthUser {
  username: string;
  email: string;
  roles: UserRole[];
  customerId: number | null;
  userId: number | null;
}