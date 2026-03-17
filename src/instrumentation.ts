import { registerOTel, OTLPHttpJsonTraceExporter } from "@vercel/otel";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

export function register() {
	registerOTel({
		serviceName: process.env.OTEL_SERVICE_NAME || "kulturkataster-frontend",
		traceExporter: new OTLPHttpJsonTraceExporter({
			url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "",
		}),
	});
}
