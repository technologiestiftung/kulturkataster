import type { ReactNode } from "react";
import { StoreInitializer } from "@/components/StoreInitializer";
import { getPublicInstitutionData } from "@/server/actions/publicInstitutionData";

type InstitutionModalLayoutProps = {
	children: ReactNode;
};

export default async function InstitutionModalLayout({
	children,
}: InstitutionModalLayoutProps) {
	const publicData = await getPublicInstitutionData();

	return (
		<>
			<StoreInitializer publicData={publicData} />
			{children}
		</>
	);
}
