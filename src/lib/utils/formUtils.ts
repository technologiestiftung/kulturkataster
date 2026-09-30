import { useCallback } from "react";
import type { InstitutionForm } from "@/types/institution";

type SubmitLabelText = {
	default: string;
	loading: string;
};

const getSubmitLabel = (
	mode: string,
	submitting: boolean,
	labels: Record<string, SubmitLabelText>,
) => {
	const resolved = labels[mode] ?? labels.default;
	if (!resolved) return "";
	return submitting ? resolved.loading : resolved.default;
};

const toNumberArray = (value: unknown): number[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
};

const toOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	if (normalized.length === 0) return undefined;
	if (normalized === "undefined" || normalized === "null") return undefined;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalText = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const hasDisplayValue = (value: unknown): boolean => {
	if (value === null || value === undefined) return false;
	if (typeof value === "string") return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return true;
};

const toDate = (value: unknown): Date | null => {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}
	if (value && typeof value === "object") {
		const tagged = value as { $type?: unknown; value?: unknown };
		if (
			tagged.$type === "DateTime" &&
			(typeof tagged.value === "string" || typeof tagged.value === "number")
		) {
			const parsed = new Date(tagged.value);
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}
	}
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return null;
};

const formatDateByType = (value: unknown, type: "date" | "year"): string => {
	const date = toDate(value);
	if (!date) return String(value ?? "");
	if (type === "year") return String(date.getFullYear());
	return date.toLocaleDateString();
};

const normalizeDateByType = (
	value: unknown,
	type: "date" | "year",
): string | null => {
	const date = toDate(value);
	if (!date) {
		if (value === null || value === undefined) return null;
		if (typeof value === "string") return value.trim();
		return String(value);
	}
	if (type === "year") return String(date.getFullYear());
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getNestedValue = (
	obj: Record<string, unknown>,
	path?: string,
): unknown => {
	if (!path) return undefined;
	return path.split(".").reduce((current, key) => {
		if (current && typeof current === "object") {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj as unknown);
};

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => String(item))
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};

type NormalizedFundingSource = {
	id?: number;
	source_name: string;
	description: string | null;
};

const normalizeFundingSources = (
	value: unknown,
	fallback?: {
		source_name?: unknown;
		description?: unknown;
	},
): NormalizedFundingSource[] => {
	const parseItem = (item: unknown): NormalizedFundingSource | null => {
		if (!item || typeof item !== "object") return null;
		const source = item as Record<string, unknown>;
		const source_name = toOptionalText(source.source_name);
		if (!source_name) return null;
		const description = toOptionalText(source.description);
		const id =
			typeof source.id === "number" && Number.isFinite(source.id)
				? source.id
				: undefined;
		return {
			id,
			source_name,
			description: description ?? null,
		};
	};

	const parsed = Array.isArray(value)
		? value
				.map(parseItem)
				.filter((item): item is NormalizedFundingSource => item !== null)
		: [];

	if (parsed.length > 0) return parsed;

	const fallbackSourceName = toOptionalText(fallback?.source_name);
	if (!fallbackSourceName) return parsed;

	const fallbackDescription = toOptionalText(fallback?.description);
	return [
		{
			source_name: fallbackSourceName,
			description: fallbackDescription ?? null,
		},
	];
};

const splitStreetLine = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return { street: "", streetNumber: "" };
	}

	const parts = trimmed.split(/\s+/);
	const lastPart = parts[parts.length - 1];
	if (parts.length > 1 && /\d/.test(lastPart)) {
		return {
			street: parts.slice(0, -1).join(" "),
			streetNumber: lastPart,
		};
	}

	return { street: trimmed, streetNumber: "" };
};

type AddressBlurOptions = {
	streetLineKey?: string;
	zipKey?: string;
	cityKey?: string;
	districtKey?: string;
	neighbourhoodKey?: string;
	addressSuffixKey?: string;
	latKey?: string;
	lngKey?: string;
	reverseGeocode?: (
		lat: number,
		lng: number,
	) => Promise<{
		city?: string | null;
		zipcode?: string | null;
		district?: string | null;
		neighbourhood?: string | null;
	} | null>;
};

type LatLngBlurOptions = {
	latKey?: string;
	lngKey?: string;
	streetLineKey?: string;
	zipKey?: string;
	cityKey?: string;
	districtKey?: string;
	neighbourhoodKey?: string;
};

