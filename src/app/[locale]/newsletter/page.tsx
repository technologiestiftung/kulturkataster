import { NewsletterModal } from "@/components/Modals/Pages/NewsletterModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Newsletter des Berliner Kulturkatasters",
};

export default async function NewsletterPage({
	searchParams,
}: {
	searchParams: Promise<{ confirmation?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const confirmationParam = resolvedSearchParams?.confirmation;
	const showConfirmation = confirmationParam === "1";
	return (
		<NewsletterModal
			routePath="/newsletter"
			showConfirmation={showConfirmation}
		/>
	);
}
