export type ActionResult<T, E extends string = string> =
	| { ok: true; data: T }
	| { ok: false; error: E };

export const actionOk = <T>(data: T): ActionResult<T, never> => ({
	ok: true,
	data,
});

export const actionError = <E extends string>(
	error: E,
): ActionResult<never, E> => ({
	ok: false,
	error,
});

export const getActionErrorCode = (error: unknown): string | undefined => {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code?: unknown }).code === "string"
	) {
		return (error as { code: string }).code;
	}

	return undefined;
};
