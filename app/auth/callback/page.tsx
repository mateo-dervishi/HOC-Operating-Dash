"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // For implicit flow, the session is in the URL hash
      // Supabase client will automatically detect and set it
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        router.push(`/login?error=admin_error&message=${encodeURIComponent(error.message)}`);
        return;
      }

      if (session) {
        // Success - redirect to dashboard
        router.push("/dashboard");
        return;
      }

      // Check URL for errors
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorParam = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      if (errorParam) {
        router.push(`/login?error=admin_error&message=${encodeURIComponent(errorDescription || errorParam)}`);
        return;
      }

      // Try to get session one more time after a brief delay
      // (sometimes the hash needs to be processed)
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          router.push("/dashboard");
        } else {
          router.push("/login?error=admin_error");
        }
      }, 1000);
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
