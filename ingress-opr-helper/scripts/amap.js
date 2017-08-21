{
let AMAP_URL = "https://webapi.amap.com/maps?v=1.3&key=bf3417f86991b12f5b64466f7e0498a0";
let OPRHelperAMap = class extends OPRHelperMap {
	constructor(mapid, settings) {
		super(mapid);
		window.map = this.map = new AMap.Map(
			settings.mcontainer,
			{showIndoorMap: false}
		);
		AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
			this.map.addControl(new AMap.ToolBar({
				position: 'RB',
				liteStyle: true,
				direction: false,
			}));
			this.map.addControl(new AMap.Scale());
		})
		this.ready();
	}

	setZoom(z) {
		this.map.setZoom(z);
	}

	setCenter(lng, lat) {
		this.map.setCenter([lng, lat]);
	}

	addMarker(lng, lat, icon, offset) {
		var opt = {
			map: this.map,
			position: [lng, lat],
		}
		if (icon) {
			opt.icon = icon;
			if (offset)
				opt.offset = new AMap.Pixel(offset[0], offset[1]);
		}
		var marker = new AMap.Marker(opt);
		marker.show();
	}

	showSatellite(flag) {
		if (!this.satellite)
			this.satellite = new AMap.TileLayer.Satellite(
				{map: this.map, opacity: 1});
		if (flag == undefined || flag)
			this.satellite.show();
		else
			this.satellite.hide();
	}

	showRoad(flag) {
		if (!this.road)
			this.road = new AMap.TileLayer.RoadNet(
				{map: this.map, opacity: 1});
		if (flag == undefined || flag)
			this.road.show();
		else
			this.road.hide();
	}
}

OPRHelperMapFactory.register('amap', OPRHelperAMap, () => loadScript(AMAP_URL));
}
