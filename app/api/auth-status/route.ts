import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function checkEmailVerificationColumns() {
  const rows = await prisma.$queryRaw<
    { column_name: string }[]
  >`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name IN ('emailVerified', 'emailVerificationToken', 'emailVerificationExpires')
  `;

  const columns = new Set(rows.map((row) => row.column_name));
  return {
    emailVerified: columns.has("emailVerified"),
    emailVerificationToken: columns.has("emailVerificationToken"),
    emailVerificationExpires: columns.has("emailVerificationExpires"),
  };
}

async function checkPasswordResetTable() {
  const rows = await prisma.$queryRaw<
    { table_name: string }[]
  >`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'PasswordReset'
  `;

  return rows.length > 0;
}

export async function GET() {
  try {
    const smtpConfigured = Boolean(
      process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER)
    );

    const nextauthUrlConfigured = Boolean(process.env.NEXTAUTH_URL);
    const emailColumns = await checkEmailVerificationColumns();
    const passwordResetTable = await checkPasswordResetTable();

    return NextResponse.json({
      smtpConfigured,
      nextauthUrlConfigured,
      emailVerificationColumns: emailColumns,
      passwordResetTable,
    });
  } catch (error) {
    console.error("auth-status error", error);
    return NextResponse.json(
      { error: "Failed to check auth status" },
      { status: 500 }
    );
  }
}
