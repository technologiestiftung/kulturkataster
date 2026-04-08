import { Skeleton } from "@/components/ui/skeleton";
import KukaSmallLogo from "@/logos/kuka-small.svg";

export function MapSkeleton() {
	return (
		<div className="Map-root w-full h-full relative bg-neutral-10 overflow-hidden">
			<Skeleton className="h-full w-full rounded-none" />
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-neutral-10/20 via-neutral-10/45 to-neutral-10/75" />
			<div className="pointer-events-none absolute inset-y-0 left-0 hidden md:flex md:w-[min(30rem,40vw)] p-4">
				<Skeleton className="h-full w-full rounded-sm" />
			</div>
			<div className="pointer-events-none absolute right-4 bottom-24 flex flex-col gap-3">
				<Skeleton className="h-14 w-14 rounded-full" />
				<Skeleton className="h-14 w-14 rounded-full" />
			</div>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
				<div className="flex items-center gap-4">
					<div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary-light/25">
						<div className="absolute inset-0 rounded-full border border-primary/35 motion-safe:animate-ping" />
						<KukaSmallLogo className="relative size-8 text-primary-dark" />
					</div>
				</div>
			</div>
		</div>
	);
}
