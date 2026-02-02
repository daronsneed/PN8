import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// Use relative URLs when on same domain (Vercel deployment)
const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

export const authClient = createAuthClient({
  baseURL: backendUrl || undefined,
  plugins: [emailOTPClient()],
  fetchOptions: {
    credentials: "include", // IMPORTANT: Send cookies with cross-origin requests
  },
});

// Export the useSession hook for React components
export const { useSession, signOut } = authClient;
