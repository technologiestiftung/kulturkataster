import { redirect } from "next/navigation";

type InstitutionDetailRouteProps = {
	params: { locale: string; id: string };
};

export default function InstitutionDetailRoute({
	params,
}: InstitutionDetailRouteProps) {
	redirect(`/${params.locale}/map/institution/${params.id}`);
}
