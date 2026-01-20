"use server";

export async function getMaptilerKey(): Promise<string | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	return apiKey ?? null;
}

export type ReverseGeocodeResult = {
	street?: string | null;
	streetNumber?: string | null;
	district?: string | null;
	neighbourhood?: string | null;
	city?: string | null;
	zipcode?: string | null;
};

export type GeocodeResult = {
	lat: number;
	lng: number;
};

export async function geocodeAddress(
	query: string,
): Promise<GeocodeResult | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	if (!apiKey) {
		console.warn("MAPTILER_API_KEY is not configured.");
		return null;
	}

	const encoded = encodeURIComponent(query.trim());
	if (!encoded) return null;
	const url = `https://api.maptiler.com/geocoding/${encoded}.json?key=${apiKey}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`Geocode failed with status: ${response.status}`);
			return null;
		}
		const data = await response.json();
		const feature = data?.features?.[0];
		const coords = feature?.center ?? feature?.geometry?.coordinates;
		if (!Array.isArray(coords) || coords.length < 2) return null;
		const [lng, lat] = coords;
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		return { lat, lng };
	} catch (error) {
		console.warn("Geocode error:", error);
		return null;
	}
}

export async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<ReverseGeocodeResult | null> {
	const apiKey = process.env.MAPTILER_API_KEY;
	if (!apiKey) {
		console.warn("MAPTILER_API_KEY is not configured.");
		return null;
	}

	const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`Reverse geocode failed with status: ${response.status}`);
			return null;
		}
		const data = await response.json();
		const feature = data?.features?.[0];
		if (!feature) return null;

		const street = feature.text ?? null;

		interface ContextItem {
			id: string;
			text: string;
		}
		const streetNumber = feature.address?.toString() ?? null;
		const city =
			feature.context?.find((obj: ContextItem) => obj.id.includes("region"))
				?.text ?? null;
		const district =
			feature.context?.find((obj: ContextItem) =>
				obj.id.includes("municipal_district"),
			)?.text ?? null;

		const neighbourhood =
			feature.context?.find((obj: ContextItem) => obj.id.includes("locality"))
				?.text ?? null;

		const zipcode =
			feature.context?.find((obj: ContextItem) =>
				obj.id.includes("postal_code"),
			)?.text ?? null;

		return {
			street,
			streetNumber,
			city,
			neighbourhood,
			district,
			zipcode,
		};
	} catch (error) {
		console.warn("Reverse geocode error:", error);
		return null;
	}
}
