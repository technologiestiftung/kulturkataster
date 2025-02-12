export async function fetchWFSData(url: string, typeNames: string) {
	const wfsUrl = url;
	const params = new URLSearchParams({
		service: "WFS",
		version: "2.0.0",
		request: "GetFeature",
		typeNames: typeNames,
		outputFormat: "application/json",
		srsName: "urn:ogc:def:crs:EPSG::25833",
	});

	const response = await fetch(`${wfsUrl}?${params.toString()}`);

	if (!response.ok) {
		throw new Error("Failed to fetch WFS data");
	}

	const data = await response.json();
	return data;
}
