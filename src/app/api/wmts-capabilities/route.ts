/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/server/logging/logger";
import {
	getRequestContext,
	REQUEST_ID_HEADER,
	runWithNextRequestContext,
} from "@/server/logging/requestContext";

// In-memory cache (use Redis in production)
const capabilitiesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
	return runWithNextRequestContext(
		request,
		async () => {
			const requestId = getRequestContext()?.requestId;
			const searchParams = request.nextUrl.searchParams;
			const url = searchParams.get("url");

			if (!url) {
				logger.warn("wmts_capabilities.request.invalid", {
					subsystem: "map",
					has_url: false,
				});
				const response = NextResponse.json(
					{ error: "URL parameter required" },
					{ status: 400 },
				);
				if (requestId) {
					response.headers.set(REQUEST_ID_HEADER, requestId);
				}
				return response;
			}

			const cached = capabilitiesCache.get(url);
			if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
				const response = NextResponse.json(cached.data);
				if (requestId) {
					response.headers.set(REQUEST_ID_HEADER, requestId);
				}
				return response;
			}

			try {
				const response = await fetch(url);

				if (!response.ok) {
					logger.warn("wmts_capabilities.fetch.http_error", {
						subsystem: "map",
						http_status: response.status,
						source_url: url,
					});
					throw new Error(`Failed to fetch: ${response.status}`);
				}

				const text = await response.text();
				const cacheData = { xml: text };
				capabilitiesCache.set(url, { data: cacheData, timestamp: Date.now() });

				const jsonResponse = NextResponse.json(cacheData);
				if (requestId) {
					jsonResponse.headers.set(REQUEST_ID_HEADER, requestId);
				}
				return jsonResponse;
			} catch (error) {
				logger.error("wmts_capabilities.fetch.failed", error, {
					subsystem: "map",
					source_url: url,
				});
				const response = NextResponse.json(
					{ error: `Failed to fetch capabilities: ${error}` },
					{ status: 500 },
				);
				if (requestId) {
					response.headers.set(REQUEST_ID_HEADER, requestId);
				}
				return response;
			}
		},
		{ route: "/api/wmts-capabilities" },
	);
}
