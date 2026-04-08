import { redirect } from "next/navigation";
import { requirePositiveIntParam } from "@/lib/utils/routeParams";

type InstitutionDetailRouteProps = {
	params: Promise<{ locale: string; id: string }>;
};

export default async function InstitutionDetailRoute({
	params,
}: InstitutionDetailRouteProps) {
	const { locale, id } = await params;
	const parsedId = requirePositiveIntParam(id, `/${locale}/map`);

	redirect(`/${locale}/map/institution/${parsedId}`);
}
