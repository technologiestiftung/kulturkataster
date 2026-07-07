"use client";

import { TelemetryErrorFallback } from "@/components/ErrorBoundary/TelemetryErrorFallback";

export default function LocaleError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<TelemetryErrorFallback error={error} reset={reset} scope="locale_route" />
	);
}
