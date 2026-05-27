"use cache";

import { logger } from "@/server/logging/logger";

/**
 * Fetches and caches a Traduora access token using client credentials.
 */
export async function fetchTraduoraToken(): Promise<string | null> {
	const TRADUORA_API_URL = process.env.TRADUORA_API_URL!;
	const CLIENT_ID = process.env.TRADUORA_CLIENT_ID!;
	const CLIENT_SECRET = process.env.TRADUORA_CLIENT_SECRET!;

	const res = await fetch(`${TRADUORA_API_URL}/auth/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
		}),
	});

	if (!res.ok) {
		const errorText = await res.text();
		logger.error("traduora.token.fetch_failed", undefined, {
			subsystem: "translations",
			http_status: res.status,
			response_body: errorText,
		});
		throw new Error(`Failed to retrieve Traduora token. Status: ${res.status}`);
	}

	const data = await res.json();
	return data.access_token;
}
