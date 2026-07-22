import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "./theme/ThemeModeContext.js";
import { AuthProvider } from "./auth/AuthContext.js";
import { queryClient } from "./lib/queryClient.js";
import { router } from "./router.js";

export function App() {
  return (
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>
  );
}
