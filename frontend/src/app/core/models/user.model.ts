export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
