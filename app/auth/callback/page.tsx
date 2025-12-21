"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // Get the code from URL query params
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      // Check for OAuth errors
      if (errorParam) {
        console.error("OAuth error:", errorParam, errorDescription);
        router.push(`/login?error=admin_error&message=${encodeURIComponent(errorDescription || errorParam)}`);
        return;
      }

      // If we have a code, exchange it for a session
      if (code) {
        setStatus("Exchanging code for session...");
        
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Exchange error:", exchangeError.message);
          router.push(`/login?error=admin_error&message=${encodeURIComponent(exchangeError.message)}`);
          return;
        }

        setStatus("Success! Redirecting...");
        router.push("/dashboard");
        return;
      }

      // No code - check if we already have a session (maybe from hash fragment)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push("/dashboard");
        return;
      }

      // Nothing worked
      router.push("/login?error=admin_error&message=" + encodeURIComponent("No authentication code received"));
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">{status}</p>
      </div>
    </div>
  );
}
