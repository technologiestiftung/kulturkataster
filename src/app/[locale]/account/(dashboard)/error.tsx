"use client";

import { TelemetryErrorFallback } from "@/components/ErrorBoundary/TelemetryErrorFallback";

export default function AccountDashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<TelemetryErrorFallback
			error={error}
			reset={reset}
			scope="account_dashboard"
		/>
	);
}
