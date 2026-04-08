"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";

type ClientTelemetryLevel = "warn" | "error";

type ClientTelemetryError = {
	name?: string;
	message: string;
	stack?: string;
	code?: string;
};

type ClientTelemetryInput = {
	level: ClientTelemetryLevel;
	event: string;
	metadata?: Record<string, unknown>;
	error?: ClientTelemetryError;
};

export async function logClientTelemetry(input: ClientTelemetryInput) {
	return runWithServerRequestContext(async () => {
		const currentUserId = await getCurrentUserId();
		setRequestContext({ userId: currentUserId });

		const payload = {
			source: "client",
			subsystem: "client_ui",
			...input.metadata,
		};

		if (input.level === "warn") {
			logger.warn(input.event, {
				...payload,
				error: input.error,
			});
			return;
		}

		logger.error(input.event, input.error, payload);
	});
}
