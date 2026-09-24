import api from "./api";

export interface User {
  user_id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  name: string;
  email: string;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const response = await api.post("/api/auth/register", {
    name,
    email,
    password,
  });

  return response.data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  localStorage.setItem("access_token", response.data.access_token);

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get("/api/auth/me");

  return response.data;
}

export function logoutUser() {
  localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}