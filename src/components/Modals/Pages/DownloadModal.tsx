"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
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
import { subscribeToNewsletter } from "@/server/actions/newsletter";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { cn } from "@/lib/utils";

type DownloadModalProps = {
	routePath?: string;
	open?: boolean;
	onCloseRequest?: () => void;
	returnTo?: string;
	isAuthenticated?: boolean;
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
	isAuthenticated,
	hasFooter = false,
	title,
	subtitle,
	data,
	filename = "kulturorte",
	format = "xls",
	translateFn,
	confirmLabel,
	cancelLabel,
	exportColumnOrder,
	onAfterDownload,
}: DownloadModalProps) {
	const { t } = useTranslation();
	const { t: tEnum } = useTranslation();
	const isModalVisible = open ?? true;
	const performClose = useRoutedModalClose({ returnTo });
	const toLocalePath = useLocalePath();
	const currentProfile = useAccountStore((s) => s.currentProfile);
	const isPublicDownloadFlow = data === undefined || data === null;
	const isLoggedIn =
		isAuthenticated ?? (!isPublicDownloadFlow && currentProfile !== null);
	const initializePublicData = useInstitutionStore(
		(s) => s.initializePublicData,
	);
	const filteredInstitutions = useInstitutionStore(
		(s) => s.filteredInstitutions,
	);
	const allInstitutions = useInstitutionStore((s) => s.allInstitutions);
	const isInstitutionStoreLoading = useInstitutionStore((s) => s.isLoading);
	const resolvedData = data ?? filteredInstitutions ?? allInstitutions ?? [];
	const institutionCount = resolvedData.length;
	const isHydratingInstitutions = !data && allInstitutions === null;
	const [hasAcceptedDataUseAgreement, setHasAcceptedDataUseAgreement] =
		useState(false);
	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
	const [wantsNewsletter, setWantsNewsletter] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [guestData, setGuestData] = useState<Record<string, unknown>>({});
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(format);
	const isGuestFormFilled =
		!isLoggedIn &&
		Boolean(
			guestData.vorname &&
				guestData.nachname &&
				guestData.email &&
				guestData.datenverwendung,
		);
	const canDownload =
		hasAcceptedDataUseAgreement &&
		hasAcceptedTerms &&
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
		setHasAcceptedDataUseAgreement(false);
		setHasAcceptedTerms(false);
		setWantsNewsletter(false);
		setIsDownloading(false);
		setGuestData({});
		setSelectedFormat(format);
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
				format: selectedFormat,
				translateFn: translateFn ?? tEnum,
				columnOrder: exportColumnOrder,
			});
			await onAfterDownload?.({
				data: resolvedData,
				filename,
				format: selectedFormat,
			});
			if (!onAfterDownload) {
				await notifyInstitutionDownload({
					filename,
					format: selectedFormat,
					institutionCount: resolvedData.length,
					institutionIds: resolvedData.map((institution) => institution.id),
					requesterFirstName: String(guestData.vorname ?? ""),
					requesterLastName: String(guestData.nachname ?? ""),
					requesterEmail: String(guestData.email ?? ""),
					usagePurpose: String(guestData.datenverwendung ?? ""),
				});
			}
			if (!isLoggedIn && wantsNewsletter) {
				await subscribeToNewsletter({
					email: String(guestData.email ?? ""),
					name: `${String(guestData.vorname ?? "")} ${String(guestData.nachname ?? "")}`.trim(),
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
				label: t("content.downloadModal.form.vorname", {
					defaultValue: "Vorname",
				}),
				layout: { span: "half" },
				type: "text",
				placeholder: t("content.downloadModal.form.placeholders.vorname", {
					defaultValue: "Vorname eingeben",
				}),
				required: true,
			},
			{
				name: "nachname",
				label: t("content.downloadModal.form.nachname", {
					defaultValue: "Nachname",
				}),
				layout: { span: "half" },
				type: "text",
				placeholder: t("content.downloadModal.form.placeholders.nachname", {
					defaultValue: "Nachname eingeben",
				}),
				required: true,
			},
			{
				name: "email",
				label: t("content.downloadModal.form.email", {
					defaultValue: "Ihre E-Mail-Adresse",
				}),
				type: "email",
				placeholder: t("content.downloadModal.form.placeholders.email", {
					defaultValue: "name@beispiel.de",
				}),
				required: true,
				layout: { span: "full" },
			},
			{
				name: "datenverwendung",
				label: t("content.downloadModal.form.datenverwendung", {
					defaultValue: "Wofür verwenden Sie die Daten?",
				}),
				type: "textarea",
				placeholder: t(
					"content.downloadModal.form.placeholders.datenverwendung",
					{
						defaultValue: "Beschreiben Sie kurz den Verwendungszweck",
					},
				),
				required: true,
				layout: { span: "full" },
			},
		],
	};

	const actionFormConfig: FormWrapperConfig = {
		formId: "download-actions-form",
		fields: [],
		onSubmit: () => handleDownload(),
		submitDisabled: !canDownload,
		submitLabel:
			confirmLabel ??
			t("content.institutionsTable.actions.downloadList", {
				defaultValue: "Liste herunterladen",
			}),
		showCancel: true,
		cancelLabel: cancelLabel ?? t("common.cancel", { defaultValue: "Cancel" }),
		onCancel: handleClose,
	};

	const content = (
		<div className="flex flex-col">
			{!isLoggedIn && (
				<div className="flex flex-col gap-4">
					<p className="body1">
						{t("content.downloadModal.guestIntro", {
							defaultValue:
								"Bevor Sie die Daten herunterladen können, bitten wir Sie noch um ein paar Informationen.",
						})}
					</p>
					<FormWrapper config={guestFormConfig} />
				</div>
			)}
			{isLoggedIn && (
				<p className="body1 mb-12">
					{t("content.downloadModal.description", {
						defaultValue:
							"Die Liste Ihrer Kulturorte können Sie hier in verschiedenen Dateiformaten herunterladen.",
					})}
				</p>
			)}
			<div className="flex flex-col space-y-4 mt-4">
				<div className="flex flex-col gap-3">
					<p className="body2 font-bold">
						{t("content.downloadModal.chooseFormat", {
							defaultValue: "Dateiformat wählen",
						})}
					</p>
					<div className="flex flex-wrap gap-4">
						{(["xls", "xlsx", "csv"] as const).map((exportFormat) => (
							<Button
								key={exportFormat}
								type="button"
								variant="outline"
								fullWidth={false}
								aria-pressed={selectedFormat === exportFormat}
								onClick={() => setSelectedFormat(exportFormat)}
								className={cn(
									selectedFormat === exportFormat &&
										"border-primary-dark bg-neutral-5",
								)}
							>
								{exportFormat.toUpperCase()}
							</Button>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-3">
					<div className="space-y-6 flex flex-col my-4">
						<strong>
							{t("content.downloadModal.dataUseAgreementTitle", {
								defaultValue: "Vereinbarung über die Datennutzung",
							})}
						</strong>
						<p className="body2">
							{t("content.downloadModal.dataUseAgreementText", {
								defaultValue:
									"Ich werde die Daten nicht an Dritte weitergeben, sie ausschließlich im Rahmen der gesetzlichen Vorgaben, insbesondere der DSGVO soweit personenbezogene Daten betroffen sind, sowie nur für die Zwecke des Kulturkatasters nutzen. Zwecke des Kulturkatasters sind nicht kommerzieller Natur und sind die systematische Erfassung, Strukturierung und öffentliche Bereitstellung von Daten über Orte kultureller Produktion und Nutzung im Land Berlin, um eine belastbare Datengrundlage für kulturpolitische Entscheidungen, kulturelle Stadtentwicklung sowie für die Zusammenarbeit zwischen Kulturakteur*innen, Verwaltung, Wissenschaft und Öffentlichkeit zu schaffen.",
							})}
						</p>
					</div>
					<div className="flex items-start gap-3">
						<Checkbox
							id="download-list-data-use-agreement"
							checked={hasAcceptedDataUseAgreement}
							onCheckedChange={(checked) =>
								setHasAcceptedDataUseAgreement(checked === true)
							}
							required
							aria-required="true"
							variant="filter"
							size="default"
							className="mt-0.5"
						/>

						<Label
							htmlFor="download-list-data-use-agreement"
							emphasize={false}
							className="body2 cursor-pointer"
						>
							{t("content.downloadModal.dataUseAgreementConsent", {
								defaultValue:
									"Ich bin einverstanden mit der Vereinbarung über die Datennutzung",
							})}
							<span className="ml-1">*</span>
						</Label>
					</div>
					<div className="flex items-start gap-3">
						<Checkbox
							id="download-list-acknowledgement"
							checked={hasAcceptedTerms}
							onCheckedChange={(checked) =>
								setHasAcceptedTerms(checked === true)
							}
							required
							aria-required="true"
							variant="filter"
							size="default"
							className="mt-0.5"
						/>

						<Label
							htmlFor="download-list-acknowledgement"
							emphasize={false}
							className="body2 cursor-pointer"
						>
							{t("content.downloadModal.acknowledgementPrefix", {
								defaultValue: "Ich habe den",
							})}{" "}
							<Link
								href={toLocalePath("/terms")}
								className="text-primary-dark underline"
								onClick={(event) => event.stopPropagation()}
							>
								{t("content.downloadModal.acknowledgementLink", {
									defaultValue: "rechtlichen Hinweis",
								})}
							</Link>{" "}
							{t("content.downloadModal.acknowledgementSuffix", {
								defaultValue: "gelesen und verstanden",
							})}
							<span className="ml-1">*</span>
						</Label>
					</div>
					{!isLoggedIn && (
						<div className="flex items-start gap-3">
							<Checkbox
								id="download-list-newsletter"
								checked={wantsNewsletter}
								onCheckedChange={(checked) =>
									setWantsNewsletter(checked === true)
								}
								variant="filter"
								size="default"
								className="mt-0.5"
							/>

							<Label
								htmlFor="download-list-newsletter"
								emphasize={false}
								className="body2 cursor-pointer"
							>
								{t("common.auth.register.newsletterOptInPrefix", {
									defaultValue:
										"Um auf dem Laufenden zu bleiben, möchte ich auch gleich den",
								})}{" "}
								<Link
									href={toLocalePath("/newsletter")}
									className="text-primary-dark underline"
									onClick={(event) => event.stopPropagation()}
								>
									{t("common.auth.register.newsletterLink", {
										defaultValue: "Newsletter abonnieren.",
									})}
								</Link>
							</Label>
						</div>
					)}
				</div>
			</div>
			<FormWrapper config={actionFormConfig} />
		</div>
	);

	return (
		<Modal
			containerClassName="max-w-3xl"
			title={
				title ??
				t("content.downloadModal.title", {
					defaultValue: "Meine Daten als Liste herunterladen",
				})
			}
			subtitle={
				subtitle ?? (
					<span className="flex items-center gap-1">
						<ArrowNarrowRight className="size-5 shrink-0" />
						{isHydratingInstitutions
							? t("content.downloadModal.loading", {
									defaultValue: "Kulturorte werden geladen …",
								})
							: t("content.downloadModal.subtitle", {
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
				label: t("content.downloadModal.loading", {
					defaultValue: "Kulturorte werden geladen …",
				}),
			}}
		>
			{content}
		</Modal>
	);
}
