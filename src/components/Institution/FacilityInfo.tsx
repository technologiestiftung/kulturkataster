"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface FacilityInfoProps {
	institutionData: Institution;
}

function hasFacilityData(data: Institution): boolean {
	return !!(
		data.capacity ||
		data.number_of_rooms ||
		data.shared_use_allowed ||
		data.shared_use_audience ||
		data.established_since ||
		data.established_until
	);
}

function CapacityInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.capacity) return null;
	return (
		<InfoItem label={t("institution.usableAreaSize")}>{data.capacity}</InfoItem>
	);
}

function RoomsCountInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.number_of_rooms) return null;
	return (
		<InfoItem label={t("institution.workspaceCount")}>
			{data.number_of_rooms}
		</InfoItem>
	);
}

function SharedUseInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.shared_use_allowed || !data.shared_use_info) return null;
	return (
		<InfoItem label={t("institution.description")}>
			{data.shared_use_info}
		</InfoItem>
	);
}

function SharedUseAudienceInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.shared_use_audience) return null;
	return (
		<InfoItem label={t("institution.sharedUseAudience")}>
			{data.shared_use_audience}
		</InfoItem>
	);
}

function EstablishedSinceInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.established_since) return null;
	return (
		<InfoItem label={t("institution.establishedSince")}>
			{new Date(data.established_since).getFullYear()}
		</InfoItem>
	);
}

function EstablishedUntilInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.established_until) return null;
	return (
		<InfoItem label={t("institution.establishedUntil")}>
			{new Date(data.established_until).getFullYear()}
		</InfoItem>
	);
}

export function FacilityInfo({ institutionData }: FacilityInfoProps) {
	const { t } = useTranslation("common");

	if (!hasFacilityData(institutionData)) return null;

	return (
		<InfoSection>
			<CapacityInfo data={institutionData} t={t} />
			<RoomsCountInfo data={institutionData} t={t} />
			<SharedUseInfo data={institutionData} t={t} />
			<SharedUseAudienceInfo data={institutionData} t={t} />
			<EstablishedSinceInfo data={institutionData} t={t} />
			<EstablishedUntilInfo data={institutionData} t={t} />
		</InfoSection>
	);
}
