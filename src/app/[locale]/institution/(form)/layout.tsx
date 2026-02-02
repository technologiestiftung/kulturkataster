import type { ReactNode } from "react";

type InstitutionLayoutProps = {
	children: ReactNode;
};

export default function InstitutionLayout({
	children,
}: InstitutionLayoutProps) {
	return <>{children}</>;
}
