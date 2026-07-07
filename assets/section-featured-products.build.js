(function () {
	'use strict';

	const selectors = {
		section: ".js-featured-products"
	};

	var FeaturedProducts = () => {
		let Slider;

		async function init(sectionId) {
			Slider = await window.themeCore.utils.getExternalUtil("FeaturedContentSlider");
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			sections.forEach((section) => {
				let sliderOptions = {
					grabCursor: true,
					slidesPerView: 2
				};

				if (section.hasAttribute("data-cards-indent")) {
					sliderOptions.spaceBetween = 10;
				}

				Slider(section, sliderOptions).init();
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.FeaturedProducts = window.themeCore.FeaturedProducts || FeaturedProducts();

		window.themeCore.utils.register(window.themeCore.FeaturedProducts, "featured-products");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