type InstitutionAddressPayload = {
	id?: number;
	street: string;
	street_number: string;
	city: string | null;
	zipcode: string | null;
	district: string | null;
	lat: number | null;
	lng: number | null;
	address_suffix: string | null;
	neighbourhood: string | null;
	cultural_area: string | null;
};

const applyReverseGeocodeFields = (
	reverseResult: {
		city?: string | null;
		zipcode?: string | null;
		district?: string | null;
		neighbourhood?: string | null;
	},
	options: AddressBlurOptions,
	updateField: (name: string, value: unknown) => void,
) => {
	const locationFields: Array<[string, string | null | undefined]> = [
		[options.cityKey ?? "address.city", reverseResult.city],
		[options.zipKey ?? "address.zip", reverseResult.zipcode],
		[options.districtKey ?? "address.district", reverseResult.district],
		[
			options.neighbourhoodKey ?? "address.neighbourhood",
			reverseResult.neighbourhood,
		],
	];
	locationFields.forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			updateField(key, value);
		}
	});
};

const handleAddressBlur = (
	addressGeocodeState: React.MutableRefObject<{
		lastQuery: string;
		inflight: boolean;
	}>,
	geocodeAddress: (
		query: string,
	) => Promise<{ lat: number; lng: number } | null>,
	options: AddressBlurOptions = {},
) =>
	useCallback(
		async (
			_value: unknown,
			formData: Record<string, unknown>,
			updateField: (name: string, value: unknown) => void,
		) => {
			const streetLine = toOptionalText(
				formData[options.streetLineKey ?? "address.streetLine"],
			);
			const zip = toOptionalText(formData[options.zipKey ?? "address.zip"]);
			const city = toOptionalText(formData[options.cityKey ?? "address.city"]);
			const addressSuffix = toOptionalText(
				formData[options.addressSuffixKey ?? "address.address_suffix"],
			);
			const queryParts = [streetLine, addressSuffix, zip, city].filter(
				(item): item is string => Boolean(item),
			);
			if (queryParts.length === 0) return;
			const query = queryParts.join(", ");
			if (addressGeocodeState.current.inflight) return;
			if (addressGeocodeState.current.lastQuery === query) return;

			addressGeocodeState.current.inflight = true;
			try {
				const result = await geocodeAddress(query);
				if (!result) return;
				const latKey = options.latKey ?? "address.lat";
				const lngKey = options.lngKey ?? "address.lng";
				updateField(latKey, result.lat);
				updateField(lngKey, result.lng);

				if (options.reverseGeocode) {
					const reverseResult = await options.reverseGeocode(
						result.lat,
						result.lng,
					);
					if (reverseResult) {
						applyReverseGeocodeFields(reverseResult, options, updateField);
					}
				}
				addressGeocodeState.current.lastQuery = query;
			} finally {
				addressGeocodeState.current.inflight = false;
			}
		},
		[
			addressGeocodeState,
			geocodeAddress,
			options.addressSuffixKey,
			options.cityKey,
			options.districtKey,
			options.latKey,
			options.lngKey,
			options.neighbourhoodKey,
			options.reverseGeocode,
			options.streetLineKey,
			options.zipKey,
		],
	);

const handleLatLngBlur = (
	latLngGeocodeState: React.MutableRefObject<{
		lastQuery: string;
		inflight: boolean;
	}>,
	reverseGeocode: (
		lat: number,
		lng: number,
	) => Promise<{
		street?: string | null;
		streetNumber?: string | null;
		city?: string | null;
		zipcode?: string | null;
		district?: string | null;
		neighbourhood?: string | null;
	} | null>,
	options: LatLngBlurOptions = {},
) =>
	useCallback(
		async (
			_value: unknown,
			formData: Record<string, unknown>,
			updateField: (name: string, value: unknown) => void,
		) => {
			const lat = toOptionalNumber(formData[options.latKey ?? "address.lat"]);
			const lng = toOptionalNumber(formData[options.lngKey ?? "address.lng"]);
			if (!lat || !lng) return;
			const query = `${lat},${lng}`;
			if (latLngGeocodeState.current.inflight) return;
			if (latLngGeocodeState.current.lastQuery === query) return;

			latLngGeocodeState.current.inflight = true;
			try {
				const result = await reverseGeocode(lat, lng);
				if (result) {
					const streetLineKey = options.streetLineKey ?? "address.streetLine";
					const cityKey = options.cityKey ?? "address.city";
					const zipKey = options.zipKey ?? "address.zip";
					const districtKey = options.districtKey ?? "address.district";
					const neighbourhoodKey =
						options.neighbourhoodKey ?? "address.neighbourhood";
					const streetLine = buildStreetLine(
						result.street ?? undefined,
						result.streetNumber ?? undefined,
					);
					if (streetLine) {
						updateField(streetLineKey, streetLine);
					}
					if (result.city !== null) {
						updateField(cityKey, result.city);
					}
					if (result.zipcode !== null) {
						updateField(zipKey, result.zipcode);
					}
					if (result.district !== null) {
						updateField(districtKey, result.district);
					}
					if (result.neighbourhood !== null) {
						updateField(neighbourhoodKey, result.neighbourhood);
					}
				}
				latLngGeocodeState.current.lastQuery = query;
			} finally {
				latLngGeocodeState.current.inflight = false;
			}
		},
		[
			latLngGeocodeState,
			reverseGeocode,
			options.cityKey,
			options.districtKey,
			options.latKey,
			options.lngKey,
			options.neighbourhoodKey,
			options.streetLineKey,
			options.zipKey,
		],
	);

