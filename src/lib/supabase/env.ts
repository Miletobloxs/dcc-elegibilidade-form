function sanitize(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/\r/g, "")
    .replace(/^["']|["']$/g, "");
}

export const supabaseUrl = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
