import { api } from './api';
import type {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  PhoneRegisterRequestDto,
  PhoneRegisterVerifyDto,
  PhoneLoginRequestDto,
  PhoneLoginVerifyDto,
} from '@repo/shared';

export type User = {
  id: string;
  email?: string;
  phone?: string;
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

export async function logout(): Promise<void> {
  try {
    // Call backend to clear HTTP-only cookie
    await api.post('/auth/logout', {});
  } catch (error) {
    console.error('Failed to call logout endpoint:', error);
    // Continue with logout even if API call fails
  } finally {
    // Always clear localStorage token
    localStorage.removeItem('token');
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Phone Authentication Functions

export async function requestPhoneRegistrationOtp(
  data: PhoneRegisterRequestDto,
): Promise<{ message: string; phone: string }> {
  return api.post<{ message: string; phone: string }>(
    '/auth/phone/register/request',
    data,
  );
}

export async function verifyPhoneRegistration(
  data: PhoneRegisterVerifyDto,
): Promise<AuthResponseDto> {
  const response = await api.post<AuthResponseDto>(
    '/auth/phone/register/verify',
    data,
  );
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
  }
  return response;
}

export async function requestPhoneLoginOtp(
  data: PhoneLoginRequestDto,
): Promise<{ message: string; phone: string }> {
  return api.post<{ message: string; phone: string }>(
    '/auth/phone/login/request',
    data,
  );
}

export async function verifyPhoneLogin(
  data: PhoneLoginVerifyDto,
): Promise<AuthResponseDto> {
  const response = await api.post<AuthResponseDto>(
    '/auth/phone/login/verify',
    data,
  );
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
  }
  return response;
}
