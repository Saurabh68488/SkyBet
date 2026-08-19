// ============================================
// User Types
// ============================================

export enum Role {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  playerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithBalance extends User {
  wallet: {
    balance: number;
  } | null;
}

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  phone?: string;
  role?: Role;
  status?: UserStatus;
  initialBalance?: number;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  status?: UserStatus;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
