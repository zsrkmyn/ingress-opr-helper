const REVIEW_URL = "api/v1/vault/review";
const MAP_CONTAINER_HTML =
`<div id="opr-helper-map-container" class="col-xs-12 col-sm-6 text-center">
	<h4><span>OPR Helper 检查位置</span></h4>
	<div id="opr-helepr-config-position-config-helper-and-css-sucks">
	<div id="opr-helper-map"></div>
	<div id="opr-helper-config">
		<select id="opr-helper-provider"></select>
		<input type="checkbox" id="opr-helper-satellite"><label>Satellite</label>
		<input type="checkbox" id="opr-helper-road"><label>Road</label>
	</div>
	</div>
</div>
<div id="opr-helper-panorama-container" class="col-xs-12 col-sm-6 text-center">
	<h4><span>OPR Helper 全景预览</span></h4>
	<div id="opr-helper-panorama">所选地图提供商不提供全景或此处无全景。</div>
</div>`;

function loadScript(url) {
	return new Promise(function(resolve, reject) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.onload = resolve;
		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
	});
}

function loadJSON(url) {
	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open('GET', url);
		xhr.onload = function(e) {
			resolve(xhr.response);
		}
		xhr.send();
	});
}

//function loadJSON(url) {
//	return fetch(url).then((res) => res.json());
//}

/* stolen from https://on4wp7.codeplex.com/SourceControl/changeset/view/21483#353936 */
function earth2mars(lng, lat) {
	const a = 6378245.0;
    const ee = 0.00669342162296594323;
	const pi =  3.14159265358979324;

	function transformLat(x, y) {
		return -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
			+ (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			+ (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
			+ (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
	}

	function transformLng(x, y)
	{
		return 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
			+ (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
			+ (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
			+ (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
	}

	var dLat = transformLat(lng - 105.0, lat - 35.0);
	var dLon = transformLng(lng - 105.0, lat - 35.0);
	var radLat = lat / 180.0 * pi;
	var magic = Math.sin(radLat);
	magic = 1 - ee * magic * magic;
	var sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
	dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
	return [
		lng + dLon,  // lng
		lat + dLat // lat
	];
}

/* class to communicate with OPRHelperMap
 * Only the MapController and the OPRHelperMap who have the
 * same mapid can communicate with each other */
class MapController {
	constructor(mapid) {
		this.mapid = mapid;
		this.loadSettings()
			.then(this.loadReview.bind(this))
			.then(this.reInit.bind(this));
	}

	reInit() {
		this.mapReady = false;
		this.reviewReady = false;
		Promise.resolve()
			.then(this.resetContainer.bind(this))
			.then(this.loadMap.bind(this))
			.then(this.renderData.bind(this));
	}

	/* get portal data */
	loadReview() {
		return loadJSON(REVIEW_URL)
			.then((review) => this.review = review);
	}

	loadMap() {
		var settings = this.settings;

		return new Promise((resolve, reject) => {
			this.addEventListener('map-ready', function cb(e) {
				this.removeEventListener('map-ready', cb);

				if (settings.satellite)
					this.call('showSatellite', true);

				if (settings.road)
					this.call('showRoad', true);

				resolve();
			}.bind(this));

			loadScript(chrome.extension.getURL('scripts/' + settings.provider + '.js'))
				.then(() => {
					this.postEvent('newmap', {
						provider: settings.provider,
						mcontainer: 'opr-helper-map',
						pcontainer: 'opr-helper-panorama',
					})
				});
		});
	}

	resetContainer() {
		var form = document.getElementsByName('answers')[0];
		if (this.container)
			this.container.remove();
		var container = document.createElement('div');
		container.className = 'row';
		container.innerHTML = MAP_CONTAINER_HTML;
		form.insertBefore(container, form.firstElementChild.nextElementSibling);

		this.container = container;
		this.providerSelector = document.getElementById('opr-helper-provider');
		this.roadChecker = document.getElementById('opr-helper-road');
		this.satelliteChecker = document.getElementById('opr-helper-satellite');

		this.roadChecker.checked = this.settings.road;
		this.roadChecker.addEventListener('change', (e) => {
			this.settings.road = e.target.checked;
			this.call('showRoad', e.target.checked);
		}, false);

		this.satelliteChecker.checked = this.settings.satellite;
		this.satelliteChecker.addEventListener('change', (e) => {
			this.settings.satellite = e.target.checked;
			this.call('showSatellite', e.target.checked);
		}, false);

		OPRHelperProviders.forEach((p, i) => {
			var opt = document.createElement('option');
			opt.value = opt.innerHTML = p;
			this.providerSelector.appendChild(opt);
			if (p == this.settings.provider)
				this.providerSelector.selectedIndex = i;
		});
		this.providerSelector.addEventListener('change', (e) => {
			this.settings.provider =
				e.target.options[e.target.selectedIndex].value;
			this.reInit();
		}, false);
	}

	/* get settings */
	loadSettings() {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage({action: 'load_settings'},
				(settings) => {
					this.settings = settings;
					resolve(settings);
				});
		});
	}

	renderData() {
		var res = this.review['result'];
		var lat = res['lat'];
		var lng = res['lng'];
		if (this.settings.fixChina) {
			[lng, lat] = earth2mars(lng, lat);
		}
		this.call('setZoom', 16);
		this.call('setCenter', lng, lat);
		this.call('addMarker', lng, lat);
		this.call('showPanorama', lng, lat);
	}

	call(fname) {
		this.postEvent('action',
			{action: fname, params: Array.from(arguments).slice(1)})
	}

	postEvent(ename, content) {
		window.dispatchEvent(
			new CustomEvent(
				'opr-helper-event-' + ename,
				{detail: {mapid: this.mapid, content: content}}
			));
	}

	addEventListener(ename, cb) {
		window.addEventListener('opr-helper-event-' + ename, (e) => {
			if (e.detail.mapid == this.mapid) {
				cb(e.detail);
			}
		});
	}

	removeEventListener(ename, fn) {
		window.removeEventListener('opr-helper-event-' + ename, fn);
	}

}

Promise.resolve()
	.then(() => loadScript(chrome.extension.getURL('scripts/utils.js')))
	.then(() => loadScript(chrome.extension.getURL('scripts/map.js')))
	.then(() => new MapController('basic'));

