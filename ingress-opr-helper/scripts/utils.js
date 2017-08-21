function loadScript(url) {
	return new Promise((resolve, reject) => {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.onload = resolve;
		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
	});
}

