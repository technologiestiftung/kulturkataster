import { ModalFooter } from "@/components/Modals/ModalFooter";
import type { ReactNode } from "react";

type InstitutionLayoutProps = {
	children: ReactNode;
};

export default function InstitutionLayout({
	children,
}: InstitutionLayoutProps) {
	return (
		<>
			{children}
			<ModalFooter />
		</>
	);
}
