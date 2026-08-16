import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Sanitiza: remove espaços, \r e aspas que possam ter vindo do .env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\r/g, "")
    .replace(/^["']|["']$/g, "");

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim()
    .replace(/\r/g, "")
    .replace(/^["']|["']$/g, "");

  // Se as vars não estiverem disponíveis ou o URL for inválido,
  // deixa o request passar — o layout (server component) cuida da auth.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  try {
    new URL(supabaseUrl);
  } catch {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Atualiza a sessão — NÃO remover este getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas públicas (auth)
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/bypass-cadastro") ||
    pathname.startsWith("/api/bypass-cadastro") ||
    pathname.startsWith("/cadastro-interno") ||
    pathname.startsWith("/api/cadastro-interno") ||
    pathname.startsWith("/cadastro-investidor") ||
    pathname.startsWith("/api/cadastro-investidor") ||
    pathname === "/cadastro" ||
    pathname === "/api/cadastro" ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/auth/callback");

  if (isAuthRoute) {
    if (user || process.env.BYPASS_AUTH === "true") {
      // Se for o cadastro público, não redireciona para o dashboard se logado (deixa renderizar ou cadastrar)
      if (pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/deals/new", request.url));
      }
    }
    return supabaseResponse;
  }

  // Protege todas as demais rotas
  if (!user && process.env.BYPASS_AUTH !== "true") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
