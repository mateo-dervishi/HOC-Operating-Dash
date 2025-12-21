"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    unauthorized: "Only @houseofclarence.uk emails can access this dashboard.",
    not_authorized: "You are not authorized to access this dashboard. Contact an admin.",
    account_disabled: "Your account has been disabled.",
    setup_required: "Database setup required. Please run the migration SQL.",
    admin_error: "An error occurred. Please try again.",
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: "https://hoc-operating-dash.vercel.app/auth/callback",
        scopes: "email profile openid",
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white mb-4">
            <span className="text-2xl font-bold text-gray-900">HC</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-gray-400 mt-1">House of Clarence Internal</p>
        </div>

        {/* Error Messages */}
        {(error || errorParam) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              {error || (errorParam && errorMessages[errorParam]) || "An error occurred."}
            </p>
          </div>
        )}

        {/* Login */}
        <div className="bg-gray-800 rounded-xl p-6">
          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Access restricted to House of Clarence team members
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
