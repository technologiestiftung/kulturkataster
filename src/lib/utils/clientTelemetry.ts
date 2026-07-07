"use client";

import { logClientTelemetry } from "@/server/actions/clientTelemetry";

type ClientTelemetryLevel = "warn" | "error";

type ClientTelemetryPayload = {
	level: ClientTelemetryLevel;
	event: string;
	metadata?: Record<string, unknown>;
	error?: unknown;
};

type SerializedClientError = {
	name?: string;
	message: string;
	stack?: string;
	code?: string;
	details?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializeErrorRecord(
	error: Record<string, unknown>,
): SerializedClientError {
	const message =
		typeof error.message === "string" && error.message.length > 0
			? error.message
			: "Non-Error object thrown";
	const serializable: SerializedClientError = { message };

	if (typeof error.name === "string") {
		serializable.name = error.name;
	}
	if (typeof error.stack === "string") {
		serializable.stack = error.stack;
	}
	if (typeof error.code === "string") {
		serializable.code = error.code;
	}
	if (message === "Non-Error object thrown") {
		serializable.details = error;
	}

	return serializable;
}

function serializeClientError(error: unknown) {
	if (error instanceof Error) {
		const serializable: SerializedClientError = {
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

	if (isRecord(error)) {
		return serializeErrorRecord(error);
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
