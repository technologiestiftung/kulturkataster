import { EditProfileModal } from "@/components/Modals/Pages/EditProfileModal";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Edit Profile – Kulturkataster",
};

export default function EditProfilePage() {
	return <EditProfileModal />;
}
