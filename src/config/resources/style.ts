const styleList = [
	{
		styleId: "bezirksgrenzen",
		rules: [
			{
				style: {
					polygonStrokeWidth: 2,
					polygonStrokeColor: [185, 38, 222, 1],
					labelField: "namgem",
					labelFont: "bold 14px Arial",
					labelFillColor: "#B926DE",
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
					polygonStrokeColor: [185, 38, 222, 1],
					labelField: "nam",
					labelFont: "bold 12px Arial",
					labelFillColor: "#B926DE",
					labelStrokeColor: "#fff",
					labelStrokeWidth: 2,
				},
			},
		],
	},
];

export default styleList;
