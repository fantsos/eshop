import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, email, password } = await req.json();

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const verification = await prisma.verificationToken.findFirst({
    where: { identifier: email, token, expires: { gt: new Date() } },
  });

  if (!verification) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  // Clean up the token
  await prisma.verificationToken.deleteMany({
    where: { identifier: email, token },
  });

  return NextResponse.json({ success: true });
}
