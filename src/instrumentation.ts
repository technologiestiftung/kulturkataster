import { registerOTel, OTLPHttpJsonTraceExporter } from "@vercel/otel";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import type { Instrumentation } from "next";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

export function register() {
	registerOTel({
		serviceName: process.env.OTEL_SERVICE_NAME || "kulturkataster-frontend",
		traceExporter: new OTLPHttpJsonTraceExporter({
			url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "",
		}),
	});
}

const isStaleServerActionError = (error: unknown): error is Error =>
	error instanceof Error &&
	error.message.includes("Failed to find Server Action");

const getNextRequestErrorContext = (
	request: Parameters<Instrumentation.onRequestError>[1],
	context: Parameters<Instrumentation.onRequestError>[2],
) => ({
	subsystem: "next",
	request_pathname: request.path,
	request_method: request.method,
	route: context.routePath,
	router_kind: context.routerKind,
	route_type: context.routeType,
	render_source: context.renderSource,
	revalidate_reason: context.revalidateReason,
});

export const onRequestError: Instrumentation.onRequestError = async (
	error,
	request,
	context,
) => {
	if (process.env.NEXT_RUNTIME === "edge") {
		console.error("next.request_error", error);
		return;
	}
	const { logger } = await import("@/server/logging/logger");
	const requestErrorContext = getNextRequestErrorContext(request, context);
	if (isStaleServerActionError(error)) {
		logger.warn("next.stale_server_action", {
			...requestErrorContext,
			expected_cause: "client_server_action_manifest_mismatch",
			error_name: error.name,
			error_message: error.message,
			error_stack: error.stack,
		});
		return;
	}

	logger.error("next.request_error", error, requestErrorContext);
};
