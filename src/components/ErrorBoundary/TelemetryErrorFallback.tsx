"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InfoCircle from "@/icons/info-circle.svg";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { useTranslation } from "react-i18next";

type TelemetryErrorFallbackProps = {
	error: Error & { digest?: string };
	reset?: () => void;
	scope: string;
};

export function TelemetryErrorFallback({
	error,
	reset,
	scope,
}: TelemetryErrorFallbackProps) {
	const { t } = useTranslation();

	useEffect(() => {
		reportClientTelemetry({
			level: "error",
			event: "react.render_error",
			error,
			metadata: {
				error_boundary_scope: scope,
				error_digest: error.digest,
			},
		});
	}, [error, scope]);

	return (
		<div className="flex min-h-dvh w-full items-start justify-center bg-neutral-10 px-4 py-20 md:items-center md:px-6 md:py-10">
			<Card variant="secondary" className="w-full max-w-2xl">
				<CardContent variant="secondary" className="space-y-4 p-6 md:p-8">
					<div className="rounded-sm border border-border bg-background p-4">
						<div className="flex items-start gap-3">
							<span className="mt-0.5 text-primary-dark">
								<InfoCircle className="size-5" />
							</span>
							<div className="space-y-2">
								<h1 className="body1 font-bold">
									{t("common.errorBoundary.title")}
								</h1>
								<p className="body2">{t("common.errorBoundary.description")}</p>
							</div>
						</div>
					</div>
					{reset ? (
						<div className="flex justify-end">
							<Button type="button" onClick={reset} fullWidth={false}>
								{t("common.errorBoundary.retry")}
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
