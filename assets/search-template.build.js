(function () {
	'use strict';

	var SearchTemplate = () => {
		const selectors = {
			section: ".js-search"
		};

		async function init() {
			const ProductFilters = await window.themeCore.utils.getExternalUtil("ProductFilters");
			const section = document.querySelector(selectors.section);
			ProductFilters(section).init();
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.SearchTemplate = window.themeCore.SearchTemplate || SearchTemplate();
		window.themeCore.utils.register(window.themeCore.SearchTemplate, "search-template");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
