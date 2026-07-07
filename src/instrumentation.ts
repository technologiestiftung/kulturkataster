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
	logger.error("next.request_error", error, {
		subsystem: "next",
		request_pathname: request.path,
		request_method: request.method,
		route: context.routePath,
		router_kind: context.routerKind,
		route_type: context.routeType,
		render_source: context.renderSource,
		revalidate_reason: context.revalidateReason,
	});
};
