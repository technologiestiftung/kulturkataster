import { redirect } from "next/navigation";
import { localePath } from "@/lib/utils/localePath";

export default async function AccountPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	redirect(localePath(locale, "/account/activity"));
}
