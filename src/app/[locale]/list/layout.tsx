import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata("common.listView.title");

export default function ListLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