const buildStreetLine = (
	street?: string | null,
	streetNumber?: string | null,
) => {
	const parts = [street?.trim(), streetNumber?.trim()].filter(Boolean);
	return parts.join(" ");
};

type AddressFormKeys = {
	streetLineKey?: string;
	zipKey?: string;
	cityKey?: string;
	districtKey?: string;
	addressSuffixKey?: string;
	neighbourhoodKey?: string;
	culturalAreaKey?: string;
	latKey?: string;
	lngKey?: string;
};

const buildAddressFromFormData = (
	formData: Record<string, unknown>,
	keys: AddressFormKeys = {},
) => {
	const streetLine = toOptionalText(
		formData[keys.streetLineKey ?? "address.streetLine"],
	);
	const zip = toOptionalText(formData[keys.zipKey ?? "address.zip"]);
	const city = toOptionalText(formData[keys.cityKey ?? "address.city"]);
	const district = toOptionalText(
		formData[keys.districtKey ?? "address.district"],
	);
	const addressSuffix = toOptionalText(
		formData[keys.addressSuffixKey ?? "address.address_suffix"],
	);
	const neighbourhood = toOptionalText(
		formData[keys.neighbourhoodKey ?? "address.neighbourhood"],
	);
	const culturalArea = toOptionalText(
		formData[keys.culturalAreaKey ?? "address.cultural_area"],
	);
	const lat = toOptionalNumber(formData[keys.latKey ?? "address.lat"]);
	const lng = toOptionalNumber(formData[keys.lngKey ?? "address.lng"]);

	const hasAnyValue =
		streetLine ||
		zip ||
		city ||
		district ||
		addressSuffix ||
		neighbourhood ||
		culturalArea ||
		lat !== undefined ||
		lng !== undefined;

	if (!hasAnyValue) return null;

	const { street, streetNumber } = streetLine
		? splitStreetLine(streetLine)
		: { street: "", streetNumber: "" };

	return {
		street: street,
		street_number: streetNumber || null,
		zipcode: zip,
		city,
		district,
		address_suffix: addressSuffix,
		neighbourhood,
		cultural_area: culturalArea,
		lat: lat ?? null,
		lng: lng ?? null,
	};
};

const buildInstitutionAddressPayload = (
	formData: Record<string, unknown>,
	options?: {
		addressId?: number;
		keys?: {
			streetLineKey?: string;
			cityKey?: string;
			zipKey?: string;
			districtKey?: string;
			latKey?: string;
			lngKey?: string;
			addressSuffixKey?: string;
			neighbourhoodKey?: string;
			culturalAreaKey?: string;
		};
	},
): InstitutionAddressPayload => {
	const streetLine = toOptionalText(
		formData[options?.keys?.streetLineKey ?? "address.streetLine"],
	);
	const { street, streetNumber } = splitStreetLine(streetLine ?? "");
	const payload: InstitutionAddressPayload = {
		street,
		street_number: streetNumber,
		city: toOptionalText(formData[options?.keys?.cityKey ?? "address.city"]),
		zipcode: toOptionalText(formData[options?.keys?.zipKey ?? "address.zip"]),
		district: toOptionalText(
			formData[options?.keys?.districtKey ?? "address.district"],
		),
		lat:
			toOptionalNumber(formData[options?.keys?.latKey ?? "address.lat"]) ??
			null,
		lng:
			toOptionalNumber(formData[options?.keys?.lngKey ?? "address.lng"]) ??
			null,
		address_suffix: toOptionalText(
			formData[options?.keys?.addressSuffixKey ?? "address.address_suffix"],
		),
		neighbourhood: toOptionalText(
			formData[options?.keys?.neighbourhoodKey ?? "address.neighbourhood"],
		),
		cultural_area: toOptionalText(
			formData[options?.keys?.culturalAreaKey ?? "address.cultural_area"],
		),
	};
	if (typeof options?.addressId === "number") {
		return { ...payload, id: options.addressId };
	}
	return payload;
};

