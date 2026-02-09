import type { ReactNode } from "react";

type InstitutionLayoutProps = {
	children: ReactNode;
};

export default function InstitutionLayout({
	children,
}: InstitutionLayoutProps) {
	return (
		<section className="min-h-[calc(100vh-4rem)] absolute flex flex-1 flex-col space-y-20">
			{children}
		</section>
	);
}
