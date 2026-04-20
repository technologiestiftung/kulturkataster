import { Suspense, type ReactNode } from "react";
import { AppLoading } from "@/components/ui/app-loading";
import { getCurrentUser } from "@/server/actions/auth";

type AccountModalLayoutProps = {
	children: ReactNode;
};

export default async function AccountModalLayout({
	children,
}: AccountModalLayoutProps) {
	const user = await getCurrentUser();
	if (!user) return null;

	return <Suspense fallback={<AppLoading overlay />}>{children}</Suspense>;
}
