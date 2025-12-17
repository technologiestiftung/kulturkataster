import { ActivityList, type Activity } from "@/components/Activity";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Activity – Kulturkataster",
};

const fakeActivities: Activity[] = [
	{
		date: "31.10.2025",
		user: "Admin",
		action: "Admin-Anfrage wird geprüft",
		item: "Kreuzwerk",
		itemLink: "/institutions/kreuzwerk",
		status: "pending",
	},
	{
		date: "31.10.2025",
		user: "System",
		action: "Änderung wird geprüft",
		item: "Galerie im Saalbau",
		itemLink: "/institutions/galerie-saalbau",
		status: "pending",
	},
	{
		date: "23.10.2025",
		user: "Admin",
		action: "Anfrage wurde bestätigt",
		item: "Mäusebunker",
		itemLink: "/institutions/mausebunker",
		status: "approved",
	},
	{
		date: "21.10.2025",
		user: "Admin",
		action: "Anfrage wird geprüft",
		item: "Mäusebunker",
		itemLink: "/institutions/mausebunker",
		status: "pending",
	},
	{
		date: "18.09.2025",
		user: "System",
		action: "Änderung veröffentlicht",
		item: "Ein langer Name eines Kulturortes",
		itemLink: "/institutions/kulturort",
		status: "completed",
	},
	{
		date: "18.09.2025",
		user: "Admin",
		action: "Änderung wird geprüft",
		item: "Ein langer Name eines Kulturortes",
		itemLink: "/institutions/kulturort",
		status: "pending",
	},
	{
		date: "10.09.2025",
		user: "Admin",
		action: "Anfrage wurde abgelehnt",
		item: "Neues Internationale",
		itemLink: "/institutions/neues-internationale",
		relation: "Kreuzberg",
		relationLink: "/districts/kreuzberg",
		status: "rejected",
	},
];

export default function ActivityPage() {
	return (
		<div className="space-y-6 px-10 py-4">
			<ActivityList activities={fakeActivities} />
		</div>
	);
}
