"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ToggleButton,
	DynamicInfoBlock,
	organizationInfoConfig,
	fundingInfoConfig,
	facilityInfoConfig,
	statusInfoConfig,
	additionalInfoConfig,
	contactInfoConfig,
	InfoFieldConfig,
} from "@/components/Institution";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { animateMapToCoordinates } from "@/lib/utils/mapUtils";
import {
	getParentCategories,
	getSubcategoriesForCategory,
	getCoordinatesFromAddress,
} from "@/lib/utils/institutionUtils";
import { fromLonLat } from "ol/proj";
import { Category, Institution } from "@/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Address } from "@/components/Institution/Address";
import { InstitutionDetailSkeleton } from "./InstitutionDetailSkeleton";

const getNestedValue = (
	obj: Record<string, unknown>,
	path: string,
): unknown => {
	return path.split(".").reduce((current, key) => {
		if (current && typeof current === "object") {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj as unknown);
};

const hasValue = (value: unknown): boolean => {
	if (value === null || value === undefined || value === "") return false;
	if (typeof value === "object" && Object.keys(value).length === 0)
		return false;
	return true;
};

// Header component
function InstitutionHeader({
	institutionData,
	onCenterMap,
}: {
	institutionData: Institution;
	onCenterMap?: () => void;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const isInUse = institutionData.utilization_status === "in_use";

	return (
		<CardHeader
			className={`relative p-0 ${isInUse ? "bg-brand-default" : "bg-neutral-20"} ${
				onCenterMap ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
			}`}
			onClick={onCenterMap}
		>
			<p className="body2 p-4 pb-0">
				{institutionData.parent_organization || ""}
			</p>
			<CardTitle className="px-4 max-w-full overflow-hidden">
				<h1 id="institution-title" className="h1 wrap-anywhere">
					{institutionData.name}
				</h1>
			</CardTitle>

			{getParentCategories(institutionData).length > 0 && (
				<section className="px-4">
					{getParentCategories(institutionData).map((category: Category) => {
						const IconComponent = getCategoryIconComponent(category.key);
						const subcategories = getSubcategoriesForCategory(
							institutionData,
							category.id,
						);
						return (
							<div key={category.id} className="mb-2">
								<div className="flex items-center gap-2 h-6">
									<div className="w-6 h-6">
										<IconComponent aria-hidden="true" focusable="false" />
									</div>
									<strong className="body2 font-bold">
										{tEnum(`category.${category.key}`)}
									</strong>
								</div>
								{subcategories.length > 0 && (
									<div className="body2 pl-8">
										{subcategories.map((subcategory, index) => (
											<span key={subcategory.id}>
												{index > 0 && ", "}
												{tEnum(`subcategory.${subcategory.key}`)}
											</span>
										))}
									</div>
								)}
							</div>
						);
					})}
				</section>
			)}

			<div
				className={`${isInUse ? "bg-brand-light" : "bg-alert"} p-4 flex gap-2`}
			>
				<span className="body2">
					<strong className="font-bold">
						{t("institution.utilizationStatus")}:
					</strong>{" "}
				</span>

				{institutionData.utilization_status ? (
					<span className="body2">
						{tEnum(`utilization_status.${institutionData.utilization_status}`)}
					</span>
				) : (
					<span className="body2">{t("unknown")}</span>
				)}
			</div>
		</CardHeader>
	);
}

function InstitutionCard({
	institutionData,
	onCenterMap,
}: {
	institutionData: Institution;
	onCenterMap?: () => void;
}) {
	const [showMore, setShowMore] = useState(false);
	const hasFieldValue = (field: InfoFieldConfig) => {
		if (field.condition && !field.condition(institutionData)) {
			return false;
		}

		const value = getNestedValue(
			institutionData as unknown as Record<string, unknown>,
			field.dataPath,
		);
		return hasValue(value);
	};

	const hasExtendedInfo = () => {
		const configs = [
			organizationInfoConfig,
			fundingInfoConfig,
			facilityInfoConfig,
			statusInfoConfig,
			additionalInfoConfig,
		];

		return configs.some((config) =>
			config.fields.some((field) => hasFieldValue(field)),
		);
	};

	return (
		<Card className="w-full rounded-lg overflow-hidden border-none">
			<InstitutionHeader
				institutionData={institutionData}
				onCenterMap={onCenterMap}
			/>

			<CardContent className="p-4 space-y-4">
				<div className="space-y-4 flex flex-col">
					<Address institution={institutionData} />
					<DynamicInfoBlock
						institutionData={institutionData}
						config={contactInfoConfig}
					/>
				</div>

				{showMore && (
					<div className="space-y-4">
						<DynamicInfoBlock
							institutionData={institutionData}
							config={organizationInfoConfig}
						/>
						<DynamicInfoBlock
							institutionData={institutionData}
							config={fundingInfoConfig}
						/>
						<DynamicInfoBlock
							institutionData={institutionData}
							config={facilityInfoConfig}
						/>
						<DynamicInfoBlock
							institutionData={institutionData}
							config={statusInfoConfig}
						/>
						<DynamicInfoBlock
							institutionData={institutionData}
							config={additionalInfoConfig}
						/>
					</div>
				)}
				<ToggleButton
					showMore={showMore}
					onClick={() => setShowMore(!showMore)}
					hasInfo={hasExtendedInfo()}
				/>
			</CardContent>
		</Card>
	);
}

export function InstitutionDetailContent() {
	const { t } = useTranslation("common");
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);
	const map = useMapStore((state) => state.map);

	const [institutionData, setInstitutionData] = useState<Institution | null>(
		null,
	);
	const [loading, setLoading] = useState(false);

	const findInstitution = (id: number | string) => {
		const numericId = typeof id === "string" ? Number(id) : id;
		return institutions?.find((institution) => institution.id === numericId);
	};

	const centerMapToInstitution = () => {
		if (!institutionData || !map) {
			return;
		}
		const institution = findInstitution(institutionData.id);
		if (!institution || !institution.address) {
			return;
		}
		const address = getCoordinatesFromAddress(institution.address);
		if (address) {
			const transformedCoords = fromLonLat(address);
			animateMapToCoordinates(map, transformedCoords);
		}
	};

	useEffect(() => {
		if (!selectedInstitutionId) {
			setInstitutionData(null);
			return;
		}

		const fetchInstitutionData = async () => {
			try {
				setLoading(true);
				const normalizedId =
					typeof selectedInstitutionId === "string"
						? Number(selectedInstitutionId)
						: selectedInstitutionId;
				setInstitutionData(
					(institutions?.find(
						(institution) => institution.id === normalizedId,
					) as Institution) || null,
				);
			} catch (error) {
				console.error("Failed to fetch institution data:", error);
				setInstitutionData(null);
			} finally {
				setLoading(false);
			}
		};

		fetchInstitutionData();
	}, [selectedInstitutionId, institutions]);

	const handleClose = () => setSelectedInstitutionId(null);

	if (!selectedInstitutionId) return null;

	if (loading) {
		return <InstitutionDetailSkeleton />;
	}

	if (!institutionData) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">{t("institution.notFound")}</p>
				<Button
					onClick={handleClose}
					variant="link"
					className="mt-4 text-primary-dark hover:underline p-0 h-auto"
				>
					{t("institution.backToMap")}
				</Button>
			</div>
		);
	}

	return (
		<section
			className="p-2 h-full w-full"
			aria-labelledby="institution-title"
			aria-live="polite"
		>
			<InstitutionCard
				institutionData={institutionData}
				onCenterMap={centerMapToInstitution}
			/>
		</section>
	);
}
