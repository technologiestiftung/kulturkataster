import { AccountFaqModal } from "@/components/Modals/Pages/AccountFaqModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.accountFaq",
);

export default function AccountFaqPage() {
	return (
		<AccountFaqModal routePath="/account/faq" returnTo="/account/activity" />
	);
}
