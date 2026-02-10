import { AccountFaqModal } from "@/components/Modals/Pages/AccountFaqModal";

export default function AccountFaqModalIntercepted() {
	return <AccountFaqModal routePath="/account/faq" returnTo="/account/activity" />;
}
