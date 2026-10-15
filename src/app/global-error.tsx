"use client";

import { usePathname } from "next/navigation";
import { TelemetryErrorFallback } from "@/components/ErrorBoundary/TelemetryErrorFallback";
import { allowedLocales, defaultLocale } from "@/i18n/config";
import "./[locale]/globals.css";

function getLocaleFromPathname(pathname: string | null) {
	const firstSegment = pathname?.split("/").filter(Boolean)[0];
	return firstSegment && allowedLocales.includes(firstSegment)
		? firstSegment
		: defaultLocale;
}

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const pathname = usePathname();

	return (
		<html lang={getLocaleFromPathname(pathname)}>
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
