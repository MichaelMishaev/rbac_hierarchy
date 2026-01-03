"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { logPasswordChangeAudit } from "@/lib/audit-logger";

/**
 * Manager resets a subordinate user's password
 * Generates temporary password and forces user to change it on next login
 */
export async function resetUserPasswordByManager(userId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify manager has permission to reset this user
  const canReset = await verifyManagerCanResetUser(session.user.id, userId);
  if (!canReset) {
    throw new Error("אין לך הרשאה לאפס סיסמה למשתמש זה");
  }

  // Get target user details for logging
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });

  if (!targetUser) {
    throw new Error("משתמש לא נמצא");
  }

  // Generate temporary password (format: abc123)
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Update user with temp password and force change flag
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      requirePasswordChange: true,
    },
  });

  // Log password reset audit
  await logPasswordChangeAudit({
    targetUserId: userId,
    targetUserEmail: targetUser.email,
    changedBy: session.user.id!,
    changedByEmail: session.user.email!,
    changedByRole: session.user.role!,
    action: 'PASSWORD_RESET_BY_MANAGER',
  });

  // Log the reset action for audit trail
  console.log(
    `[Password Reset] Manager ${session.user.email} reset password for ${targetUser.email}`
  );

  // Revalidate users page
  revalidatePath("/users");
  revalidatePath(`/he/users`);

  return {
    success: true,
    tempPassword,
    userEmail: targetUser.email,
    userFullName: targetUser.fullName,
  };
}

/**
 * User changes their own password (after forced reset or voluntary)
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "לא מורשה" };
    }

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "משתמש לא נמצא" };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "הסיסמה הזמנית שגויה. אנא ודא שהזנת את הסיסמה הנכונה" };
    }

    // Ensure new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return { success: false, error: "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית" };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and remove force change flag
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        requirePasswordChange: false,
      },
    });

    // Log password change audit
    await logPasswordChangeAudit({
      targetUserId: session.user.id!,
      targetUserEmail: session.user.email!,
      changedBy: session.user.id!,
      changedByEmail: session.user.email!,
      changedByRole: session.user.role!,
      action: 'PASSWORD_CHANGE',
    });

    console.log(`[Password Change] User ${session.user.email} changed their password`);

    return { success: true };
  } catch (error) {
    console.error('[Password Change Error]:', error);
    return { success: false, error: "אירעה שגיאה בשינוי הסיסמה. נסה שנית" };
  }
}

/**
 * Verify if manager has permission to reset target user's password
 * Based on campaign hierarchy
 */
async function verifyManagerCanResetUser(
  managerId: string,
  targetUserId: string
): Promise<boolean> {
  // Don't allow self-reset via manager flow
  if (managerId === targetUserId) {
    return false;
  }

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    include: {
      areaManager: {
        include: {
          cities: true,
        },
      },
      coordinatorOf: true,
      activistCoordinatorOf: true,
    },
  });

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      areaManager: true,
      coordinatorOf: {
        select: {
          cityId: true,
        },
      },
      activistCoordinatorOf: {
        select: {
          cityId: true,
        },
      },
      activistProfile: {
        select: {
          neighborhoodId: true,
          neighborhood: {
            select: {
              cityId: true,
            },
          },
        },
      },
    },
  });

  if (!manager || !targetUser) {
    return false;
  }

  // SuperAdmin can reset anyone (except other SuperAdmins)
  if (manager.isSuperAdmin) {
    // SuperAdmin cannot reset another SuperAdmin
    return !targetUser.isSuperAdmin;
  }

  // Area Manager can reset City Coordinators and Activist Coordinators in their cities
  if (manager.role === "AREA_MANAGER" && manager.areaManager) {
    const managerCityIds = manager.areaManager.cities.map((c) => c.id);

    // Can reset City Coordinators in their area
    if (targetUser.role === "CITY_COORDINATOR") {
      const targetCityIds = targetUser.coordinatorOf.map((c) => c.cityId);
      return targetCityIds.some((id) => managerCityIds.includes(id));
    }

    // Can reset Activist Coordinators in their area
    if (targetUser.role === "ACTIVIST_COORDINATOR") {
      const targetCityIds = targetUser.activistCoordinatorOf.map((a) => a.cityId);
      return targetCityIds.some((id) => managerCityIds.includes(id));
    }

    // Can reset Activists in their area
    if (targetUser.role === "ACTIVIST" && targetUser.activistProfile) {
      const targetCityId = targetUser.activistProfile.neighborhood.cityId;
      return managerCityIds.includes(targetCityId);
    }
  }

  // City Coordinator can reset Activist Coordinators and Activists in their city
  if (manager.role === "CITY_COORDINATOR") {
    const managerCityIds = manager.coordinatorOf.map((c) => c.cityId);

    // Can reset Activist Coordinators in their city
    if (targetUser.role === "ACTIVIST_COORDINATOR") {
      const targetCityIds = targetUser.activistCoordinatorOf.map((a) => a.cityId);
      return targetCityIds.some((id) => managerCityIds.includes(id));
    }

    // Can reset Activists in their city
    if (targetUser.role === "ACTIVIST" && targetUser.activistProfile) {
      const targetCityId = targetUser.activistProfile.neighborhood.cityId;
      return managerCityIds.includes(targetCityId);
    }
  }

  // Activist Coordinator can reset Activists in their assigned neighborhoods
  // ✅ SECURITY FIX (VULN-RBAC-003): Fix M2M query using correct FK
  if (manager.role === "ACTIVIST_COORDINATOR") {
    const activistCoordinator = await prisma.activistCoordinator.findFirst({
      where: { userId: managerId },
    });

    if (!activistCoordinator) {
      return false; // No activist coordinator record found
    }

    const managerNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
      where: { activistCoordinatorId: activistCoordinator.id },
      select: { neighborhoodId: true },
    });

    const managerNeighborhoodIds = managerNeighborhoods.map((n) => n.neighborhoodId);
    const targetNeighborhoodId = targetUser.activistProfile?.neighborhoodId;

    return targetNeighborhoodId
      ? managerNeighborhoodIds.includes(targetNeighborhoodId)
      : false;
  }

  return false;
}

/**
 * Generate temporary password in format: abc123
 * 6 characters, alphanumeric, easy to share verbally
 */
function generateTempPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  // Generate 6 random characters
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}
