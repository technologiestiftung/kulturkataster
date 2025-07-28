"use client";

import { useVenueStore } from "@/lib/store/venueStore";
import { getVenuesGeoJSON } from "@/lib/supabase/api";
import { VenueProperties } from "@/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
				// TODO: add api call to geht single venue
				const geoJsonData = await getVenuesGeoJSON();

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
					className="mt-4 text-primary hover:underline"
				>
					{t("venue.backToMap")}
				</button>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<h1>{venueData.name}</h1>
			<div className="pt-4 border-t">
				<button
					onClick={handleClose}
					className="text-sm text-primary hover:underline"
				>
					← {t("venue.backToMap")}
				</button>
			</div>
		</div>
	);
}
