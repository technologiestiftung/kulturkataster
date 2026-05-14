"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER,
	downloadInstitutions,
	type ExportFormat,
} from "@/lib/utils/downloadUtils";
import type { Institution } from "@/types";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useRoutedModalClose } from "../useRoutedModalClose";
import { notifyInstitutionDownload } from "@/server/actions/downloads";

type DownloadModalProps = {
	routePath?: string;
	open?: boolean;
	onCloseRequest?: () => void;
	returnTo?: string;
	hasFooter?: boolean;
	title?: string;
	subtitle?: ReactNode;
	data?: Institution[] | null;
	filename?: string;
	format?: ExportFormat;
	translateFn?: (key: string, options?: Record<string, unknown>) => string;
	confirmLabel?: string;
	cancelLabel?: string;
	exportColumnOrder?: string[];
	onAfterDownload?: (args: {
		data: Institution[];
		filename: string;
		format: ExportFormat;
	}) => Promise<void> | void;
};

export function DownloadModal({
	routePath,
	open,
	onCloseRequest,
	returnTo,
	hasFooter = false,
	title,
	subtitle,
	data,
	filename = "kulturorte",
	format = "xlsx",
	translateFn,
	confirmLabel,
	cancelLabel,
	exportColumnOrder,
	onAfterDownload,
}: DownloadModalProps) {
	const { t } = useTranslation(["content", "common", "enumMap"]);
	const { t: tEnum } = useTranslation("enumMap");
	const isModalVisible = open ?? true;
	const performClose = useRoutedModalClose({ returnTo });
	const currentProfile = useAccountStore((s) => s.currentProfile);
	const isPublicDownloadFlow = data === undefined || data === null;
	const isLoggedIn = !isPublicDownloadFlow && currentProfile !== null;
	const initializePublicData = useInstitutionStore(
		(s) => s.initializePublicData,
	);
	const filteredInstitutions = useInstitutionStore(
		(s) => s.filteredInstitutions,
	);
	const allInstitutions = useInstitutionStore((s) => s.allInstitutions);
	const isInstitutionStoreLoading = useInstitutionStore((s) => s.isLoading);
	const resolvedData = data ?? allInstitutions ?? filteredInstitutions ?? [];
	const institutionCount = resolvedData.length;
	const isHydratingInstitutions = !data && allInstitutions === null;
	const [acknowledgementValue, setAcknowledgementValue] = useState("");
	const [isDownloading, setIsDownloading] = useState(false);
	const [guestData, setGuestData] = useState<Record<string, unknown>>({});
	const isGuestFormFilled =
		!isLoggedIn &&
		Boolean(
			guestData.vorname &&
				guestData.nachname &&
				guestData.email &&
				guestData.datenverwendung,
		);
	const canDownload =
		acknowledgementValue === "accepted" &&
		!isDownloading &&
		(isLoggedIn || isGuestFormFilled);

	useEffect(() => {
		if (!isModalVisible) return;
		if (data) return;
		if (allInstitutions !== null) return;
		if (isInstitutionStoreLoading) return;
		void initializePublicData();
	}, [
		allInstitutions,
		data,
		initializePublicData,
		isInstitutionStoreLoading,
		isModalVisible,
	]);

	const handleClose = () => {
		setAcknowledgementValue("");
		setIsDownloading(false);
		setGuestData({});
		if (onCloseRequest) {
			onCloseRequest();
			return;
		}
		performClose();
	};
	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			await downloadInstitutions({
				data: resolvedData,
				filename,
				format,
				translateFn: translateFn ?? tEnum,
				columnOrder: exportColumnOrder ?? [
					...DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER,
				],
			});
			await onAfterDownload?.({
				data: resolvedData,
				filename,
				format,
			});
			if (!onAfterDownload) {
				await notifyInstitutionDownload({
					filename,
					format,
					institutionCount: resolvedData.length,
					institutionIds: resolvedData.map((institution) => institution.id),
					requesterFirstName: String(guestData.vorname ?? ""),
					requesterLastName: String(guestData.nachname ?? ""),
					requesterEmail: String(guestData.email ?? ""),
					usagePurpose: String(guestData.datenverwendung ?? ""),
				});
			}
			handleClose();
		} finally {
			setIsDownloading(false);
		}
	};

	const guestFormConfig: FormWrapperConfig = {
		formId: "guest-download-form",
		hideActions: true,
		cardVariant: "none",
		layout: { columns: 2 },
		onChange: setGuestData,
		onSubmit: () => {},
		fields: [
			{
				name: "vorname",
				label: t("downloadModal.form.vorname", {
					ns: "content",
					defaultValue: "Vorname",
				}),
				layout: { span: "half" },
				type: "text",
				placeholder: t("downloadModal.form.placeholders.vorname", {
					ns: "content",
					defaultValue: "Vorname eingeben",
				}),
				required: true,
			},
			{
				name: "nachname",
				label: t("downloadModal.form.nachname", {
					ns: "content",
					defaultValue: "Nachname",
				}),
				layout: { span: "half" },
				type: "text",
				placeholder: t("downloadModal.form.placeholders.nachname", {
					ns: "content",
					defaultValue: "Nachname eingeben",
				}),
				required: true,
			},
			{
				name: "email",
				label: t("downloadModal.form.email", {
					ns: "content",
					defaultValue: "Ihre E-Mail-Adresse",
				}),
				type: "email",
				placeholder: t("downloadModal.form.placeholders.email", {
					ns: "content",
					defaultValue: "name@beispiel.de",
				}),
				required: true,
				layout: { span: "full" },
			},
			{
				name: "datenverwendung",
				label: t("downloadModal.form.datenverwendung", {
					ns: "content",
					defaultValue: "Wofür verwenden Sie die Daten?",
				}),
				type: "textarea",
				placeholder: t("downloadModal.form.placeholders.datenverwendung", {
					ns: "content",
					defaultValue: "Beschreiben Sie kurz den Verwendungszweck",
				}),
				required: true,
				layout: { span: "full" },
			},
		],
	};

	const content = (
		<div className="space-y-6 flex flex-col">
			{!isLoggedIn && (
				<div className="flex flex-col gap-4">
					<p className="body1">
						{t("downloadModal.guestIntro", {
							ns: "content",
							defaultValue:
								"Bevor Sie die Daten herunterladen können, bitten wir Sie noch um ein paar Informationen.",
						})}
					</p>
					<FormWrapper config={guestFormConfig} />
				</div>
			)}
			{isLoggedIn && (
				<p className="body1 mb-12">
					{t("downloadModal.description", {
						ns: "content",
						defaultValue:
							"Die Liste ihrer Kulturorte können Sie hier als Excel Tabelle herunterladen.",
					})}
				</p>
			)}
			<div className="flex flex-col md:flex-row gap-3">
				<Button type="button" variant="outline" onClick={handleClose}>
					{cancelLabel ?? t("cancel", { ns: "common", defaultValue: "Cancel" })}
				</Button>
				<Button
					type="button"
					disabled={!canDownload}
					onClick={() => void handleDownload()}
				>
					{confirmLabel ??
						t("institutionsTable.actions.downloadList", {
							ns: "content",
							defaultValue: "Liste herunterladen",
						})}
				</Button>
			</div>

			<RadioGroup
				value={acknowledgementValue}
				onValueChange={setAcknowledgementValue}
				className="gap-3"
			>
				<div className="flex items-start gap-3">
					<RadioGroupItem
						id="download-list-acknowledgement"
						value="accepted"
						className="mt-0.5 border-neutral-80"
					/>
					<Label
						htmlFor="download-list-acknowledgement"
						emphasize={false}
						className="body2 cursor-pointer mb-8"
					>
						{t("downloadModal.acknowledgement", {
							ns: "content",
							defaultValue:
								"Ich habe die rechtlichen Hinweise gelesen und verstanden",
						})}
					</Label>
				</div>
			</RadioGroup>
		</div>
	);

	return (
		<Modal
			containerClassName="max-w-3xl"
			title={
				title ??
				t("downloadModal.title", {
					ns: "content",
					defaultValue: "Meine Daten als Liste herunterladen",
				})
			}
			subtitle={
				subtitle ?? (
					<span className="flex items-center gap-1">
						<ArrowNarrowRight className="size-5 shrink-0" />
						{isHydratingInstitutions
							? t("downloadModal.loading", {
									ns: "content",
									defaultValue: "Kulturorte werden geladen …",
								})
							: t("downloadModal.subtitle", {
									ns: "content",
									count: institutionCount,
									defaultValue: "{{count}} Kulturorte zum Herunterladen",
								})}
					</span>
				)
			}
			open={open}
			routePath={routePath}
			returnTo={returnTo}
			variant="centered"
			hasFooter={hasFooter}
			showBackButton={false}
			onCloseRequest={handleClose}
			loadingState={{
				active: isHydratingInstitutions && isInstitutionStoreLoading,
				label: t("downloadModal.loading", {
					ns: "content",
					defaultValue: "Kulturorte werden geladen …",
				}),
			}}
		>
			{content}
		</Modal>
	);
}
