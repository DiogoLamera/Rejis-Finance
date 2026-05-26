import { NextResponse } from "next/server";
import { COOKIE_AUTH } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_AUTH,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expira já
  });
  return response;
}
