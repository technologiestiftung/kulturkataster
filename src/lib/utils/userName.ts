export const splitDisplayName = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return { firstName: undefined, lastName: undefined };
	}
	const parts = trimmed.split(/\s+/);
	const firstName = parts.shift() ?? "";
	const lastName = parts.length > 0 ? parts.join(" ") : undefined;
	return { firstName, lastName };
};

type UserNameLike = {
	first_name: string | null;
	last_name: string | null;
	email: string;
};

export const formatUserDisplayName = (
	user: UserNameLike | null | undefined,
): string | null => {
	if (!user) return null;
	const fullName = [user.first_name, user.last_name]
		.filter((part): part is string => Boolean(part && part.trim().length > 0))
		.join(" ");
	return fullName ? `${fullName} (${user.email})` : user.email;
};
