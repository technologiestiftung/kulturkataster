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
