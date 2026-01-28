import { UserFormModal } from "@/components/Users/UserFormModal";

export default function NewUserPage() {
	return <UserFormModal mode="create" shouldRefresh={false} />;
}
