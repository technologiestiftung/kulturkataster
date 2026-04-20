import { Suspense, type ReactNode } from "react";
import { AppLoading } from "@/components/ui/app-loading";

type AccountModalLayoutProps = {
	children: ReactNode;
};

export default function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
	return (
		<Suspense fallback={<AppLoading overlay />}>
			{children}
		</Suspense>
	);
}
