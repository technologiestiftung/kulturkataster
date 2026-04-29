"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	downloadInstitutions,
	type ExportFormat,
} from "@/lib/utils/downloadUtils";
import type { Institution } from "@/types";

type DownloadModalProps = {
	routePath?: string;
	open?: boolean;
	onCloseRequest?: () => void;
	returnTo?: string;
	hasFooter?: boolean;
	title?: string;
	subtitle?: ReactNode;
	data?: Institution[];
	filename?: string;
	format?: ExportFormat;
	translateFn?: (key: string, options?: Record<string, unknown>) => string;
	confirmLabel?: string;
	cancelLabel?: string;
};

export function DownloadModal({
	routePath,
	open,
	onCloseRequest,
	returnTo,
	hasFooter = false,
	title,
	subtitle,
	data = [],
	filename = "kulturorte",
	format = "xlsx",
	translateFn,
	confirmLabel,
	cancelLabel,
}: DownloadModalProps) {
	const { t } = useTranslation(["content", "common", "enumMap"]);
	const institutionCount = data.length;
	const [acknowledgementValue, setAcknowledgementValue] = useState("");
	const [isDownloading, setIsDownloading] = useState(false);
	const handleClose = () => {
		setAcknowledgementValue("");
		setIsDownloading(false);
		onCloseRequest?.();
	};
	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			await downloadInstitutions({
				data,
				filename,
				format,
				translateFn,
			});
			handleClose();
		} finally {
			setIsDownloading(false);
		}
	};

	const content = (
		<div className="space-y-6 flex flex-col">
			<p className="body2">
				{t("downloadModal.description", {
					ns: "content",
					defaultValue:
						"Die Liste ihrer Kulturorte können Sie hier als Excel Tabelle herunterladen.",
				})}
			</p>
			<RadioGroup
				value={acknowledgementValue}
				onValueChange={setAcknowledgementValue}
				className="gap-3"
			>
				<div className="flex items-start gap-3">
					<RadioGroupItem
						id="download-list-acknowledgement"
						value="accepted"
						className="mt-0.5"
					/>
					<Label
						htmlFor="download-list-acknowledgement"
						className="body2 cursor-pointer leading-6"
					>
						{t("downloadModal.acknowledgement", {
							ns: "content",
							defaultValue:
								"Ich habe die rechtlichen Hinweise gelesen und verstanden",
						})}
					</Label>
				</div>
			</RadioGroup>
			<div className="flex flex-col md:flex-row gap-3">
				<Button type="button" variant="outline" onClick={handleClose}>
					{cancelLabel ?? t("cancel", { ns: "common", defaultValue: "Cancel" })}
				</Button>
				<Button
					type="button"
					disabled={acknowledgementValue !== "accepted" || isDownloading}
					onClick={() => void handleDownload()}
				>
					{confirmLabel ??
						t("institutionsTable.actions.downloadList", {
							ns: "content",
							defaultValue: "Liste herunterladen",
						})}
				</Button>
			</div>
		</div>
	);

	return (
		<Modal
			title={
				title ??
				t("downloadModal.title", {
					ns: "content",
					defaultValue: "Meine Daten als Liste herunterladen",
				})
			}
			subtitle={
				subtitle ??
				t("downloadModal.subtitle", {
					ns: "content",
					count: institutionCount,
					defaultValue: "{{count}} Kulturorte zum Herunterladen",
				})
			}
			open={open}
			routePath={routePath}
			returnTo={returnTo}
			variant="centered"
			hasFooter={hasFooter}
			showBackButton={false}
			onCloseRequest={handleClose}
		>
			{content}
		</Modal>
	);
}
