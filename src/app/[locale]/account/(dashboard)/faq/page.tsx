import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "FAQ – Kulturkataster",
};

export default function AccountFaqPage() {
	return (
		<div className="mx-auto px-10 w-full h-full min-h-0 flex flex-col">
			<div className="space-y-2 py-4">
				<h2 className="text-2xl font-bold">FAQ</h2>
				<p className="body2 text-neutral-80">
					Inhalt folgt in einem nächsten Schritt.
				</p>
			</div>
		</div>
	);
}
