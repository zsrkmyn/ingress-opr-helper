{
/* singleton of controller */
let OPRHelperMapFactory_ = class {
	constructor() {
		this.registry = {};
		this.loaded = [];

		window.addEventListener('opr-helper-event-newmap', (e) => {
			var mapid = e.detail.mapid;
			var provider = e.detail.content.provider;
			var settings = e.detail.content;

			function doNew() {
				new this.registry[provider].proto(mapid, settings);
			}

			if (!this.loaded.find((p) => p == provider)) {
				this.loaded.push(provider);
				Promise.resolve()
					.then(this.registry[provider].load)
					.then(doNew.bind(this));
			} else {
				(doNew.bind(this))();
			}
		});
	}

	register(provider, proto, load) {
		if (this.registry.hasOwnProperty(provider))
			return -1;
		this.registry[provider] = {
			proto: proto,
			load: load,
		};
		return 0;
	}
}
window.OPRHelperMapFactory = new OPRHelperMapFactory_();
}


class OPRHelperMap {
	constructor(mapid) {
		this.mapid = mapid;
		window.addEventListener('opr-helper-event-action', (e) => {
			if (e.detail.mapid != this.mapid)
				return;
			e = e.detail.content;
			if (typeof this[e.action] == 'function') {
				this[e.action].apply(this, e.params);
			}
		});
	}

	ready() {
		this.postEvent('map-ready');
	}

	postEvent(ename, content) {
		window.dispatchEvent(
			new CustomEvent(
				'opr-helper-event-' + ename,
				{detail: {mapid: this.mapid, content: content}}
			));
	}
}