const toFormBoolean = (value: unknown): boolean | null => {
	if (value === true || value === "true" || value === "yes") return true;
	if (value === false || value === "false" || value === "no") return false;
	return null;
};

const buildInstitutionSharedFieldsPayload = (
	formData: Record<string, unknown>,
) =>
	({
		website: toOptionalText(formData.website),
		email: toOptionalText(formData.email),
		phone: toOptionalText(formData.phone),
		parent_organization: toOptionalText(formData.parent_organization),
		legal_form: toOptionalText(formData.legal_form),
		owner_name: toOptionalText(formData.owner_name),
		owner_type: toOptionalText(
			formData.owner_type,
		) as InstitutionForm["owner_type"],
		rental_contract_type: toOptionalText(
			formData.rental_contract_type,
		) as InstitutionForm["rental_contract_type"],
		rental_contract_end: toDate(formData.rental_contract_end),
		funding_type: toOptionalText(
			formData.funding_type,
		) as InstitutionForm["funding_type"],
		funding_sources: normalizeFundingSources(formData.funding_sources),
		utilization_status: toOptionalText(
			formData.utilization_status,
		) as InstitutionForm["utilization_status"],
		utilization_status_info: toOptionalText(formData.utilization_status_info),
		utilization_status_internal_notes: toOptionalText(
			formData.utilization_status_internal_notes,
		),
		protection_status: toOptionalText(
			formData.protection_status,
		) as InstitutionForm["protection_status"],
		protection_status_info: toOptionalText(formData.protection_status_info),
		protection_status_internal_notes: toOptionalText(
			formData.protection_status_internal_notes,
		),
		shared_use_allowed: toFormBoolean(formData.shared_use_allowed),
		shared_use_info: toOptionalText(formData.shared_use_info),
		shared_use_equipment: toOptionalText(formData.shared_use_equipment),
		shared_use_audience: toOptionalText(formData.shared_use_audience),
		shared_use_availability: toOptionalText(formData.shared_use_availability),
		shared_use_contact_person: toOptionalText(
			formData.shared_use_contact_person,
		),
		accessibility: toOptionalText(formData.accessibility),
		cost: toOptionalText(formData.cost),
		established_since: toDate(formData.established_since),
		established_until: toDate(formData.established_until),
		closing_reason: toOptionalText(formData.closing_reason),
		notes: toOptionalText(formData.notes),
		internal_notes: toOptionalText(formData.internal_notes),
		source: toOptionalText(formData.source),
		contact_person_first_name: toOptionalText(
			formData.contact_person_first_name,
		),
		contact_person_last_name: toOptionalText(formData.contact_person_last_name),
		contact_person_email: toOptionalText(formData.contact_person_email),
		contact_person_phone: toOptionalText(formData.contact_person_phone),
		area: toOptionalNumber(formData.area),
		number_of_rooms: toOptionalNumber(formData.number_of_rooms),
		capacity: toOptionalNumber(formData.capacity),
		culture_index: toOptionalNumber(formData.culture_index),
		culture_index_location: toOptionalNumber(formData.culture_index_location),
		culture_index_property: toOptionalNumber(formData.culture_index_property),
		culture_index_financial: toOptionalNumber(formData.culture_index_financial),
		culture_index_social_spatial: toOptionalNumber(
			formData.culture_index_social_spatial,
		),
		culture_index_visibility: toOptionalNumber(
			formData.culture_index_visibility,
		),
		culture_index_global: toOptionalText(formData.culture_index_global),
	}) satisfies Partial<InstitutionForm>;

export {
	getSubmitLabel,
	handleAddressBlur,
	handleLatLngBlur,
	toNumberArray,
	toOptionalNumber,
	toOptionalText,
	hasDisplayValue,
	toDate,
	formatDateByType,
	normalizeDateByType,
	getNestedValue,
	toStringArray,
	normalizeFundingSources,
	splitStreetLine,
	buildStreetLine,
	buildAddressFromFormData,
	buildInstitutionAddressPayload,
	buildInstitutionSharedFieldsPayload,
	toFormBoolean,
};
