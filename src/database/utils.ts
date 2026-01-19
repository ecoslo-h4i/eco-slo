import { PostgrestError } from "@supabase/supabase-js";

/**
 * Converts a PostgrestError into the corresponding HTTP Status code
 * @param error
 * @returns number
 */
export function postgrestErrorToHttpStatus(error: PostgrestError): number {
  switch (error.code) {
    case "42501":
      return 403;
    case "PGRST116":
      return 404;
    case "23505":
      return 409;
    case "22P02":
      return 400;
    default:
      return 500;
  }
}
