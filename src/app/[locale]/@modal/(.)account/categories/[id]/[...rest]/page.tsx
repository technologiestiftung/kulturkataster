import { redirect } from "next/navigation";

export default async function IdCatchAllRedirect({
	params,
}: {
	params: Promise<{ locale: string; id: string; rest: string[] }>;
}) {
	const { locale, id } = await params;
	redirect(`/${locale}/account/categories/${id}/edit`);
}
