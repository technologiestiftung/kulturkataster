import type { User, UserAccessDetails } from "./types";

export function getRoleBadgeVariant(
	role: User["role"],
): "default" | "secondary" | "outline" {
	switch (role) {
		case "admin":
			return "default";
		case "publisher":
			return "default";
		case "redaktion":
			return "secondary";
		case "editor":
			return "secondary";
		case "contributor":
			return "outline";
		case "viewer":
			return "outline";
		default:
			return "outline";
	}
}

export function getStatusBadgeVariant(
	status: User["status"],
): "default" | "secondary" | "outline" {
	switch (status) {
		case "active":
			return "default";
		case "inactive":
			return "secondary";
		case "pending":
			return "outline";
		default:
			return "outline";
	}
}

export function formatLastActivity(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInHours < 1) {
		return "Just now";
	} else if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	} else if (diffInDays < 7) {
		return `${diffInDays}d ago`;
	}
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function getRoleLabel(role: User["role"]): string {
	switch (role) {
		case "admin":
			return "Administrator";
		case "publisher":
			return "Herausgeber";
		case "redaktion":
			return "Redaktion";
		case "editor":
			return "Bearbeiter";
		case "contributor":
			return "Mitwirkender";
		case "viewer":
			return "Betrachter";
		default:
			return role;
	}
}

export function getAccessLabel(access: UserAccessDetails): string {
	switch (access.type) {
		case "inherit":
			return "Von Gruppe";
		case "custom":
			return "Benutzerdefiniert";
		default:
			return "Unbekannt";
	}
}
