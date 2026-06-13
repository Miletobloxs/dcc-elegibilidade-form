import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/deals/new";

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user && user.email) {
        const email = user.email.toLowerCase();

        // Check if user already exists in local db
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Check if domain is allowed
          const isAllowedDomain =
            email.endsWith("@bloxs.com.br") ||
            email.endsWith("@bloxs.com") ||
            email.endsWith("@vortex.com.br") ||
            email.endsWith("@vortex.com");

          if (isAllowedDomain) {
            // Auto-signup: create DB record
            const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
            const userRole = email === "carlos.carneiro@bloxs.com.br" ? "SUPER_ADMIN" : "ADMIN";
            try {
              await prisma.user.create({
                data: {
                  id: user.id,
                  email,
                  name,
                  role: userRole,
                },
              });
            } catch (createError) {
              console.error("Error creating user in local db during oauth callback:", createError);
              return NextResponse.redirect(`${origin}/login?error=db_creation_failed`);
            }
          } else {
            // If domain is not allowed, sign out and redirect with error
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/login?error=domain_not_allowed`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback error during exchangeCodeForSession:", exchangeError);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
