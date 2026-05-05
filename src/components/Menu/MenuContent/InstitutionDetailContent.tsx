"use client";

import { Button } from "@/components/ui/button";
import {
	detailsInfoConfig,
	organizationInfoConfig,
	facilityInfoConfig,
	additionalInfoConfig,
	contactInfoConfig,
} from "@/components/Institution";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useMapStore } from "@/lib/store/mapStore";
import { animateMapToCoordinates } from "@/lib/utils/mapUtils";
import { getCoordinatesFromAddress } from "@/lib/utils/institutionUtils";
import { fromLonLat } from "ol/proj";
import { Institution } from "@/types";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useFieldLabel } from "@/lib/hooks/useFieldLabel";
import { InstitutionDetailSkeleton } from "./InstitutionDetailSkeleton";
import { InfoWrapper } from "@/components/InfoWrapper";
import { useInstitutionPrivateFieldResolver } from "@/lib/hooks/useInstitutionPrivateFieldResolver";

function InstitutionCard({
	institutionData,
	onCenterMap,
}: {
	institutionData: Institution;
	onCenterMap?: () => void;
}) {
	const { t } = useTranslation("common");
	const fieldLabel = useFieldLabel();
	const { isPrivateField } = useInstitutionPrivateFieldResolver();

	const getHeroStatus = () => {
		if (institutionData.utilization_status === "in_use") {
			return "in_use";
		}
		if (institutionData.utilization_status) {
			return "not_in_use";
		}
		return "unknown";
	};

	return (
		<section className="w-full rounded-lg overflow-hidden">
			<InfoWrapper
				data={institutionData}
				config={{
					className: "mb-0 gap-0 bg-background",
					isPrivateField,
					showPrivateBadge: true,
					fields: [
						{
							type: "section",
							id: "header",
							cardVariant: "none",
							className: "mb-0 [&>*]:space-y-0",
							fields: [
								{
									type: "section",
									id: "header",
									cardVariant: "hero",
									className: "mb-0",
									heroStatus: getHeroStatus(),
									onClick: onCenterMap,
									fields: [
										{
											id: "parent_organization",
											type: "text",
											value: "parent_organization",
										},
										{
											id: "name",
											alwaysShow: true,
											value: "name",
											type: "title",
										},
										{
											id: "categories",
											alwaysShow: true,
											categoryVariant: "default",
											type: "category",
										},
									],
								},
								{
									id: "utilization_status",
									alwaysShow: true,
									label: fieldLabel("utilization_status"),
									className: "mb-0",
									type: "status",
									value: "utilization_status",
									enumKey: "utilization_status",
								},
								{
									id: "protection_status",
									alwaysShow: false,
									label: fieldLabel("protection_status"),
									type: "status",
									value: "protection_status",
									enumKey: "protection_status",
								},
							],
						},
						{
							type: "section",
							id: "details",
							layout: {
								columns: 1,
							},
							className: "p-4 bg-background space-y-4",
							cardVariant: "none",
							fields: [
								{
									id: "address",
									alwaysShow: true,
									type: "address",
									addressOptions: {
										showMapLink: false,
										showCopy: false,
									},
								},
								{
									type: "section",
									id: "contact",
									cardVariant: "tertiary",
									fields: contactInfoConfig,
								},
								{
									type: "section",
									id: "collapsible-details",
									cardVariant: "none",
									collapsible: true,
									accordionVariant: "secondary",
									title: (
										<>
											<span className="group-data-[state=open]:hidden">
												{t("institution.moreInfo")}
											</span>
											<span className="group-data-[state=closed]:hidden">
												{t("institution.lessInfo")}
											</span>
										</>
									),
									className: "space-y-4",
									fields: [
										{
											type: "section",
											id: "organization",
											alwaysShow: false,
											cardVariant: "tertiary",
											fields: detailsInfoConfig,
										},
										{
											type: "section",
											id: "funding",
											alwaysShow: false,
											cardVariant: "tertiary",
											fields: organizationInfoConfig,
										},
										{
											type: "section",
											id: "facility",
											cardVariant: "tertiary",
											fields: facilityInfoConfig,
										},
										{
											type: "section",
											id: "additional",
											cardVariant: "tertiary",
											fields: additionalInfoConfig,
										},
									],
								},
							],
						},
					],
				}}
			/>
		</section>
	);
}

export function InstitutionDetailContent() {
	const { t } = useTranslation("common");
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const isLoading = useInstitutionStore((state) => state.isLoading);
	const error = useInstitutionStore((state) => state.error);
	const map = useMapStore((state) => state.map);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const params = useParams();

	const resolvedInstitutionId = useMemo(() => {
		const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
		if (!rawId) return null;
		const numericId = Number(rawId);
		return Number.isFinite(numericId) ? numericId : null;
	}, [params]);

	const institutionData = useMemo(() => {
		if (!resolvedInstitutionId || !institutions) return null;
		return (
			institutions.find(
				(institution) => institution.id === resolvedInstitutionId,
			) ?? null
		);
	}, [institutions, resolvedInstitutionId]);

	const centerMapToInstitution = () => {
		if (!institutionData || !map) {
			return;
		}
		if (!institutionData.address) {
			return;
		}
		const address = getCoordinatesFromAddress(institutionData.address);
		if (address) {
			const transformedCoords = fromLonLat(address);
			animateMapToCoordinates(map, transformedCoords);
		}
	};

	useEffect(() => {
		if (!institutionData || !map) return;
		centerMapToInstitution();
	}, [institutionData, map]);

	const handleClose = () => {
		router.push(toLocalePath("/map"));
	};

	if (!resolvedInstitutionId) return null;

	if (isLoading && !institutionData) {
		return <InstitutionDetailSkeleton />;
	}

	if (!institutionData) {
		return (
			<div className="p-6">
				<p className="text-foreground">{error ?? t("institution.notFound")}</p>
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
