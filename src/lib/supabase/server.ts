import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Sunucu istemcisi (Server Component / Route Handler). */
export async function serverClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              store.set(name, value, options);
            }
          } catch {
            // Server Component'ten çerez yazılamaz; oturumu middleware tazeliyor.
          }
        },
      },
    },
  );
}
