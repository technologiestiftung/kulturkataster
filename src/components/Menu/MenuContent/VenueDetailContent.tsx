"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVenueStore } from "@/lib/store/venueStore";
import { getVenuesGeoJSON } from "@/lib/supabase/api";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils"; // Update this import path
import { Category, VenueProperties } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function VenueHeader({
	venueData,
}: {
	venueData: VenueProperties;
	onClose: () => void;
}) {
	const { t } = useTranslation("common");

	return (
		<CardHeader
			className={`relative p-0 ${venueData.utilization_status === "in_use" ? "bg-brand-default" : "bg-neutral-20"}`}
		>
			<CardTitle className="text-xl px-4 pt-4 font-bold">
				{venueData.name}
			</CardTitle>

			<div className="flex px-4 items-center gap-2 text-sm">
				{venueData.categories?.map((category: Category) => {
					const IconComponent = getCategoryIconComponent(category.key);

					return (
						<div key={category.id}>
							<div className="flex items-center gap-2 h-6">
								<div className="w-6 h-6">
									<IconComponent />
								</div>
								<span className="text-md font-semibold">
									{/* add category name */}
									{category.key}
								</span>
							</div>
							<span className="pl-8">Subtitle</span>
						</div>
					);
				})}
			</div>

			<div
				className={`${venueData.utilization_status === "in_use" ? "bg-brand-light" : "bg-alert"} p-4`}
			>
				{t("venue.utilizationStatus", "Nutzungsstatus")}:{" "}
				{venueData.utilization_status || venueData.status || "in Nutzung"}
			</div>
		</CardHeader>
	);
}

