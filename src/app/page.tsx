import Map from "@/components/modules/Map";
import { getMapStyle } from "@/lib/getMapStyle";

export default async function Home() {
	const mapStyle = await getMapStyle();

	return (
		<div className="items-center justify-items-center min-h-screen pt-8">
			<h1 className="text-3xl pb-8">Kulturkataster coming soon...</h1>
			<main>
				<Map mapStyle={mapStyle} />
			</main>
		</div>
	);
}
