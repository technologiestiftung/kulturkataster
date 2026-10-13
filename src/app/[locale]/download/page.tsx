import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";
import { getCurrentProfile } from "@/server/actions/auth";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.download",
);

export default async function DownloadPage() {
	const isAuthenticated = (await getCurrentProfile()) !== null;

	return (
		<DownloadModal routePath="/download" isAuthenticated={isAuthenticated} />
	);
}
