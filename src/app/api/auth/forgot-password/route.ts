import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${email}`;

  await sendMail({
    to: email,
    subject: "Password Reset - E-Shop",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
