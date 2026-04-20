import { Suspense, type ReactNode } from "react";
import { Loading } from "@/components/ui/loading";

type AccountModalLayoutProps = {
	children: ReactNode;
};

export default function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
	return (
		<Suspense
			fallback={
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
					<Loading size="lg" />
				</div>
			}
		>
			{children}
		</Suspense>
	);
}
