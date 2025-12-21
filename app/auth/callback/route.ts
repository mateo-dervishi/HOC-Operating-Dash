import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  const baseUrl = "https://hoc-operating-dash.vercel.app";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=admin_error&message=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore - called from Server Component
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }
    
    return NextResponse.redirect(`${baseUrl}/login?error=admin_error&message=${encodeURIComponent(exchangeError.message)}`);
  }

  return NextResponse.redirect(`${baseUrl}/login?error=admin_error`);
}

