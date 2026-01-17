import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey: string = process.env.NEXT_PUBLIC_SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createAuthenticatedClient = (jwt: string): SupabaseClient => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `${jwt}`,
      },
    },
  });
};