function VenueBasicInfo({ venueData }: { venueData: VenueProperties }) {
	return (
		<>
			<div>
				<h3 className="font-semibold text-lg">{venueData.name}</h3>
				<div className="text-sm space-y-1">
					<div>
						{venueData.street} {venueData.street_number}
					</div>
					<div>{venueData.zip_code}</div>
				</div>
			</div>

			<div className="rounded space-y-2 bg-neutral-5 p-4">
				{venueData.description && (
					<div>
						<span className="font-semibold">Kulturareal:</span>
						<div className="text-sm">{venueData.description}</div>
					</div>
				)}

				{venueData.website && (
					<div>
						<span className="font-semibold">Website:</span>
						<div>
							<a
								href={venueData.website}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-primary-dark hover:underline"
							>
								{venueData.website}
							</a>
						</div>
					</div>
				)}

				{venueData.phone && (
					<div>
						<span className="font-semibold">Telefonnummer:</span>
						<div>
							<a href={`tel:${venueData.phone}`} className="text-sm">
								{venueData.phone}
							</a>
						</div>
					</div>
				)}

				{venueData.email && (
					<div>
						<span className="font-semibold">E-Mail-Adresse:</span>
						<div>
							<a
								href={`mailto:${venueData.email}`}
								className="text-sm text-primary-dark hover:underline"
							>
								{venueData.email}
							</a>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

function VenueAdministrativeInfo({
	venueData,
}: {
	venueData: VenueProperties;
}) {
	return (
		<div className="space-y-2">
			{venueData.funding_type && (
				<div>
					<span className="font-medium text-sm">Art der Finanzierung:</span>
					<span className="text-sm ml-2">{venueData.funding_type}</span>
				</div>
			)}

			{venueData.support_type && (
				<div>
					<span className="font-medium text-sm">Art der Förderung:</span>
					<span className="text-sm ml-2">{venueData.support_type}</span>
				</div>
			)}

			<div>
				<span className="font-medium text-sm">Bezirk:</span>
				{/* todo: add Bezirk */}
				<span className="text-sm ml-2">{venueData.district_id}</span>
			</div>

			{/* todo: add Stadtteil */}
			{/* <div>
				<span className="font-medium text-sm">Stadtteil:</span>
				<span className="text-sm text-gray-600 ml-2"></span>
			</div> */}
		</div>
	);
}

function VenueCapacityInfo({ venueData }: { venueData: VenueProperties }) {
	return (
		<div className="space-y-2">
			{venueData.capacity && (
				<div>
					<span className="font-medium text-sm">
						Größe der Nutzflächen (m²):
					</span>
					<span className="text-sm text-gray-600 ml-2">
						{venueData.capacity}
					</span>
				</div>
			)}

			{venueData.rooms_count && (
				<div>
					<span className="font-medium text-sm">Anzahl der Arbeitsräume:</span>
					<span className="text-sm text-gray-600 ml-2">
						{venueData.rooms_count}
					</span>
				</div>
			)}

			<div>
				<span className="font-medium text-sm">Mehrfachnutzung:</span>
				<span className="text-sm text-gray-600 ml-2">
					{venueData.shared_use_allowed ? "möglich" : "nicht möglich"}
				</span>
			</div>

			{venueData.shared_use_allowed && (
				<div>
					<div className="font-medium text-sm">Beschreibung:</div>
					<div className="text-sm text-gray-600">
						Beschreibung Räume/Flächen für Mehrfachnutzung
					</div>
				</div>
			)}
		</div>
	);
}

function VenueExtendedInfo({ venueData }: { venueData: VenueProperties }) {
	return (
		<div className="bg-gray-50 p-3 rounded space-y-3">
			<VenueAdministrativeInfo venueData={venueData} />
			<VenueCapacityInfo venueData={venueData} />

			{venueData.established_since && (
				<div className="pt-2 border-t">
					<div>
						<span className="font-medium text-sm">Stand:</span>
						<span className="text-sm text-gray-600 ml-2">
							{venueData.established_since}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

function hasExtendedInfo(venueData: VenueProperties): boolean {
	return !!(
		venueData.categories?.length ||
		venueData.subcategories?.length ||
		venueData.tags?.length ||
		venueData.parent_organizations?.length ||
		venueData.established_since
	);
}

function VenueToggleButton({
	showMoreInfo,
	onToggle,
}: {
	showMoreInfo: boolean;
	onToggle: () => void;
}) {
	const { t } = useTranslation("common");

	return (
		<Button
			variant="ghost"
			onClick={onToggle}
			className="w-full gap-2 justify-start text-primary-dark p-0 h-auto"
		>
			{showMoreInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
			<span>
				{showMoreInfo
					? t("venue.lessInfo", "Weniger Informationen")
					: t("venue.moreInfo", "Mehr Informationen")}
			</span>
		</Button>
	);
}

function VenueCard({
	venueData,
	onClose,
}: {
	venueData: VenueProperties;
	onClose: () => void;
}) {
	const [showMoreInfo, setShowMoreInfo] = useState(false);
	const hasExtended = hasExtendedInfo(venueData);

	return (
		<Card className="w-full rounded-lg overflow-hidden border-none">
			<VenueHeader venueData={venueData} onClose={onClose} />

			<CardContent className="p-4 space-y-4">
				<VenueBasicInfo venueData={venueData} />

				{hasExtended && (
					<VenueToggleButton
						showMoreInfo={showMoreInfo}
						onToggle={() => setShowMoreInfo(!showMoreInfo)}
					/>
				)}

				{showMoreInfo && <VenueExtendedInfo venueData={venueData} />}
			</CardContent>
		</Card>
	);
}

export function VenueDetailContent() {
	const { t } = useTranslation("common");
	const selectedVenueId = useVenueStore((state) => state.selectedVenueId);
	const setSelectedVenueId = useVenueStore((state) => state.setSelectedVenueId);
	const [venueData, setVenueData] = useState<VenueProperties | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!selectedVenueId) {
			setVenueData(null);
			return;
		}

		const fetchVenueData = async () => {
			try {
				setLoading(true);
				const geoJsonData = await getVenuesGeoJSON();
				// Find the venue with the matching ID
				const venue = geoJsonData.features.find(
					(feature) => feature.properties?.id === selectedVenueId,
				);

				if (venue) {
					setVenueData(venue.properties as VenueProperties);
				} else {
					setVenueData(null);
				}
			} catch (error) {
				console.error("Failed to fetch venue data:", error);
				setVenueData(null);
			} finally {
				setLoading(false);
			}
		};

		fetchVenueData();
	}, [selectedVenueId]);

	const handleClose = () => {
		setSelectedVenueId(null);
	};

	if (!selectedVenueId) {
		return null;
	}

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
					<div className="h-3 bg-gray-200 rounded w-2/3"></div>
				</div>
			</div>
		);
	}

	if (!venueData) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">{t("venue.notFound")}</p>
				<button
					onClick={handleClose}
					className="mt-4 text-primary-dark hover:underline"
				>
					{t("venue.backToMap")}
				</button>
			</div>
		);
	}

	return (
		<div className="p-2">
			<VenueCard venueData={venueData} onClose={handleClose} />
		</div>
	);
}
