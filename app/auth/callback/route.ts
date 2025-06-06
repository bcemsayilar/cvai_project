import { createSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const type = requestUrl.searchParams.get("type")

  if (code) {
    const supabase = createSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  // If this is a signup confirmation, redirect to a special page
  if (type === "signup") {
    return NextResponse.redirect(new URL("/auth/welcome", requestUrl.origin))
  }

  // Otherwise redirect to the origin or the next parameter
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
