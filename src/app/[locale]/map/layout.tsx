import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata("common.map.title");

export default function MapLayout({ children }: { children: React.ReactNode }) {
	return children;
}
