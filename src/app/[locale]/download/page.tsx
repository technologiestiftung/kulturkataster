import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Download – Kulturkataster",
};

export default function DownloadPage() {
	return <DownloadModal routePath="/download" />;
}
