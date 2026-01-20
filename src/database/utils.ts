import { PostgrestError } from "@supabase/supabase-js";

/**
 * Converts a PostgrestError into the corresponding HTTP Status code
 * @param error
 * @returns number
 */
export function postgrestErrorToHttpStatus(error: PostgrestError): number {
  const code = error.code ?? "";

  // PostgREST "no rows found" often triggered by .single()
  if (code === "PGRST116") return 404;

  // Auth / permission
  if (code === "42501") return 403;

  // Uniqueness / conflicts
  if (code === "23505") return 409; // unique_violation
  if (code === "23503") return 409; // foreign_key_violation

  // Client input errors (validation / bad data)
  if (code === "22P02") return 400; // invalid_text_representation
  if (code === "23502") return 400; // not_null_violation
  if (code === "23514") return 400; // check_violation
  if (code === "22001") return 400; // string_data_right_truncation
  if (code === "22003") return 400; // numeric_value_out_of_range

  // other "22xxx" data exceptions
  if (code.startsWith("22")) return 400;

  // Default: server error
  return 500;
}
