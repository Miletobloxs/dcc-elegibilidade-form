import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
  .trim()
  .replace(/\r/g, "")
  .replace(/^["']|["']$/g, "");

export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
