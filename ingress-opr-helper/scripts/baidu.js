{
let BMAP_URL = "https://api.map.baidu.com/api?v=2.0&ak=gfXoaMam8YmLlPZ05kKUw7C7CLykEn3T&s=1";
let OPRHelperBaiduMap = class extends OPRHelperMap {
	constructor(mapid, settings) {
		super(mapid);
		this.road = false;
		this.satellite = false;
		this.pcontainer = settings.pcontainer;
		this.map = new BMap.Map(settings.mcontainer);
		this.map.centerAndZoom(new BMap.Point(116, 39), 15); // fuck baidu! map won't work if centerAndZoom isn't called
		this.map.enableScrollWheelZoom();
		this.map.enableContinuousZoom();
		this.map.addControl(new BMap.NavigationControl({
			anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
			type: BMAP_NAVIGATION_CONTROL_ZOOM,
		}));
		this.map.addControl(new BMap.ScaleControl({
			anchor: BMAP_ANCHOR_BOTTOM_LEFT,
		}));
		this.ready()
	}

	setZoom(z) {
		this.map.setZoom(z);
	}

	setCenter(lng, lat) {
		[lng, lat] = OPRHelperBaiduMap.mars2baidu(lng, lat);
		this.map.setCenter(new BMap.Point(lng, lat));
	}

	addMarker(lng, lat, icon, offset) {
		[lng, lat] = OPRHelperBaiduMap.mars2baidu(lng, lat);
		var pos = new BMap.Point(lng, lat);
		var opt = {}
		if (icon) {
			opt.icon = new BMap.Icon(icon);
		}
		var marker = new BMap.Marker(pos, opt);
		this.map.addOverlay(marker);
	}

	showSatellite(flag) {
		var mapType;
		if (flag === undefined || flag) {
			this.satellite = true;
			if (this.road)
				mapType = BMAP_HYBRID_MAP;
			else
				mapType = BMAP_SATELLITE_MAP;
		} else {
			this.satellite = false;
			mapType = BMAP_NORMAL_MAP;
		}
		this.map.setMapType(mapType);
	}

	showRoad(flag) {
		var mapType = BMAP_NORMAL_MAP;
		if (flag === undefined || flag) {
			this.road = true;
			if (this.satellite)
				mapType = BMAP_HYBRID_MAP;
		} else {
			this.road= false;
			if (this.satellite)
				mapType = BMAP_SATELLITE_MAP;
		}
		this.map.setMapType(mapType);
	}

	showPanorama(lng, lat) {
		[lng, lat] = OPRHelperBaiduMap.mars2baidu(lng, lat);
		OPRHelperBaiduMap.getPanoramaInfo(lng, lat)
			.then((data) => {
				if (!this.panorama) {
					this.panorama =
						new BMap.Panorama(this.pcontainer, {
							navigationControl: true,
							linksControl: true,
						});
				}
				var pos = new BMap.Point(lng, lat);
				this.panorama.setPosition(pos);
				this.panorama.addOverlay(
					new BMap.PanoramaLabel(
						'Portal Here',
						{position: pos}
					)
				);
				this.panorama.show();
			});
	}

	static getPanoramaInfo(lng, lat) {
		return new Promise((resolve, reject) => {
			var service = new BMap.PanoramaService();
			service.getPanoramaByLocation(new BMap.Point(lng, lat),
				(data) => {
					if (data == null)
						reject();
					else
						resolve(data);
				});
		});
	}

	// stolen from http://blog.csdn.net/coolypf/article/details/8569813
	static mars2baidu(lng, lat) {
		const xpi = 3.14159265358979324 * 3000.0 / 180.0;
		var z = Math.sqrt(lng * lng + lat * lat) + 2e-5 * Math.sin(lat * xpi);
		var theta = Math.atan2(lat, lng) + 3e-6 * Math.cos(lng * xpi);
		return [
			z * Math.cos(theta) + 0.0065, // lng
			z * Math.sin(theta) + 0.006   // lat
		];
	}
}

OPRHelperMapFactory.register('baidu', OPRHelperBaiduMap, () => {
	return new Promise((resolve, reject) => {
		BMAP_URL += '&callback=window.onbmapload_';
		window.onbmapload_ = () => {
			delete window.onbmapload_;
			setTimeout(resolve, 2000);
		}
		loadScript(BMAP_URL);
	});
});
}
