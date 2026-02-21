import {
	MULTI_CATEGORIES_ICON_RAW_SVG,
	PLACEHOLDER_ICON_RAW_SVG,
} from "@/components/Map/MapStyles/createPoiSvg";
import { CategoryType } from "@/types";

const decodeSvgDataUri = (value: string): string | null => {
	if (!value.startsWith("data:image/svg+xml")) return null;
	const commaIndex = value.indexOf(",");
	if (commaIndex < 0) return null;
	const payload = value.slice(commaIndex + 1);
	try {
		return decodeURIComponent(payload);
	} catch {
		return payload;
	}
};

type PoiIconResolverOptions = {
	getFetchCandidates: (iconHref: string) => Promise<string[]>;
	onIconResolved?: () => void;
};

export function createPoiIconResolver({
	getFetchCandidates,
	onIconResolved,
}: PoiIconResolverOptions) {
	const rawSvgCache = new Map<string, string>([
		["__placeholder__", PLACEHOLDER_ICON_RAW_SVG],
		["__multi__", MULTI_CATEGORIES_ICON_RAW_SVG],
	]);
	const pendingFetch = new Map<string, Promise<void>>();
	const failedFetch = new Set<string>();
	const candidateCache = new Map<string, string[]>();
	const iconVersions = new Map<string, number>();

	const getIconVersion = (iconHref: string | null): number =>
		iconHref ? (iconVersions.get(iconHref) ?? 0) : 0;

	const getIconKey = (iconHref: string | null, categoryKey: CategoryType) =>
		iconHref?.trim() ||
		(categoryKey === "multi_categories" ? "__multi__" : "__placeholder__");

	const resolveIconRawSvg = (
		iconHref: string | null,
		categoryKey: CategoryType,
	): string => {
		if (categoryKey === "multi_categories") {
			return MULTI_CATEGORIES_ICON_RAW_SVG;
		}
		if (!iconHref) {
			return PLACEHOLDER_ICON_RAW_SVG;
		}
		if (iconHref.startsWith("<svg")) {
			rawSvgCache.set(iconHref, iconHref);
			return iconHref;
		}

		const decodedDataUri = decodeSvgDataUri(iconHref);
		if (decodedDataUri) {
			rawSvgCache.set(iconHref, decodedDataUri);
			return decodedDataUri;
		}

		const cached = rawSvgCache.get(iconHref);
		if (cached) return cached;
		if (failedFetch.has(iconHref)) return PLACEHOLDER_ICON_RAW_SVG;

		if (!pendingFetch.has(iconHref)) {
			const request = (async () => {
				const candidates =
					candidateCache.get(iconHref) ??
					(await getFetchCandidates(iconHref));
				candidateCache.set(iconHref, candidates);

				for (const candidate of candidates) {
					try {
						const response = await fetch(candidate);
						if (!response.ok) continue;
						const contentType = response.headers.get("content-type");
						if (contentType && !contentType.includes("svg")) continue;
						const raw = await response.text();
						if (!raw.includes("<svg")) continue;
						rawSvgCache.set(iconHref, raw);
						iconVersions.set(iconHref, (iconVersions.get(iconHref) ?? 0) + 1);
						return;
					} catch {
						// keep trying next candidate
					}
				}
				failedFetch.add(iconHref);
			})()
				.catch(() => {
					// no-op: fallback icon remains active
				})
				.finally(() => {
					pendingFetch.delete(iconHref);
					onIconResolved?.();
				});
			pendingFetch.set(iconHref, request);
		}

		return PLACEHOLDER_ICON_RAW_SVG;
	};

	return {
		getIconVersion,
		getIconKey,
		resolveIconRawSvg,
	};
}
