import Map from "@/components/modules/Map/Map";
import { initMapStyle } from "@/lib/helpers/mapHelpers";

export default async function Home() {
	const mapStyle = await initMapStyle();

	return (
		<div className="items-center justify-items-center min-h-screen pt-8">
			<h1 className="text-3xl pb-8">Kulturkataster coming soon...</h1>
			<main>
				<Map initialMapStyle={mapStyle} />
			</main>
		</div>
	);
}
