"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // For implicit flow, tokens are in the URL hash
      // The Supabase client will automatically detect and process them
      // when we call getSession or any auth method

      // Give a moment for the client to process the URL hash
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if we have a session now
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        setStatus(`Error: ${error.message}`);
        setTimeout(() => {
          router.push(`/login?error=admin_error&message=${encodeURIComponent(error.message)}`);
        }, 2000);
        return;
      }

      if (session) {
        console.log("Session found!", session.user.email);
        setStatus("Success! Redirecting to dashboard...");
        router.push("/dashboard");
        return;
      }

      // No session yet - check URL for errors
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error");
      const hashErrorDesc = hashParams.get("error_description");

      if (hashError) {
        setStatus(`Error: ${hashErrorDesc || hashError}`);
        setTimeout(() => {
          router.push(`/login?error=admin_error&message=${encodeURIComponent(hashErrorDesc || hashError)}`);
        }, 2000);
        return;
      }

      // Still no session - might need to wait for onAuthStateChange
      setStatus("Waiting for authentication...");
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event);
        if (event === 'SIGNED_IN' && session) {
          setStatus("Success! Redirecting...");
          subscription.unsubscribe();
          router.push("/dashboard");
        }
      });

      // Timeout fallback
      setTimeout(() => {
        setStatus("Authentication timeout. Please try again.");
        subscription.unsubscribe();
        router.push("/login?error=admin_error&message=" + encodeURIComponent("Authentication timeout"));
      }, 10000);
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">{status}</p>
      </div>
    </div>
  );
}
