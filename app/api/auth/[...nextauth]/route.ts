// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { consumeRateLimit, getRequestIpFromHeaders } from "@/lib/rateLimit";

const handler = NextAuth(authOptions);

const NEXTAUTH_CREDENTIALS_WINDOW_MS = 15 * 60 * 1000;
const NEXTAUTH_CREDENTIALS_LIMIT_PER_IP = 30;

export async function GET(req: NextRequest) {
	return handler(req);
}

export async function POST(req: NextRequest) {
	const pathname = req.nextUrl.pathname;
	const isCredentialsCallback = pathname.endsWith("/callback/credentials");

	if (!isCredentialsCallback) {
		return handler(req);
	}

	const ip = getRequestIpFromHeaders(req.headers);
	const rateLimit = consumeRateLimit(
		`nextauth:credentials:ip:${ip}`,
		NEXTAUTH_CREDENTIALS_LIMIT_PER_IP,
		NEXTAUTH_CREDENTIALS_WINDOW_MS,
	);

	if (!rateLimit.allowed) {
		return NextResponse.json(
			{ error: "Too many signin attempts. Please try again later." },
			{
				status: 429,
				headers: {
					"Retry-After": String(rateLimit.retryAfterSeconds),
					"X-RateLimit-Limit": String(rateLimit.limit),
					"X-RateLimit-Remaining": String(rateLimit.remaining),
					"X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
				},
			},
		);
	}

	const response = await handler(req);
	response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
	response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
	response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
	return response;
}