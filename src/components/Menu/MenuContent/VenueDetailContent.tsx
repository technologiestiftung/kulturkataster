"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVenueStore } from "@/lib/store/venueStore";
import { getVenuesGeoJSON } from "@/lib/supabase/api";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { Category, VenueProperties } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function InfoItem({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<p className="body2 font-bold break-words">{label}:</p>
			<p className="body2 break-words">{children}</p>
		</div>
	);
}

function InfoSection({ children }: { children: React.ReactNode }) {
	return <div className="rounded space-y-4 p-4 bg-neutral-5">{children}</div>;
}

function ContactLink({
	href,
	children,
	external = false,
}: {
	href: string;
	children: React.ReactNode;
	external?: boolean;
}) {
	const props = external
		? { target: "_blank", rel: "noopener noreferrer" }
		: {};

	return (
		<a
			href={href}
			className="body2 text-primary-dark hover:underline break-all"
			{...props}
		>
			{children}
		</a>
	);
}

// Header component
function VenueHeader({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const isInUse = venueData.utilization_status === "in_use";

	return (
		<CardHeader
			className={`relative p-0 ${isInUse ? "bg-brand-default" : "bg-neutral-20"}`}
		>
			<p className="body2 p-4 pb-0">
				{venueData.parent_organizations?.[0]?.name || ""}
			</p>
			<CardTitle className="px-4">
				<h1 className="h1 break-words">{venueData.name}</h1>
			</CardTitle>

			{venueData.categories?.length > 0 && (
				<section className="px-4">
					{venueData.categories.map((category: Category) => {
						const IconComponent = getCategoryIconComponent(category.key);
						return (
							<div key={category.id} className="mb-2">
								<div className="flex items-center gap-2 h-6">
									<div className="w-6 h-6">
										<IconComponent />
									</div>
									<p className="body2 font-bold break-words">
										{tEnum(`category.${category.key}`)}
									</p>
								</div>
								<p className="body2 pl-8 break-words">{t("venue.subtitle")}</p>
							</div>
						);
					})}
				</section>
			)}

			{venueData.utilization_status && (
				<div
					className={`${isInUse ? "bg-brand-light" : "bg-alert"} p-4 flex gap-2`}
				>
					<span className="body2 font-bold">
						{t("venue.utilizationStatus")}:{" "}
					</span>
					<span className="body2">
						{tEnum(`utilization_status.${venueData.utilization_status}`)}
					</span>
				</div>
			)}
		</CardHeader>
	);
}

// Basic info component
function VenueBasicInfo({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");

	return (
		<div>
			<address className="not-italic mb-4">
				<p className="body1 break-words">{venueData.name}</p>
				{venueData.street && venueData.street_number && venueData.zip_code && (
					<div className="body1">
						<p className="break-words">
							{venueData.street} {venueData.street_number}
						</p>
						<p className="break-words">{venueData.zip_code}</p>
					</div>
				)}
			</address>

			<InfoSection>
				{venueData.description && (
					<InfoItem label={t("venue.culturalArea")}>
						{venueData.description}
					</InfoItem>
				)}

				{venueData.website && (
					<InfoItem label={t("venue.website")}>
						<ContactLink href={venueData.website} external>
							{venueData.website}
						</ContactLink>
					</InfoItem>
				)}

				{venueData.phone && (
					<InfoItem label={t("venue.phoneNumber")}>
						<ContactLink href={`tel:${venueData.phone}`}>
							{venueData.phone}
						</ContactLink>
					</InfoItem>
				)}

				{venueData.email && (
					<InfoItem label={t("venue.emailAddress")}>
						<ContactLink href={`mailto:${venueData.email}`}>
							{venueData.email}
						</ContactLink>
					</InfoItem>
				)}
			</InfoSection>
		</div>
	);
}

// Extended info component
function VenueExtendedInfo({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<div className="space-y-4">
			<InfoSection>
				{venueData.funding_type && (
					<InfoItem label={t("venue.fundingType")}>
						{tEnum(`funding_type.${venueData.funding_type}`)}
					</InfoItem>
				)}
				{venueData.support_type && (
					<InfoItem label={t("venue.supportType")}>
						{venueData.support_type}
					</InfoItem>
				)}
				{venueData.district_id && (
					<InfoItem label={t("venue.district")}>
						{tEnum(`district_id.${venueData.district_id}`)}
					</InfoItem>
				)}
			</InfoSection>

			<InfoSection>
				{venueData.capacity && (
					<InfoItem label={t("venue.usableAreaSize")}>
						{venueData.capacity}
					</InfoItem>
				)}
				{venueData.rooms_count && (
					<InfoItem label={t("venue.workspaceCount")}>
						{venueData.rooms_count}
					</InfoItem>
				)}
				<InfoItem label={t("venue.multipleUse")}>
					{venueData.shared_use_allowed
						? t("venue.multipleUsePossible")
						: t("venue.multipleUseNotPossible")}
				</InfoItem>
				{venueData.shared_use_allowed && (
					<InfoItem label={t("venue.description")}>
						{t("venue.multipleUseDescription")}
					</InfoItem>
				)}
			</InfoSection>

			{venueData.established_since && (
				<InfoSection>
					<InfoItem label={t("venue.status")}>
						{venueData.established_since}
					</InfoItem>
				</InfoSection>
			)}
		</div>
	);
}

const EXTENDED_INFO_FIELDS = [
	"funding_type",
	"support_type",
	"capacity",
	"rooms_count",
	"established_since",
	"shared_use_allowed",
	"district_id",
] as const;

function VenueCard({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");
	const [showMore, setShowMore] = useState(false);

	const hasExtendedInfo = EXTENDED_INFO_FIELDS.some((field) =>
		Boolean(venueData[field]),
	);

	return (
		<Card className="w-full rounded-lg overflow-hidden border-none">
			<VenueHeader venueData={venueData} />

			<CardContent className="p-4 space-y-4">
				<VenueBasicInfo venueData={venueData} />

				{showMore && <VenueExtendedInfo venueData={venueData} />}

				{hasExtendedInfo && (
					<Button
						variant="accordion"
						size="icon-default"
						onClick={() => setShowMore(!showMore)}
						className=""
					>
						{showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						<span className="body2">
							{showMore ? t("venue.lessInfo") : t("venue.moreInfo")}
						</span>
					</Button>
				)}
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
				const venue = geoJsonData.features.find(
					(feature) => feature.properties?.id === selectedVenueId,
				);
				setVenueData((venue?.properties as VenueProperties) || null);
			} catch (error) {
				console.error("Failed to fetch venue data:", error);
				setVenueData(null);
			} finally {
				setLoading(false);
			}
		};

		fetchVenueData();
	}, [selectedVenueId]);

	const handleClose = () => setSelectedVenueId(null);

	if (!selectedVenueId) return null;

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
					<div className="h-3 bg-gray-200 rounded w-2/3"></div>
				</div>
			</div>
		);
	}

	if (!venueData) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">{t("venue.notFound")}</p>
				<Button
					onClick={handleClose}
					variant="link"
					className="mt-4 text-primary-dark hover:underline p-0 h-auto"
				>
					{t("venue.backToMap")}
				</Button>
			</div>
		);
	}

	return (
		<main className="p-2">
			<VenueCard venueData={venueData} />
		</main>
	);
}
