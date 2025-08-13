"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import { SelectedFilters } from "@/components/Filter/SelectedFilters";
import { useFilterData } from "@/components/Filter/hooks/useFilterData";
import { Button } from "@/components/ui/button";
import { downloadInstitutions, ExportFormat } from "@/lib/utils/downloadUtils";
import { InstitutionProperties } from "@/types";
import { useState } from "react";

interface DownloadModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface FormatSelectorProps {
	selectedFormat: ExportFormat;
	onFormatChange: (format: ExportFormat) => void;
	t: (key: string) => string;
}

function FormatSelector({
	selectedFormat,
	onFormatChange,
	t,
}: FormatSelectorProps) {
	const formats: ExportFormat[] = ["xls", "xlsx", "csv"];

	return (
		<div className="space-y-2">
			<p className="body2 font-bold">{t("downloadModal.chooseFormat")}</p>
			<div className="flex gap-2">
				{formats.map((format) => (
					<Button
						key={format}
						variant={selectedFormat === format ? "default" : "outline"}
						onClick={() => onFormatChange(format)}
					>
						{t(`fileFormat.${format}`)}
					</Button>
				))}
			</div>
		</div>
	);
}

interface DownloadSubtitleProps {
	count: number;
	t: (key: string, options?: Record<string, unknown>) => string;
}

function DownloadSubtitle({ count, t }: DownloadSubtitleProps) {
	return (
		<div className="flex items-center gap-2">
			<ArrowNarrowRight className="w-6 h-6" />
			{t("downloadModal.subtitle", {
				ns: "content",
				count,
			})}
		</div>
	);
}

function hasActiveFilters(filters: {
	district_keys: string[];
	category_keys: string[];
	subcategory_keys: string[];
}): boolean {
	return (
		filters.district_keys.length > 0 ||
		filters.category_keys.length > 0 ||
		filters.subcategory_keys.length > 0
	);
}

export function DownloadModal({ open, onOpenChange }: DownloadModalProps) {
	const { t } = useTranslation(["content", "common", "enumMap"]);
	const { t: tEnum } = useTranslation("enumMap");
	const { institutions, filters } = useInstitutionStore();
	const { districts, categoryGroups } = useFilterData();
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xls");
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
		if (!institutions?.features || institutions.features.length === 0) {
			return;
		}

		setIsDownloading(true);
		try {
			const institutionData = institutions.features
				.map((feature) => feature.properties)
				.filter(
					(properties): properties is InstitutionProperties =>
						properties !== null,
				);
			await downloadInstitutions({
				data: institutionData,
				filename: "kulturkataster_institutions",
				format: selectedFormat,
				translateFn: (key: string) => tEnum(key),
			});
		} catch (error) {
			console.error("Download failed:", error);
		} finally {
			setIsDownloading(false);
		}
	};

	const subtitle = (
		<DownloadSubtitle count={institutions?.features?.length || 0} t={t} />
	);

	const filtersActive = hasActiveFilters(filters);

	const content = (
		<div className="space-y-6">
			{filtersActive && (
				<div>
					<p className="body2 mb-3">
						{t("downloadModal.selectedFilters", { ns: "content" })}
					</p>
					<SelectedFilters
						filters={filters}
						districts={districts}
						categoryGroups={categoryGroups}
						showRemove={false}
						className="gap-2"
					/>
				</div>
			)}
			<FormatSelector
				selectedFormat={selectedFormat}
				onFormatChange={setSelectedFormat}
				t={t}
			/>

			<div className="flex flex-col space-y-2">
				<Button
					className="w-full"
					onClick={handleDownload}
					disabled={isDownloading || !institutions?.features?.length}
				>
					{isDownloading
						? t("downloadModal.downloading")
						: t("downloadModal.downloadButton")}
				</Button>
			</div>
		</div>
	);

	return (
		<PageModal
			open={open}
			onOpenChange={onOpenChange}
			title={t("downloadModal.title", { ns: "content" })}
			subtitle={subtitle}
			content={content}
			variant="medium"
			hasFooter={false}
		/>
	);
}
