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
        
        // Debug: Show all localStorage keys
        addDebug(`localStorage keys: ${Object.keys(localStorage).join(', ') || 'none'}`);
        
        // Check for PKCE verifier in localStorage
        const pkceKeys = Object.keys(localStorage).filter(k => 
          k.includes('code_verifier') || k.includes('pkce') || k.includes('supabase')
        );
        addDebug(`Supabase/PKCE related keys: ${pkceKeys.join(', ') || 'none'}`);
        
        // Check URL params
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        
        addDebug(`Code present: ${!!code}`);

        if (error) {
          setStatus(`OAuth Error: ${errorDescription || error}`);
          setTimeout(() => {
            router.push(`/login?error=admin_error&message=${encodeURIComponent(errorDescription || error)}`);
          }, 5000);
          return;
        }

        if (!code) {
          addDebug("No code in URL, checking for existing session...");
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            addDebug("Session found! Redirecting to dashboard...");
            router.push("/dashboard");
            return;
          }
          
          setStatus("No authentication code received");
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
          return;
        }

        addDebug("Code exchange successful!");
        addDebug(`User: ${data.user?.email || 'unknown'}`);
        setStatus("Success! Redirecting to dashboard...");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
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
      <div className="text-center max-w-lg w-full">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg mb-4">{status}</p>
        
        {debugInfo.length > 0 && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left overflow-auto max-h-64">
            <p className="text-gray-400 text-xs font-mono mb-2">Debug Info:</p>
            {debugInfo.map((info, i) => (
              <p key={i} className="text-gray-500 text-xs font-mono break-all">{info}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
