import { notFound, redirect } from "next/navigation";

export function requirePositiveIntParam(
	value: string,
	invalidRedirectPath?: string,
): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		if (invalidRedirectPath) {
			redirect(invalidRedirectPath);
		}
		notFound();
	}
	return parsed;
}

export function parseOptionalPositiveIntParam(
	value: string | string[] | undefined,
): number | undefined {
	const raw = parseOptionalStringParam(value);
	if (!raw) return undefined;
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseOptionalStringParam(
	value: string | string[] | undefined,
): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}
