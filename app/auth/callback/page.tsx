"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const handleCallback = async () => {
      const addDebug = (msg: string) => {
        console.log(msg);
        setDebugInfo(prev => [...prev, msg]);
      };

      try {
        addDebug("Starting callback handler...");
        
        // Check URL params
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        
        addDebug(`URL: ${url.pathname}${url.search}`);
        addDebug(`Code present: ${!!code}`);
        addDebug(`Error: ${error || 'none'}`);

        if (error) {
          setStatus(`OAuth Error: ${errorDescription || error}`);
          setTimeout(() => {
            router.push(`/login?error=admin_error&message=${encodeURIComponent(errorDescription || error)}`);
          }, 3000);
          return;
        }

        if (!code) {
          // Maybe the session is already set (implicit flow or hash)
          addDebug("No code in URL, checking for existing session...");
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            addDebug("Session found! Redirecting to dashboard...");
            router.push("/dashboard");
            return;
          }
          
          setStatus("No authentication code received");
          setTimeout(() => {
            router.push("/login?error=admin_error&message=" + encodeURIComponent("No code received"));
          }, 3000);
          return;
        }

        // We have a code - try to exchange it
        addDebug("Creating Supabase client...");
        const supabase = createClient();
        
        addDebug("Attempting to exchange code for session...");
        setStatus("Exchanging code for session...");
        
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          addDebug(`Exchange error: ${exchangeError.message}`);
          setStatus(`Error: ${exchangeError.message}`);
          setTimeout(() => {
            router.push(`/login?error=admin_error&message=${encodeURIComponent(exchangeError.message)}`);
          }, 3000);
          return;
        }

        addDebug("Code exchange successful!");
        addDebug(`User: ${data.user?.email || 'unknown'}`);
        setStatus("Success! Redirecting to dashboard...");
        
        router.push("/dashboard");
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        addDebug(`Caught error: ${errorMsg}`);
        setStatus(`Error: ${errorMsg}`);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg mb-4">{status}</p>
        
        {debugInfo.length > 0 && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
            <p className="text-gray-400 text-xs font-mono mb-2">Debug Info:</p>
            {debugInfo.map((info, i) => (
              <p key={i} className="text-gray-500 text-xs font-mono">{info}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

