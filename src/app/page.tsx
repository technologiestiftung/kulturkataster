import Map from "@/components/modules/Map/Map";
import { initMapStyle } from "@/lib/helpers/mapHelpers";

export default async function Home() {
	const mapStyle = await initMapStyle();

	return (
		<div className="items-center justify-items-center min-h-screen relative">
			<main>
				<Map initialMapStyle={mapStyle} />
			</main>
		</div>
	);
}
