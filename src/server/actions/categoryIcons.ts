"use server";

const CATEGORY_ICON_BUCKET =
	process.env.SUPABASE_CATEGORY_ICONS_BUCKET ?? "category-icons";
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");

export async function getCategoryIconFetchCandidates(
	iconHref: string,
): Promise<string[]> {
	const trimmed = iconHref.trim();
	if (!trimmed) return [];
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return [trimmed];
	}

	const asPath = trimmed.replace(/^\/+/, "");
	const candidates = new Set<string>();

	if (trimmed.startsWith("/")) {
		candidates.add(trimmed);
	}

	if (SUPABASE_URL) {
		if (asPath.startsWith("storage/v1/object/public/")) {
			candidates.add(`${SUPABASE_URL}/${asPath}`);
		}
		if (asPath.startsWith(`${CATEGORY_ICON_BUCKET}/`)) {
			candidates.add(`${SUPABASE_URL}/storage/v1/object/public/${asPath}`);
		}
		candidates.add(
			`${SUPABASE_URL}/storage/v1/object/public/${CATEGORY_ICON_BUCKET}/${asPath}`,
		);
	}

	if (!trimmed.startsWith("/")) {
		candidates.add(`/${asPath}`);
	}

	return Array.from(candidates);
}
