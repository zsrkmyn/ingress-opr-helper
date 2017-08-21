new Promise(
	(resolve, reject) => {
		chrome.runtime.sendMessage({action: 'load_settings'},
			(settings) => {
				if (settings === undefined) {
					reject(chrome.runtime.lastError.message);
				} else {
					resolve(settings);
				}
			});
	}
).then(
	(settings) => {
		var doInit = () => {
			if (document.readyState != 'complete')
				return;

			var satelliteChecker = document.getElementById('satellite');
			var roadChecker = document.getElementById('road');
			var providerSelector = document.getElementById('provider');
			var fixChinaChecker = document.getElementById('fixchina');

			roadChecker.checked = settings.road;
			roadChecker.addEventListener('change', (e) => {
				chrome.runtime.sendMessage({
					action: 'set',
					params: {road: e.target.checked}
				});
			}, false);

			satelliteChecker.checked = settings.satellite;
			satelliteChecker.addEventListener('change', (e) => {
				chrome.runtime.sendMessage({
					action: 'set',
					params: {satellite: e.target.checked}
				});
			}, false);

			fixChinaChecker.checked = settings.fixChina;
			fixChinaChecker.addEventListener('change', (e) => {
				chrome.runtime.sendMessage({
					action: 'set',
					params: {fixChina: e.target.checked}
				});
			}, false);

			OPRHelperProviders.forEach((p, i) => {
				var opt = document.createElement('option');
				opt.value = opt.innerHTML = p;
				providerSelector.appendChild(opt);
				if (p == settings.provider)
					providerSelector.selectedIndex = i;
			});
			providerSelector.addEventListener('change', (e) => {
				chrome.runtime.sendMessage({
					action: 'set',
					params: {provider: e.target.options[e.target.selectedIndex].value}
				});
			}, false);
		}

		if (document.readyState == 'complete')
			doInit();
		else
			document.onreadystatechange = doInit;
	}
).then(
	null,
	console.error
)
