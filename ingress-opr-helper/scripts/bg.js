var settings = {};

chrome.storage.local.get(
	['provider', 'satellite', 'road', 'fixChina'],
	function(items) {
		function loadDefault(key, def) {
			return (items[key] === undefined) ? def : items[key];
		}
		settings.provider = loadDefault('prodiver', 'amap');
		settings.satellite = loadDefault('satellite', true);
		settings.road = loadDefault('road', true);
		settings.fixChina = loadDefault('fixChina', true);
	});

chrome.runtime.onMessage.addListener(
	function(msg, sender, sendResponse) {
		switch (msg.action) {
		case 'set':
			chrome.storage.local.set(msg.params);
			for (let key in msg.params) {
				settings[key] = msg.params[key];
			}
			break;
		case 'load_settings':
			sendResponse(settings);
			break;
		}
	});
