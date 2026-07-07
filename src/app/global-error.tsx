"use client";

import { TelemetryErrorFallback } from "@/components/ErrorBoundary/TelemetryErrorFallback";
import "./[locale]/globals.css";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="de">
			<body>
				<TelemetryErrorFallback
					error={error}
					reset={reset}
					scope="global_route"
				/>
			</body>
		</html>
	);
}
