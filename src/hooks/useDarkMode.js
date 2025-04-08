import { useEffect } from "react";

export function useDarkMode(enabled) {
  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [enabled]);
}
