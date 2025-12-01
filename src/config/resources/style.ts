const styleList = [
	{
		styleId: "bezirksgrenzen",
		rules: [
			{
				style: {
					polygonStrokeWidth: 2,
					polygonStrokeColor: [98, 1, 224, 1],
					labelField: "namgem",
					labelFont: "bold 14px Arial",
					labelFillColor: "#555B54",
					labelStrokeColor: "#fff",
					labelStrokeWidth: 2,
				},
			},
		],
	},
	{
		styleId: "ortsteile",
		rules: [
			{
				style: {
					polygonStrokeWidth: 2,
					polygonStrokeColor: [98, 1, 224, 1],
					labelField: "nam",
					labelFont: "bold 12px Arial",
					labelFillColor: "#555B54",
					labelStrokeColor: "#fff",
					labelStrokeWidth: 2,
				},
			},
		],
	},
];

export default styleList;
