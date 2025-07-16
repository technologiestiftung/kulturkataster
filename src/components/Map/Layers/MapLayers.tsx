import { FC } from "react";

interface MapLayersProps {
	children: React.ReactNode;
}

const MapLayers: FC<MapLayersProps> = ({ children }) => {
	return <>{children}</>;
};

export default MapLayers;
