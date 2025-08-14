"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import ArrowNarrowRight from "@/icons/arrow-narrow-right.svg";
import { SelectedFilters } from "@/components/Filter/SelectedFilters";
import { useFilterData } from "@/components/Filter/hooks/useFilterData";
import { Button } from "@/components/ui/button";
import { downloadInstitutions, ExportFormat } from "@/lib/utils/downloadUtils";
import {
	InstitutionProperties,
	FilterState,
	District,
	CategoryWithSubcategories,
} from "@/types";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { useState } from "react";

interface DownloadModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode?: "all" | "filtered" | "selected";
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

function FormatSelection({
	selectedFormat,
	onFormatChange,
	t,
}: {
	selectedFormat: ExportFormat;
	onFormatChange: (format: ExportFormat) => void;
	t: (key: string) => string;
}) {
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

function DownloadActionButton({
	isDownloading,
	isDisabled,
	onDownload,
	t,
}: {
	isDownloading: boolean;
	isDisabled: boolean;
	onDownload: () => void;
	t: (key: string) => string;
}) {
	return (
		<div className="flex flex-col space-y-2">
			<Button className="w-full" onClick={onDownload} disabled={isDisabled}>
				{isDownloading
					? t("download.downloading")
					: t("download.downloadButton")}
			</Button>
		</div>
	);
}

function FilterSection({
	showFilters,
	filtersActive,
	filters,
	districts,
	categoryGroups,
	t,
}: {
	showFilters: boolean;
	filtersActive: boolean;
	filters: FilterState;
	districts: District[];
	categoryGroups: CategoryWithSubcategories[];
	t: (key: string, options?: Record<string, unknown>) => string;
}) {
	if (!showFilters || !filtersActive) {
		return null;
	}

	return (
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
	);
}

// eslint-disable-next-line max-params
function getDataSource(
	mode: string,
	institutions: FeatureCollection<Geometry, GeoJsonProperties> | null,
	originalInstitutions: FeatureCollection<Geometry, GeoJsonProperties> | null,
	selectedInstitutionId: string | number | null,
): FeatureCollection<Geometry, GeoJsonProperties> | null {
	switch (mode) {
		case "all":
			return originalInstitutions;
		case "selected":
			if (originalInstitutions && selectedInstitutionId) {
				const selectedFeatures = originalInstitutions.features.filter(
					(feature) => feature?.properties?.id === selectedInstitutionId,
				);
				return {
					type: "FeatureCollection",
					features: selectedFeatures,
				};
			}
			return null;
		default:
			return institutions;
	}
}

export function DownloadModal({
	open,
	onOpenChange,
	mode = "all",
}: DownloadModalProps) {
	const { t } = useTranslation(["content", "common", "enumMap"]);
	const { t: tEnum } = useTranslation("enumMap");
	const { institutions, originalInstitutions, selectedInstitutionId, filters } =
		useInstitutionStore();
	const { districts, categoryGroups } = useFilterData();
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xls");
	const [isDownloading, setIsDownloading] = useState(false);

	const showFilters = mode === "filtered";
	const dataSource = getDataSource(
		mode,
		institutions,
		originalInstitutions,
		selectedInstitutionId,
	);

	const handleDownload = async () => {
		if (!dataSource?.features || dataSource.features.length === 0) {
			return;
		}

		setIsDownloading(true);
		try {
			const institutionData = dataSource.features
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
		<DownloadSubtitle count={dataSource?.features?.length || 0} t={t} />
	);

	const filtersActive = hasActiveFilters(filters);

	const content = (
		<div className="space-y-6">
			<FilterSection
				showFilters={showFilters}
				filtersActive={filtersActive}
				filters={filters}
				districts={districts}
				categoryGroups={categoryGroups}
				t={t}
			/>

			<FormatSelection
				selectedFormat={selectedFormat}
				onFormatChange={setSelectedFormat}
				t={t}
			/>

			<DownloadActionButton
				isDownloading={isDownloading}
				isDisabled={isDownloading || !dataSource?.features?.length}
				onDownload={handleDownload}
				t={t}
			/>
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
