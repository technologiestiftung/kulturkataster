interface VersionItem {
	badge: string;
	label: string;
	text: string;
}

interface VersionsListProps {
	label: string;
	items: VersionItem[];
}

export function VersionsList({ label, items }: VersionsListProps) {
	return (
		<div className="flex flex-col items-center gap-6 rounded-sm bg-neutral-5 px-6 py-4 my-4">
			<p className="body2 font-bold w-full [letter-spacing:0.016rem]">
				{label}
			</p>
			{items.map((item, index) => (
				<div key={index} className="flex flex-col items-start gap-1 w-full">
					<div className="rounded-sm bg-brand-default px-2 py-1">
						<h2 className="font-bold">{item.badge}</h2>
					</div>
					<div className="flex flex-col items-start w-full">
						<span className="body2 font-bold [letter-spacing:0.016rem]">
							{item.label}
						</span>
						<span className="body2 [letter-spacing:0.016rem]">{item.text}</span>
					</div>
				</div>
			))}
		</div>
	);
}
