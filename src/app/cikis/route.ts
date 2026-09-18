import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await serverClient();
  await supabase.auth.signOut();

  const hedef = request.nextUrl.clone();
  hedef.pathname = "/giris";
  hedef.search = "";
  return NextResponse.redirect(hedef, { status: 303 });
}
