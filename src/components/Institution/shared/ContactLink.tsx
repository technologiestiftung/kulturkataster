"use client";

import { normalizeUrl } from "@/lib/utils/sanitizerUtils";

interface ContactLinkProps {
	href: string;
	children: React.ReactNode;
	external?: boolean;
}

export function ContactLink({
	href,
	children,
	external = false,
}: ContactLinkProps) {
	const props = external
		? { target: "_blank", rel: "noopener noreferrer" }
		: {};

	const normalizedHref = external ? normalizeUrl(href) : href;

	return (
		<a
			href={normalizedHref}
			className="body2 text-primary-dark hover:underline wrap-anywhere"
			{...props}
		>
			{children}
		</a>
	);
}
