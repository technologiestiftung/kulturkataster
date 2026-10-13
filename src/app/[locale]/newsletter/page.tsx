import { NewsletterModal } from "@/components/Modals/Pages/NewsletterModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.newsletter",
	{
		absolute: true,
	},
);

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
