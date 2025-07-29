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

// Reusable content display components
interface ContentItemProps {
	label: string;
	children: React.ReactNode;
	className?: string;
}

function ContentItem({ label, children, className = "" }: ContentItemProps) {
	return (
		<div className={`${className}`}>
			<dt className="body2 font-bold">{label}:</dt>
			<dd className="body2">{children}</dd>
		</div>
	);
}

interface ContentSectionProps {
	title?: string;
	children: React.ReactNode;
	className?: string;
	as?: "section" | "div";
}

function ContentSection({
	title,
	children,
	className = "",
	as: Component = "div",
}: ContentSectionProps) {
	return (
		<Component className={`rounded space-y-2 p-4 bg-neutral-5 ${className}`}>
			{title && <p className="body2 font-bold">{title}</p>}
			<dl className="flex flex-col gap-4">{children}</dl>
		</Component>
	);
}

interface ContactLinkProps {
	href: string;
	children: React.ReactNode;
	className?: string;
	external?: boolean;
}

function ContactLink({
	href,
	children,
	className = "body2 text-primary-dark hover:underline",
	external = false,
}: ContactLinkProps) {
	const props = external
		? { target: "_blank", rel: "noopener noreferrer" }
		: {};

	return (
		<a href={href} className={className} {...props}>
			{children}
		</a>
	);
}

function VenueHeader({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<CardHeader
			className={`relative p-0 ${
				venueData.utilization_status === "in_use"
					? "bg-brand-default"
					: "bg-neutral-20"
			}`}
		>
			<p className="body2 p-4 pb-0">{venueData.parent_organizations[0].name}</p>
			<CardTitle className="px-4">
				<h1 className="h1">{venueData.name}</h1>
			</CardTitle>

			{venueData.categories && venueData.categories.length > 0 && (
				<section className="px-4" aria-labelledby="categories-heading">
					<h2 id="categories-heading" className="sr-only">
						{t("venue.categories", "Kategorien")}
					</h2>
					<ul className="flex flex-col gap-2">
						{venueData.categories.map((category: Category) => {
							const IconComponent = getCategoryIconComponent(category.key);

							return (
								<li key={category.id}>
									<div className="flex items-center gap-2 h-6">
										<div className="w-6 h-6" aria-hidden="true">
											<IconComponent />
										</div>
										<p className="body2 font-bold">
											{tEnum(`category.${category.key}`)}
										</p>
									</div>
									<p className="body2 pl-8">{t("venue.subtitle")}</p>
								</li>
							);
						})}
					</ul>
				</section>
			)}

			<div
				className={`${
					venueData.utilization_status === "in_use"
						? "bg-brand-light"
						: "bg-alert"
				} p-4 flex gap-2`}
				role="status"
				aria-live="polite"
			>
				<span className="body2 font-bold">
					{t("venue.utilizationStatus")}:{" "}
				</span>
				<span className="body2">
					{tEnum(`utilization_status.${venueData.utilization_status}`)}
				</span>
			</div>
		</CardHeader>
	);
}

