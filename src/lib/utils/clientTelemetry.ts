"use client";

import { logClientTelemetry } from "@/server/actions/clientTelemetry";

type ClientTelemetryLevel = "warn" | "error";

type ClientTelemetryPayload = {
	level: ClientTelemetryLevel;
	event: string;
	metadata?: Record<string, unknown>;
	error?: unknown;
};

function serializeClientError(error: unknown) {
	if (error instanceof Error) {
		const serializable: {
			name?: string;
			message: string;
			stack?: string;
			code?: string;
		} = {
			name: error.name,
			message: error.message,
		};

		if (error.stack) {
			serializable.stack = error.stack;
		}

		const code = (error as { code?: unknown }).code;
		if (typeof code === "string") {
			serializable.code = code;
		}

		return serializable;
	}

	if (error && typeof error === "object") {
		return {
			message: "Non-Error object thrown",
			details: error as Record<string, unknown>,
		};
	}

	return {
		message: typeof error === "string" ? error : String(error),
	};
}

export function reportClientTelemetry({
	level,
	event,
	metadata,
	error,
}: ClientTelemetryPayload) {
	const clientMetadata = {
		...metadata,
		client_pathname:
			typeof window !== "undefined" ? window.location.pathname : undefined,
	};

	void logClientTelemetry({
		level,
		event,
		metadata: clientMetadata,
		error: error === undefined ? undefined : serializeClientError(error),
	}).catch(() => undefined);
}
