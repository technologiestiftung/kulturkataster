import { Loading } from "@/components/ui/loading";

export default function AccountModalLoading() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<Loading size="lg" />
		</div>
	);
}
