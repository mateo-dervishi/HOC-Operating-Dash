"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // Get the code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        console.error("OAuth error:", error, errorDescription);
        router.push(`/login?error=admin_error&message=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Exchange error:", exchangeError.message);
          router.push(`/login?error=admin_error&message=${encodeURIComponent(exchangeError.message)}`);
          return;
        }

        // Success - redirect to dashboard
        router.push("/dashboard");
        return;
      }

      // No code or error - something went wrong
      router.push("/login?error=admin_error");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Signing you in...</p>
      </div>
    </div>
  );
}

