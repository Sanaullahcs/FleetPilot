"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface NavLoadingContextValue {
  isPending: boolean;
  startNav: () => void;
}

const NavLoadingContext = createContext<NavLoadingContextValue>({
  isPending: false,
  startNav: () => {},
});

export function NavLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  const startNav = useCallback(() => {
    setIsPending(true);
  }, []);

  useEffect(() => {
    setIsPending(false);
  }, [pathname]);

  return (
    <NavLoadingContext.Provider value={{ isPending, startNav }}>
      {children}
    </NavLoadingContext.Provider>
  );
}

export function useNavLoading() {
  return useContext(NavLoadingContext);
}
