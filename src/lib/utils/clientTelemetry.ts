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
	digest?: string;
	details?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedErrorRecord(error: Record<string, unknown>) {
	const details = error.details;
	return isRecord(details) ? details : undefined;
}

function getRecordString(
	error: Record<string, unknown>,
	nestedError: Record<string, unknown> | undefined,
	key: "code" | "digest" | "message" | "name" | "stack",
) {
	const directValue = error[key];
	if (typeof directValue === "string" && directValue.length > 0) {
		return directValue;
	}

	const nestedValue = nestedError?.[key];
	return typeof nestedValue === "string" && nestedValue.length > 0
		? nestedValue
		: undefined;
}

function getErrorDigest(
	error: Record<string, unknown>,
	nestedError?: Record<string, unknown>,
) {
	return getRecordString(error, nestedError, "digest");
}

function serializeErrorRecord(
	error: Record<string, unknown>,
): SerializedClientError {
	const nestedError = getNestedErrorRecord(error);
	const message =
		getRecordString(error, nestedError, "message") ?? "Non-Error object thrown";
	const serializable: SerializedClientError = { message };
	const name = getRecordString(error, nestedError, "name");
	const stack = getRecordString(error, nestedError, "stack");
	const code = getRecordString(error, nestedError, "code");
	const digest = getErrorDigest(error, nestedError);

	if (name) {
		serializable.name = name;
	}
	if (stack) {
		serializable.stack = stack;
	}
	if (code) {
		serializable.code = code;
	}
	if (digest) {
		serializable.digest = digest;
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
		const digest = (error as { digest?: unknown }).digest;
		if (typeof digest === "string") {
			serializable.digest = digest;
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
