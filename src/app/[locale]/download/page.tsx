import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";
import { getCurrentProfile } from "@/server/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Download – Kulturkataster",
};

export default async function DownloadPage() {
	const isAuthenticated = (await getCurrentProfile()) !== null;

	return (
		<DownloadModal routePath="/download" isAuthenticated={isAuthenticated} />
	);
}
