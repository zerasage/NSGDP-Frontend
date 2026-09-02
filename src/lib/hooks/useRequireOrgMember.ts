"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isOrgMember } from "@/lib/auth/portal-access";

/** Redirect registered/public users away from org-member-only dashboard routes. */
export function useRequireOrgMember(redirectTo = "/dashboard") {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const allowed = !!user && isOrgMember(user.role);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user && !isOrgMember(user.role)) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, isAuthenticated, router, redirectTo]);

  return { user, isLoading, allowed };
}
