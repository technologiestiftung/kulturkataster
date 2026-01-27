import { useCallback } from "react";

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
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalText = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => String(item))
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
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
	addressSuffixKey?: string;
	latKey?: string;
	lngKey?: string;
};

type LatLngBlurOptions = {
	latKey?: string;
	lngKey?: string;
	streetLineKey?: string;
	zipKey?: string;
	cityKey?: string;
	neighbourhoodKey?: string;
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
				if (result) {
					const latKey = options.latKey ?? "address.lat";
					const lngKey = options.lngKey ?? "address.lng";
					updateField(latKey, result.lat);
					updateField(lngKey, result.lng);
					addressGeocodeState.current.lastQuery = query;
				}
			} finally {
				addressGeocodeState.current.inflight = false;
			}
		},
		[
			addressGeocodeState,
			geocodeAddress,
			options.addressSuffixKey,
			options.cityKey,
			options.latKey,
			options.lngKey,
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
			if (lat === null || lng === null) return;
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
		street: street || null,
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

export {
	getSubmitLabel,
	handleAddressBlur,
	handleLatLngBlur,
	toNumberArray,
	toOptionalNumber,
	toOptionalText,
	toStringArray,
	splitStreetLine,
	buildStreetLine,
	buildAddressFromFormData,
};
