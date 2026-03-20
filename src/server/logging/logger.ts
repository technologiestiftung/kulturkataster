import { trace } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import {
	LoggerProvider,
	BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { getRequestContext } from "@/server/logging/requestContext";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogData = Record<string, unknown>;
type TimedLogLevel = Exclude<LogLevel, "debug">;
type TimedLogOptions = {
	level: TimedLogLevel;
	event: string;
	startEvent?: string;
	successEvent?: string;
	errorEvent?: string;
	startData?: LogData;
	successData?: LogData;
	errorData?: LogData;
	logStart?: boolean;
	logSuccess?: boolean;
	slowThresholdMs?: number;
	slowEvent?: string;
	slowData?: LogData;
};

type SerializableError = {
	name?: string;
	message: string;
	stack?: string;
	code?: string;
	details?: Record<string, unknown>;
};

type SanitizeState = {
	depth: number;
	seen: WeakSet<object>;
};

const serviceName = process.env.OTEL_SERVICE_NAME || "kulturkataster-frontend";
const REDACTED = "[REDACTED]";
const TRUNCATED_SUFFIX = "...[truncated]";
const MAX_STRING_LENGTH = 2048;
const MAX_DEPTH = 5;
const NON_PRIMITIVE = Symbol("non-primitive");
const sensitiveKeyPattern =
	/(authorization|cookie|set-cookie|password|passwd|secret|token|api[-_]?key|client[-_]?secret|refresh[-_]?token|access[-_]?token|id[-_]?token|session|credential)/i;

const resource = resourceFromAttributes({
	[ATTR_SERVICE_NAME]: serviceName,
});

const loggerProvider = new LoggerProvider({
	resource,
	processors: [new BatchLogRecordProcessor(new OTLPLogExporter({}))],
});

const otelLogger = loggerProvider.getLogger("app.logger", "1.0.0");

function serializeError(error: unknown): SerializableError {
	if (error instanceof Error) {
		const serializable: SerializableError = {
			name: error.name,
			message: error.message,
		};

		if (error.stack) {
			serializable.stack = error.stack;
		}

		const maybeCode = (error as { code?: unknown }).code;
		if (typeof maybeCode === "string") {
			serializable.code = maybeCode;
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

function truncateString(value: string) {
	if (value.length <= MAX_STRING_LENGTH) {
		return value;
	}

	return `${value.slice(0, MAX_STRING_LENGTH)}${TRUNCATED_SUFFIX}`;
}

function sanitizePrimitive(value: unknown) {
	if (
		value === null ||
		typeof value === "undefined" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}

	if (typeof value === "bigint") {
		return value.toString();
	}

	return NON_PRIMITIVE;
}

function sanitizeObject(
	value: Record<string, unknown>,
	state: SanitizeState,
): Record<string, unknown> | string {
	if (state.seen.has(value)) {
		return "[CIRCULAR]";
	}

	state.seen.add(value);

	return Object.fromEntries(
		Object.entries(value).map(([entryKey, entryValue]) => [
			entryKey,
			sanitizeValue(entryValue, entryKey, {
				depth: state.depth + 1,
				seen: state.seen,
			}),
		]),
	);
}

function sanitizeValue(
	value: unknown,
	key?: string,
	state: SanitizeState = { depth: 0, seen: new WeakSet<object>() },
): unknown {
	if (key && sensitiveKeyPattern.test(key)) {
		return REDACTED;
	}

	if (typeof value === "string") {
		return truncateString(value);
	}

	const primitive = sanitizePrimitive(value);
	if (primitive !== NON_PRIMITIVE) {
		return primitive;
	}

	if (state.depth >= MAX_DEPTH) {
		return "[MAX_DEPTH]";
	}

	if (Array.isArray(value)) {
		return value.map((item) =>
			sanitizeValue(item, undefined, {
				depth: state.depth + 1,
				seen: state.seen,
			}),
		);
	}

	if (value instanceof Error) {
		return sanitizeValue(serializeError(value), key, {
			depth: state.depth + 1,
			seen: state.seen,
		});
	}

	if (typeof value === "object") {
		return sanitizeObject(value as Record<string, unknown>, state);
	}

	return String(value);
}

function writeLine(level: LogLevel, line: string) {
	if (level === "error") {
		console.error(line);
		return;
	}

	if (level === "warn") {
		console.warn(line);
		return;
	}

	console.log(line);
}

function toSeverityNumber(level: LogLevel) {
	switch (level) {
		case "debug":
			return SeverityNumber.DEBUG;
		case "info":
			return SeverityNumber.INFO;
		case "warn":
			return SeverityNumber.WARN;
		case "error":
			return SeverityNumber.ERROR;
		default:
			return SeverityNumber.INFO;
	}
}

function writeLog(level: LogLevel, event: string, data: LogData = {}) {
	const activeSpan = trace.getActiveSpan();
	const spanContext = activeSpan?.spanContext();
	const requestContext = getRequestContext();
	const sanitizedData = sanitizeValue(data);

	const entry = {
		timestamp: new Date().toISOString(),
		level,
		event,
		source: "server",
		service: serviceName,
		environment: process.env.NODE_ENV,
		runtime: process.env.NEXT_RUNTIME,
		trace_id: spanContext?.traceId,
		span_id: spanContext?.spanId,
		request_id: requestContext?.requestId,
		request_method: requestContext?.method,
		request_pathname: requestContext?.pathname,
		route: requestContext?.route,
		user_id: requestContext?.userId,
		...(sanitizedData && typeof sanitizedData === "object"
			? sanitizedData
			: { data: sanitizedData }),
	};

	otelLogger.emit({
		severityNumber: toSeverityNumber(level),
		severityText: level.toUpperCase(),
		body: event,
		eventName: event,
		attributes: entry,
	});

	writeLine(level, JSON.stringify(entry));
}

export const logger = {
	debug(event: string, data?: LogData) {
		writeLog("debug", event, data);
	},
	info(event: string, data?: LogData) {
		writeLog("info", event, data);
	},
	warn(event: string, data?: LogData) {
		writeLog("warn", event, data);
	},
	error(event: string, error?: unknown, data: LogData = {}) {
		writeLog("error", event, {
			...data,
			error: serializeError(error),
		});
	},
	async time<T>(
		options: TimedLogOptions,
		callback: () => Promise<T>,
	): Promise<T> {
		const startedAt = Date.now();
		const { event, level } = options;
		const successEvent = options.successEvent || event;
		const errorEvent = options.errorEvent || event;

		if (options.logStart) {
			writeLog(
				level,
				options.startEvent || `${event}.started`,
				options.startData,
			);
		}

		try {
			const result = await callback();
			const durationMs = Date.now() - startedAt;
			if (options.logSuccess !== false) {
				writeLog(level, successEvent, {
					duration_ms: durationMs,
					...options.successData,
				});
			}
			if (
				typeof options.slowThresholdMs === "number" &&
				durationMs >= options.slowThresholdMs
			) {
				writeLog("warn", options.slowEvent || `${event}.slow`, {
					duration_ms: durationMs,
					threshold_ms: options.slowThresholdMs,
					...options.slowData,
				});
			}
			return result;
		} catch (error) {
			writeLog("error", errorEvent, {
				duration_ms: Date.now() - startedAt,
				...options.errorData,
				error: serializeError(error),
			});
			throw error;
		}
	},
};

export default loggerProvider;
