"use server";

import { auth, unstable_update } from "@/auth";
import { db } from "@/db";
import { UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      // .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      // .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePassword(
  values: z.infer<typeof ChangePasswordSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const validation = ChangePasswordSchema.safeParse(values);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { currentPassword, newPassword } = validation.data;

  // Fetch current user
  const [user] = await db
    .select({ id: UsersTable.id, password: UsersTable.password })
    .from(UsersTable)
    .where(eq(UsersTable.id, session.user.id))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  // Verify current (temp) password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  // Prevent reusing the same password
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return { error: "New password must be different from your current password" };
  }

  const hashedNew = await bcrypt.hash(newPassword, 10);

  // Update DB
  await db
    .update(UsersTable)
    .set({
      password:           hashedNew,
      mustChangePassword: false,
      updatedAt:          new Date(),
    })
    .where(eq(UsersTable.id, user.id));

  // Force the JWT cookie to be rewritten with mustChangePassword: false.
  // Without this, the middleware reads the stale token from the cookie and
  // keeps redirecting back to /auth/change-password.
 await unstable_update({ user: { mustChangePassword: false } } as any);
  return { success: "Password updated successfully!" };
}