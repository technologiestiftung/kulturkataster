import type { ReactNode } from "react";
import { StoreInitializer } from "@/components/StoreInitializer";
import { getPublicInstitutionData } from "@/server/actions/publicInstitutionData";

type InstitutionLayoutProps = {
	children: ReactNode;
};

export default async function InstitutionLayout({
	children,
}: InstitutionLayoutProps) {
	const publicData = await getPublicInstitutionData();

	return (
		<>
			<StoreInitializer publicData={publicData} />
			{children}
		</>
	);
}
