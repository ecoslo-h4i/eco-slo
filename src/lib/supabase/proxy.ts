import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const ADMIN_ONLY_PATHS: [string] = ["/reminders", "/members"];
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/auth");
  const pathname = request.nextUrl.pathname;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  // 1) Landing: "/" is never served — route by auth state.
  if (pathname === "/") {
    return redirectTo(user ? "/dashboard" : "/map");
  }

  // 2) Any other matched path requires authentication.
  if (!user) {
    return redirectTo("/login");
  }

  // 3) Admin-only paths: gate by members.role
  const requiresAdmin = ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (requiresAdmin) {
    const { data: isAdmin, error } = await supabase.rpc("is_admin");

    if (error) {
      // Fail closed: if we can't verify admin status, send to /dashboard
      console.error("[middleware] members role lookup failed:", error);
      return redirectTo("/dashboard");
    }
    if (!isAdmin) {
      return redirectTo("/dashboard");
    }
  }

  return supabaseResponse;
}
