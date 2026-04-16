// routes.ts
import { Role } from "./validaton-schema";

export const DEFAULT_LOGIN_REDIRECT: string = "/dashboard";

// Prefix for API authentication routes.
export const apiAuthPrefix: string = "/api/auth";

// Routes which are accessible to all.
export const publicRoutes: string[] = [
  "/",
  "/auth/verify-email",
  "/investors",
  "/investors/success",
  "/startups",
  "/startups/success",
  "/cohort",
  "/mentorship",
  "/profile",
  "",
];

// APIs which are accessible to all.
export const publicApis: string[] = [
  "/api/apply",
  "/api/investors/apply",
];

// Routes which are used for authentication.
// NOTE: /auth/change-password is intentionally NOT in authRoutes.
// It is a protected route (requires login) so logged-in users
// with mustChangePassword=true can still reach it.
export const authRoutes: string[] = [
  "/auth/error",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// The forced-change route — accessible when logged in but not in authRoutes
export const CHANGE_PASSWORD_ROUTE = "/auth/change-password";

// Routes which are protected with different roles
export const protectedRoutes: Record<string, Role[]> = {
  "^/dashboard/admin(/.*)?$":    ["ADMIN"],
  "^/dashboard/startup(/.*)?$":  ["STARTUP"],
  "^/dashboard/investor(/.*)?$": ["INVESTOR"],
  "^/dashboard/mentor(/.*)?$":   ["MENTOR"],
};