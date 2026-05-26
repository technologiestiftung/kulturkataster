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
	const { t } = useTranslation(["content", "common", "enumMap"]);
	const { t: tEnum } = useTranslation("enumMap");
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
		hasAcceptedTerms && !isDownloading && (isLoggedIn || isGuestFormFilled);

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
				columnOrder: exportColumnOrder ?? [
					...DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER,
				],
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

	const actionFormConfig: FormWrapperConfig = {
		formId: "download-actions-form",
		fields: [],
		onSubmit: () => handleDownload(),
		submitDisabled: !canDownload,
		submitLabel:
			confirmLabel ??
			t("institutionsTable.actions.downloadList", {
				ns: "content",
				defaultValue: "Liste herunterladen",
			}),
		showCancel: true,
		cancelLabel:
			cancelLabel ?? t("cancel", { ns: "common", defaultValue: "Cancel" }),
		onCancel: handleClose,
	};

	const content = (
		<div className="flex flex-col">
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
							"Die Liste Ihrer Kulturorte können Sie hier in verschiedenen Dateiformaten herunterladen.",
					})}
				</p>
			)}
			<div className="flex flex-col space-y-4 mt-4">
				<div className="flex flex-col gap-3">
					<p className="body2 font-bold">
						{t("downloadModal.chooseFormat", {
							ns: "content",
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
						<strong>Vereinbarung über die Datennutzung</strong>
						<p className="body2">
							Ich werde die Daten nicht an Dritte weitergeben, sie
							ausschließlich im Rahmen der gesetzlichen Vorgaben, insbesondere
							der DSGVO soweit personenbezogene Daten betroffen sind, sowie nur
							für die Zwecke des Kulturkatasters nutzen. Zwecke des Kulturkaters
							sind nicht kommerzieller Natur und sind die systematische
							Erfassung, Strukturierung und öffentliche Bereitstellung von Daten
							über Orte kultureller Produktion und Nutzung im Land Berlin, um
							eine belastbare Datengrundlage für kulturpolitische
							Entscheidungen, kulturelle Stadtentwicklung sowie für die
							Zusammenarbeit zwischen Kulturakteur*innen, Verwaltung,
							Wissenschaft und Öffentlichkeit zu schaffen.
						</p>
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
							{t("downloadModal.acknowledgementPrefix", {
								ns: "content",
								defaultValue: "Ich habe den",
							})}{" "}
							<Link
								href={toLocalePath("/terms")}
								className="text-primary-dark underline"
								onClick={(event) => event.stopPropagation()}
							>
								{t("downloadModal.acknowledgementLink", {
									ns: "content",
									defaultValue: "rechtlichen Hinweis",
								})}
							</Link>{" "}
							{t("downloadModal.acknowledgementSuffix", {
								ns: "content",
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
								{t("auth.register.newsletterOptInPrefix", {
									ns: "common",
									defaultValue:
										"Um auf dem Laufenden zu bleiben, möchte ich auch gleich den",
								})}{" "}
								<Link
									href={toLocalePath("/newsletter")}
									className="text-primary-dark underline"
									onClick={(event) => event.stopPropagation()}
								>
									{t("auth.register.newsletterLink", {
										ns: "common",
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
