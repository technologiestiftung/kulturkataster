"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getMatchingSubcategories } from "@/lib/utils/categoryUtils";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils";
import { normalizeUrl } from "@/lib/utils/sanitizerUtils";
import { Category, InstitutionProperties } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Children, useEffect, useState } from "react";
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
			<p className="body2 font-bold">{label}:</p>
			<p className="body2">{children}</p>
		</div>
	);
}

function InfoSection({ children }: { children: React.ReactNode }) {
	const validChildren = Children.toArray(children).filter(Boolean);

	if (validChildren.length === 0) {
		return null;
	}

	return (
		<div className="rounded space-y-4 p-4 bg-neutral-5">{validChildren}</div>
	);
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

	const normalizedHref = external ? normalizeUrl(href) : href;

	return (
		<a
			href={normalizedHref}
			className="body2 text-primary-dark hover:underline wrap-anywhere"
			{...props}
		>
			{children}
		</a>
	);
}

// Header component
function InstitutionHeader({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const isInUse = institutionData.utilization_status === "in_use";

	return (
		<CardHeader
			className={`relative p-0 ${isInUse ? "bg-brand-default" : "bg-neutral-20"}`}
		>
			<p className="body2 p-4 pb-0">
				{institutionData.parent_organizations?.[0]?.name || ""}
			</p>
			<CardTitle className="px-4 max-w-full overflow-hidden">
				<h1 className="h1 wrap-anywhere">{institutionData.name}</h1>
			</CardTitle>

			{institutionData.categories?.length > 0 && (
				<section className="px-4">
					{institutionData.categories.map((category: Category) => {
						const IconComponent = getCategoryIconComponent(category.key);
						const matchingSubcategories = getMatchingSubcategories(
							category,
							institutionData.subcategories || [],
						);

						return (
							<div key={category.id} className="mb-2">
								<div className="flex items-center gap-2 h-6">
									<div className="w-6 h-6">
										<IconComponent />
									</div>
									<p className="body2 font-bold">
										{tEnum(`category.${category.key}`)}
									</p>
								</div>
								{matchingSubcategories.length > 0 && (
									<div className="body2 pl-8">
										{matchingSubcategories.map((subcategory, index) => (
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
				<span className="body2 font-bold">
					{t("institution.utilizationStatus")}:{" "}
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

// Basic info component
function InstitutionBasicInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	return (
		<div className="space-y-4 flex flex-col">
			<address className="not-italic">
				<p className="body1">{institutionData.name}</p>
				{institutionData.address_suffix && (
					<p className="body1">{institutionData.address_suffix}</p>
				)}
				{institutionData.street &&
					institutionData.street_number &&
					institutionData.zip_code && (
						<div className="body1">
							<p>
								{`${institutionData.street.trim()} ${institutionData.street_number.trim()}`}
							</p>
							<div className="flex flex-wrap space-x-2">
								<p>{institutionData.zip_code}</p>
								{institutionData.district.key && (
									<p>
										{tEnum(`berlin_district.${institutionData.district.key}`)}
									</p>
								)}
							</div>
						</div>
					)}
			</address>

			<InfoSection>
				{institutionData.website && (
					<InfoItem label={t("institution.website")}>
						<ContactLink href={institutionData.website} external>
							Website {institutionData.name}
						</ContactLink>
					</InfoItem>
				)}

				{institutionData.phone && (
					<InfoItem label={t("institution.phoneNumber")}>
						<ContactLink href={`tel:${institutionData.phone}`}>
							{institutionData.phone}
						</ContactLink>
					</InfoItem>
				)}

				{institutionData.email && (
					<InfoItem label={t("institution.emailAddress")}>
						<ContactLink href={`mailto:${institutionData.email}`}>
							{institutionData.email}
						</ContactLink>
					</InfoItem>
				)}
			</InfoSection>
		</div>
	);
}

// Organization info component
function OrganizationInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<InfoSection>
			{institutionData.closing_reason && (
				<InfoItem label={t("institution.closingReason")}>
					{institutionData.closing_reason}
				</InfoItem>
			)}

			{institutionData.cultural_area && (
				<InfoItem label={t("institution.culturalArea")}>
					{institutionData.cultural_area.name}
				</InfoItem>
			)}

			{institutionData.owner && institutionData.owner?.owner_type && (
				<InfoItem label={t("institution.ownerType")}>
					{tEnum("owner_type." + institutionData.owner.owner_type)}
				</InfoItem>
			)}

			{institutionData.source && (
				<InfoItem label={t("institution.source")}>
					{institutionData.source.name}
				</InfoItem>
			)}
		</InfoSection>
	);
}

// Funding info component
function FundingInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<InfoSection>
			{institutionData.funding_type && (
				<InfoItem label={t("institution.fundingType")}>
					{tEnum(`funding_type.${institutionData.funding_type}`)}
				</InfoItem>
			)}
			{institutionData.support_type && (
				<InfoItem label={t("institution.supportType")}>
					{institutionData.support_type}
				</InfoItem>
			)}
		</InfoSection>
	);
}

// Facility info component
function FacilityInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");

	return (
		<InfoSection>
			{institutionData.capacity && (
				<InfoItem label={t("institution.usableAreaSize")}>
					{institutionData.capacity}
				</InfoItem>
			)}
			{institutionData.rooms_count && (
				<InfoItem label={t("institution.workspaceCount")}>
					{institutionData.rooms_count}
				</InfoItem>
			)}
			{institutionData.shared_use_allowed && (
				<InfoItem label={t("institution.description")}>
					{institutionData.shared_use_info && institutionData.shared_use_info}
				</InfoItem>
			)}
			{institutionData.shared_use_audience && (
				<InfoItem label={t("institution.sharedUseAudience")}>
					{institutionData.shared_use_audience}
				</InfoItem>
			)}
			{/* {institutionData.shared_use_contact_person && (
				<InfoItem label={t("institution.sharedUseContactPerson")}>
					{institutionData.shared_use_contact_person}
				</InfoItem>
			)} */}
			{institutionData.established_since && (
				<InfoItem label={t("institution.establishedSince")}>
					{new Date(institutionData.established_since).getFullYear()}
				</InfoItem>
			)}
			{institutionData.established_until && (
				<InfoItem label={t("institution.establishedUntil")}>
					{new Date(institutionData.established_until).getFullYear()}
				</InfoItem>
			)}
		</InfoSection>
	);
}

// Status info component
function StatusInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");

	return (
		<InfoSection>
			{institutionData.updated_at && (
				<InfoItem label={t("institution.status")}>
					{institutionData.updated_at}
				</InfoItem>
			)}
		</InfoSection>
	);
}

// Extended info component
function InstitutionExtendedInfo({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	return (
		<div className="space-y-4">
			<OrganizationInfo institutionData={institutionData} />
			<FundingInfo institutionData={institutionData} />
			<FacilityInfo institutionData={institutionData} />
			<StatusInfo institutionData={institutionData} />
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

function InstitutionCard({
	institutionData,
}: {
	institutionData: InstitutionProperties;
}) {
	const { t } = useTranslation("common");
	const [showMore, setShowMore] = useState(false);

	const hasExtendedInfo = EXTENDED_INFO_FIELDS.some((field) =>
		Boolean(institutionData[field]),
	);

	return (
		<Card className="w-full rounded-lg overflow-hidden border-none">
			<InstitutionHeader institutionData={institutionData} />

			<CardContent className="p-4 space-y-4">
				<InstitutionBasicInfo institutionData={institutionData} />

				{showMore && (
					<InstitutionExtendedInfo institutionData={institutionData} />
				)}

				{hasExtendedInfo && (
					<Button
						variant="accordion"
						size="icon-default"
						onClick={() => setShowMore(!showMore)}
						className=""
					>
						{showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						<span className="body2">
							{showMore ? t("institution.lessInfo") : t("institution.moreInfo")}
						</span>
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

export function InstitutionDetailContent() {
	const { t } = useTranslation("common");
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const institutions = useInstitutionStore((state) => state.institutions);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);

	const [institutionData, setInstitutionData] =
		useState<InstitutionProperties | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!selectedInstitutionId) {
			setInstitutionData(null);
			return;
		}

		const fetchInstitutionData = async () => {
			try {
				setLoading(true);
				const institution = institutions?.features.find(
					(feature) => feature.properties?.id === selectedInstitutionId,
				);
				setInstitutionData(
					(institution?.properties as InstitutionProperties) || null,
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
		<main className="p-2 h-full w-full">
			<InstitutionCard institutionData={institutionData} />
		</main>
	);
}
