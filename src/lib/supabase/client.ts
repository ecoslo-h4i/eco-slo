import { createBrowserClient } from "@supabase/ssr";

export function createUserLevelClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!);
}
