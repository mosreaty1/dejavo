(function () {
	'use strict';

	const selectors = {
		section: ".js-featured-products"
	};

	var FeaturedProductsNew = () => {
		let Slider;

		async function init(sectionId) {
			Slider = await window.themeCore.utils.getExternalUtil("FeaturedContentSlider");
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			sections.forEach((section) => {
				let sliderOptions = {
					grabCursor: true,
					slidesPerView: 2,
					spaceBetween: 12
				};

				Slider(section, sliderOptions).init();
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.FeaturedProductsNew = window.themeCore.FeaturedProductsNew || FeaturedProductsNew();

		window.themeCore.utils.register(window.themeCore.FeaturedProductsNew, "featured-products-new");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
