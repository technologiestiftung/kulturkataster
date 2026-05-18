import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";
import { getCurrentProfile } from "@/server/actions/auth";

export default async function DownloadIntercepted() {
	const isAuthenticated = (await getCurrentProfile()) !== null;

	return (
		<DownloadModal routePath="/download" isAuthenticated={isAuthenticated} />
	);
}
