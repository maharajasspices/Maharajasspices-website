import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SENIOR_EMPLOYEE_EMAILS = [
  "marketing@maharajasspices.co.za",
  "desmond.amos@marajasspices.co.za",
] as const;

const ADMIN_EMAILS = [
  "bradley@maharajasspices.co.za",
  "zulaigah.benjamin@maharajasspices.co.za",
] as const;

type PortalAccessState = {
  isLoading: boolean;
  isLoggedIn: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  isSeniorEmployee: boolean;
  user: any;
  likedCount: number;
  refresh: () => Promise<void>;
};

export const usePortalAccess = (): PortalAccessState => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeniorEmployee, setIsSeniorEmployee] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [likedCount, setLikedCount] = useState(0);

  const loadAccess = useCallback(async (sessionOverride?: any | null) => {
    setIsLoading(true);

    try {
      const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
      const currentUser = session?.user ?? null;

      setIsLoggedIn(Boolean(currentUser));
      setUser(currentUser);

      if (!currentUser) {
        setLikedCount(0);
        setIsEmployee(false);
        setIsAdmin(false);
        setIsSeniorEmployee(false);
        return;
      }

      const [likesResult, employeeRoleResult, adminRoleResult, profileResult] = await Promise.allSettled([
        supabase
          .from("product_likes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id),
        supabase.rpc("has_role", { _user_id: currentUser.id, _role: "employee" }),
        supabase.rpc("has_role", { _user_id: currentUser.id, _role: "admin" }),
        supabase.from("profiles").select("email").eq("id", currentUser.id).maybeSingle(),
      ]);

      const likedCountValue = likesResult.status === "fulfilled" ? (likesResult.value.count ?? 0) : 0;
      const employeeRole = employeeRoleResult.status === "fulfilled" ? Boolean(employeeRoleResult.value.data) : false;
      const adminRole = adminRoleResult.status === "fulfilled" ? Boolean(adminRoleResult.value.data) : false;
      const profileEmail = profileResult.status === "fulfilled" ? profileResult.value.data?.email ?? "" : "";
      const normalizedEmail = (currentUser.email || profileEmail || "").toLowerCase();
      const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail as (typeof ADMIN_EMAILS)[number]);

      setLikedCount(likedCountValue);
      setIsAdmin(adminRole || isAdminEmail);
      setIsEmployee(employeeRole || adminRole || isAdminEmail);
      setIsSeniorEmployee(SENIOR_EMPLOYEE_EMAILS.includes(normalizedEmail as (typeof SENIOR_EMPLOYEE_EMAILS)[number]));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAccess(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAccess]);

  return {
    isLoading,
    isLoggedIn,
    isEmployee,
    isAdmin,
    isSeniorEmployee,
    user,
    likedCount,
    refresh: () => loadAccess(),
  };
};