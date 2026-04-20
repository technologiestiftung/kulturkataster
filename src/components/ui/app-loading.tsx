import KukaSmallLogo from "@/logos/kuka-small.svg";

interface AppLoadingProps {
	overlay?: boolean;
}

export function AppLoading({ overlay = false }: AppLoadingProps) {
	return (
		<div
			className={
				overlay
					? "fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
					: "flex h-full w-full items-center justify-center"
			}
		>
			<div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary-light/25">
				<div className="absolute inset-0 rounded-full border border-primary/35 motion-safe:animate-ping" />
				<KukaSmallLogo className="relative size-8 text-primary-dark" />
			</div>
		</div>
	);
}
