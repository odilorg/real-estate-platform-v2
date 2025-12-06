import { api } from './api';
import type { RegisterDto, LoginDto, AuthResponseDto } from '@repo/shared';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
};

export async function login(data: LoginDto): Promise<AuthResponseDto> {
  const response = await api.post<AuthResponseDto>('/auth/login', data);
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
  }
  return response;
}

export async function register(data: RegisterDto): Promise<AuthResponseDto> {
  const response = await api.post<AuthResponseDto>('/auth/register', data);
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
  }
  return response;
}

export async function getMe(): Promise<User> {
  return api.get<User>('/auth/me');
}

export function logout(): void {
  localStorage.removeItem('token');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
