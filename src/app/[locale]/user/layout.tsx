import { ModalFooter } from "@/components/Modals/ModalFooter";
import type { ReactNode } from "react";

type UserLayoutProps = {
	children: ReactNode;
};

export default function UserLayout({ children }: UserLayoutProps) {
	return (
		<section className="min-h-[calc(100vh-4rem)] flex flex-1 flex-col items-center justify-center px-4">
			{children}
			<ModalFooter />
		</section>
	);
}
