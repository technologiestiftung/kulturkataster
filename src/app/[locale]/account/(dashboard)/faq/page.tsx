import { AccountFaqModal } from "@/components/Modals/Pages/AccountFaqModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "FAQ – Kulturkataster",
};

export default function AccountFaqPage() {
	return <AccountFaqModal routePath="/account/faq" returnTo="/account/activity" />;
}
