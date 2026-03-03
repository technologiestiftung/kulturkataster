import type { Institution } from "@/types/institution";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";

const toOptionalText = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const toOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	if (normalized.length === 0) return undefined;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeCompareValue = (value: unknown): string => {
	if (typeof value !== "string") return "";
	return value
		.trim()
		.toLowerCase()
		.replace(/ß/g, "ss")
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?[\]\\|+]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
};

const normalizeStreetValue = (value: unknown): string =>
	normalizeCompareValue(value)
		.replace(/\b([a-z]+)str\.?\b/g, "$1strasse")
		.replace(/\bstr\.?\b/g, "strasse")
		.replace(/\bstrasse\b/g, "strasse")
		.replace(/\b([a-z]+)pl\.?\b/g, "$1platz")
		.replace(/\bplatz\b/g, "platz")
		.replace(/\bpl\.?\b/g, "platz")
		.replace(/\s+/g, " ")
		.trim();

const buildAddressFingerprint = (
	address: Record<string, unknown> | null | undefined,
): string => {
	if (!address) return "";
	return [
		normalizeStreetValue(address.street),
		normalizeCompareValue(address.street_number),
		address.address_suffix,
		address.zipcode,
		address.city,
	]
		.map(normalizeCompareValue)
		.join("|");
};

const levenshteinDistance = (left: string, right: string): number => {
	if (left === right) return 0;
	if (left.length === 0) return right.length;
	if (right.length === 0) return left.length;
	const previous = new Array(right.length + 1).fill(0).map((_, idx) => idx);
	for (let i = 1; i <= left.length; i += 1) {
		let diagonal = previous[0];
		previous[0] = i;
		for (let j = 1; j <= right.length; j += 1) {
			const temp = previous[j];
			const cost = left[i - 1] === right[j - 1] ? 0 : 1;
			previous[j] = Math.min(
				previous[j] + 1,
				previous[j - 1] + 1,
				diagonal + cost,
			);
			diagonal = temp;
		}
	}
	return previous[right.length];
};

const similarity = (left: string, right: string): number => {
	const a = normalizeCompareValue(left);
	const b = normalizeCompareValue(right);
	if (!a || !b) return 0;
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - levenshteinDistance(a, b) / maxLen;
};

const toAddressLike = (
	address: Record<string, unknown> | null | undefined,
): {
	street: string | null;
	street_number: string | null;
	zipcode: string | null;
	city: string | null;
	lat: number | null;
	lng: number | null;
} => ({
	street: toOptionalText(address?.street),
	street_number: toOptionalText(address?.street_number),
	zipcode: toOptionalText(address?.zipcode),
	city: toOptionalText(address?.city),
	lat: toOptionalNumber(address?.lat) ?? null,
	lng: toOptionalNumber(address?.lng) ?? null,
});

const getDistanceMeters = (
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number => {
	const toRadians = (deg: number) => (deg * Math.PI) / 180;
	const earthRadius = 6371000;
	const dLat = toRadians(lat2 - lat1);
	const dLng = toRadians(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
};

export const hasDuplicateInstitutionByNameAndAddress = ({
	formData,
	institutions,
	currentInstitutionId,
}: {
	formData: Record<string, unknown>;
	institutions: Institution[];
	currentInstitutionId?: number | null;
}): boolean => {
	const normalizedName = normalizeCompareValue(formData.name);
	if (!normalizedName) return false;

	const address = buildAddressFromFormData(formData);
	const addressFingerprint = buildAddressFingerprint(
		address as Record<string, unknown> | null,
	);
	if (!addressFingerprint) return false;

	return institutions.some((institution) => {
		if (
			typeof currentInstitutionId === "number" &&
			institution.id === currentInstitutionId
		) {
			return false;
		}
		if (normalizeCompareValue(institution.name) !== normalizedName) {
			return false;
		}
		return (
			buildAddressFingerprint(
				(institution.address as Record<string, unknown> | null) ?? null,
			) === addressFingerprint
		);
	});
};

export const findPotentialInstitutionDuplicates = ({
	formData,
	institutions,
	currentInstitutionId,
	maxResults = 3,
}: {
	formData: Record<string, unknown>;
	institutions: Institution[];
	currentInstitutionId?: number | null;
	maxResults?: number;
}): Institution[] => {
	const normalizedName = normalizeCompareValue(formData.name);
	if (!normalizedName) return [];
	const formAddressRaw = buildAddressFromFormData(formData) as Record<
		string,
		unknown
	> | null;
	if (!formAddressRaw) return [];
	const formAddress = toAddressLike(formAddressRaw);
	if (
		!formAddress.street &&
		!formAddress.zipcode &&
		!formAddress.city &&
		formAddress.lat === null &&
		formAddress.lng === null
	) {
		return [];
	}

	return institutions
		.filter((institution) => {
			if (
				typeof currentInstitutionId === "number" &&
				institution.id === currentInstitutionId
			) {
				return false;
			}
			const nameScore = similarity(normalizedName, institution.name ?? "");
			if (nameScore < 0.92) return false;

			const institutionAddress = toAddressLike(
				(institution.address as Record<string, unknown> | null) ?? null,
			);
			const sameZip =
				Boolean(formAddress.zipcode) &&
				Boolean(institutionAddress.zipcode) &&
				normalizeCompareValue(formAddress.zipcode) ===
					normalizeCompareValue(institutionAddress.zipcode);
			const streetScore = similarity(
				normalizeStreetValue(formAddress.street),
				normalizeStreetValue(institutionAddress.street),
			);
			const sameNumber =
				normalizeCompareValue(formAddress.street_number) !== "" &&
				normalizeCompareValue(formAddress.street_number) ===
					normalizeCompareValue(institutionAddress.street_number);
			const nearBy =
				formAddress.lat !== null &&
				formAddress.lng !== null &&
				institutionAddress.lat !== null &&
				institutionAddress.lng !== null &&
				getDistanceMeters(
					formAddress.lat,
					formAddress.lng,
					institutionAddress.lat,
					institutionAddress.lng,
				) <= 30;

			return (
				(sameZip && streetScore >= 0.9) || (sameZip && sameNumber) || nearBy
			);
		})
		.slice(0, maxResults);
};
