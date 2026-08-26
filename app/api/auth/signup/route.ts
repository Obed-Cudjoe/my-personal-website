import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { users } from "@/lib/store";
import { hashPassword } from "@/lib/util";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "A valid email and a password of at least 6 characters are required." },
        { status: 400 }
      );
    }
    if (users.findByEmail(email)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const user = users.create({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name: name?.trim() || email.split("@")[0],
      phone: "",
      role: "user",
    });
    await createSession(user);
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
