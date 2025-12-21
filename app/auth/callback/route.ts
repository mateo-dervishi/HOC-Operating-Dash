import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";
  
  const baseUrl = "https://hoc-operating-dash.vercel.app";

  // If there's an error from the OAuth provider
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(`${baseUrl}/login?error=admin_error&message=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    
    console.error("Code exchange error:", exchangeError.message);
    return NextResponse.redirect(`${baseUrl}/login?error=admin_error&message=${encodeURIComponent(exchangeError.message)}`);
  }

  // No code provided
  return NextResponse.redirect(`${baseUrl}/login?error=admin_error`);
}