function VenueBasicInfo({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");

	return (
		<section aria-labelledby="basic-info-heading">
			<h2 id="basic-info-heading" className="sr-only">
				{t("venue.basicInfoHeading")}
			</h2>

			<address className="not-italic mb-4">
				<p className="body1">{venueData.name}</p>
				<div className="body1">
					<p>
						{venueData.street} {venueData.street_number}
					</p>
					<p>{venueData.zip_code}</p>
				</div>
			</address>

			<ContentSection className="flex flex-col gap-4">
				{venueData.description && (
					<ContentItem label={t("venue.culturalArea")}>
						{venueData.description}
					</ContentItem>
				)}

				{venueData.website && (
					<ContentItem label={t("venue.website")}>
						<ContactLink href={venueData.website} external>
							{venueData.website}
						</ContactLink>
					</ContentItem>
				)}

				{venueData.phone && (
					<ContentItem label={t("venue.phoneNumber")}>
						<ContactLink href={`tel:${venueData.phone}`} className="body2">
							{venueData.phone}
						</ContactLink>
					</ContentItem>
				)}

				{venueData.email && (
					<ContentItem label={t("venue.emailAddress")}>
						<ContactLink
							href={`mailto:${venueData.email}`}
							className="body2 text-primary-dark hover:underline"
						>
							{venueData.email}
						</ContactLink>
					</ContentItem>
				)}
			</ContentSection>
		</section>
	);
}

function VenueAdministrativeInfo({
	venueData,
}: {
	venueData: VenueProperties;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<ContentSection as="section">
			{venueData.funding_type && (
				<ContentItem label={t("venue.fundingType")}>
					{tEnum(`funding_type.${venueData.funding_type}`)}
				</ContentItem>
			)}
			{venueData.support_type && (
				<ContentItem label={t("venue.supportType")}>
					{venueData.support_type}
				</ContentItem>
			)}
			{venueData.district_id && (
				<ContentItem label={t("venue.district")}>
					{tEnum(`berlin_district.${venueData.district_id}`)}
				</ContentItem>
			)}
		</ContentSection>
	);
}

function VenueCapacityInfo({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");

	return (
		<ContentSection as="section">
			{venueData.capacity && (
				<ContentItem label={t("venue.usableAreaSize")}>
					{venueData.capacity}
				</ContentItem>
			)}

			{venueData.rooms_count && (
				<ContentItem label={t("venue.workspaceCount")}>
					{venueData.rooms_count}
				</ContentItem>
			)}

			<ContentItem label={t("venue.multipleUse")}>
				{venueData.shared_use_allowed
					? t("venue.multipleUsePossible")
					: t("venue.multipleUseNotPossible")}
			</ContentItem>

			{venueData.shared_use_allowed && (
				<ContentItem label={t("venue.description")}>
					{t("venue.multipleUseDescription")}
				</ContentItem>
			)}
		</ContentSection>
	);
}

function VenueExtendedInfo({ venueData }: { venueData: VenueProperties }) {
	const { t } = useTranslation("common");

	return (
		<div className="flex flex-col gap-4">
			<VenueAdministrativeInfo venueData={venueData} />
			<VenueCapacityInfo venueData={venueData} />

			{venueData.established_since && (
				<ContentSection>
					<ContentItem label={t("venue.status")}>
						{venueData.established_since}
					</ContentItem>
				</ContentSection>
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
			aria-expanded={showMoreInfo}
			aria-controls="extended-info"
		>
			{showMoreInfo ? (
				<ChevronUp size={16} aria-hidden="true" />
			) : (
				<ChevronDown size={16} aria-hidden="true" />
			)}
			<span className="body2">
				{showMoreInfo ? t("venue.lessInfo") : t("venue.moreInfo")}
			</span>
		</Button>
	);
}

function VenueCard({
	venueData,
}: {
	venueData: VenueProperties;
	onClose: () => void;
}) {
	const [showMoreInfo, setShowMoreInfo] = useState(false);
	const hasExtended = hasExtendedInfo(venueData);

	return (
		<Card
			className="w-full rounded-lg overflow-hidden border-none"
			role="article"
			aria-labelledby="venue-title"
		>
			<VenueHeader venueData={venueData} />

			<CardContent className="p-4 space-y-4">
				<VenueBasicInfo venueData={venueData} />

				{showMoreInfo && (
					<div id="extended-info">
						<VenueExtendedInfo venueData={venueData} />
					</div>
				)}

				{hasExtended && (
					<VenueToggleButton
						showMoreInfo={showMoreInfo}
						onToggle={() => setShowMoreInfo(!showMoreInfo)}
					/>
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

				console.log("[VenueDetailContent] geoJsonData::", geoJsonData);

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
			<div className="p-6" role="status" aria-live="polite">
				<span className="sr-only">{t("venue.loading")}</span>
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
			<div className="p-6" role="alert">
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
			<VenueCard venueData={venueData} onClose={handleClose} />
		</main>
	);
}
