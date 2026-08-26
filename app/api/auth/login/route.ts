import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { users } from "@/lib/store";
import { verifyPassword } from "@/lib/util";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const user = users.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }
    await createSession(user);
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
