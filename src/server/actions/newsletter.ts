"use server";

import { headers } from "next/headers";
import { logger } from "@/server/logging/logger";

export async function subscribeToNewsletter(params: {
	email: string;
	name?: string;
}) {
	const email = params.email.trim();
	const name = params.name?.trim() ?? "";

	if (!email) {
		return { ok: false as const, error: "missing_email" as const };
	}

	const clientId = process.env.CLEVERREACH_CLIENT_ID;
	const clientSecret = process.env.CLEVERREACH_CLIENT_SECRET;
	const groupId = process.env.CLEVERREACH_GROUP_ID;
	const formId = process.env.CLEVERREACH_FORM_ID;

	if (!clientId || !clientSecret || !groupId || !formId) {
		logger.error("newsletter.subscribe.missing_env", undefined, {
			subsystem: "newsletter",
		});
		return { ok: false as const, error: "missing_env" as const };
	}

	try {
		const requestHeaders = await headers();
		const userIp =
			requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		const referer = requestHeaders.get("referer") ?? "";
		const userAgent = requestHeaders.get("user-agent") ?? "";

		const tokenRes = await fetch(
			"https://rest.cleverreach.com/oauth/token.php",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
				},
				body: JSON.stringify({
					grant_type: "client_credentials",
				}),
			},
		);

		if (!tokenRes.ok) {
			logger.error("newsletter.subscribe.token_failed", undefined, {
				subsystem: "newsletter",
				http_status: tokenRes.status,
				response_body: await tokenRes.text(),
			});
			return { ok: false as const, error: "token_failed" as const };
		}

		const tokenData = (await tokenRes.json()) as {
			access_token?: string;
		};
		const accessToken = tokenData.access_token;

		if (!accessToken) {
			logger.error("newsletter.subscribe.token_missing", undefined, {
				subsystem: "newsletter",
			});
			return { ok: false as const, error: "token_failed" as const };
		}

		const receiverRes = await fetch(
			`https://rest.cleverreach.com/v3/groups.json/${groupId}/receivers`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					email,
					registered: Math.floor(Date.now() / 1000),
					activated: 0,
					source: "website",
					global_attributes: {
						name,
					},
				}),
			},
		);

		if (!receiverRes.ok) {
			logger.error("newsletter.subscribe.receiver_failed", undefined, {
				subsystem: "newsletter",
				http_status: receiverRes.status,
				response_body: await receiverRes.text(),
			});
			return { ok: false as const, error: "receiver_failed" as const };
		}

		const doiRes = await fetch(
			`https://rest.cleverreach.com/v3/forms.json/${formId}/send/activate`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					email,
					doidata: {
						user_ip: userIp,
						referer,
						user_agent: userAgent,
					},
				}),
			},
		);

		if (!doiRes.ok) {
			logger.error("newsletter.subscribe.doi_failed", undefined, {
				subsystem: "newsletter",
				http_status: doiRes.status,
				response_body: await doiRes.text(),
			});
			return { ok: false as const, error: "doi_failed" as const };
		}

		return { ok: true as const };
	} catch (error) {
		logger.error("newsletter.subscribe.unexpected", error, {
			subsystem: "newsletter",
			email,
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}
