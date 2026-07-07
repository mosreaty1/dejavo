(function () {
	'use strict';

	const selectors = {
		section: ".js-complementary-products",
		content: ".js-complementary-products-content",
		swiper: ".swiper",
		buttonPrev: ".js-complementary-products-slider-prev",
		buttonNext: ".js-complementary-products-slider-next"
	};

	var ProductComplementary = () => {
		let sections = [];
		const Swiper = window.themeCore.utils.Swiper;
		const cssClasses = window.themeCore.utils.cssClasses;

		async function init() {
			sections = [...document.querySelectorAll(selectors.section)];

			await Promise.all(sections.map((section) => setupComplementary(section)));

			window.themeCore.LazyLoadImages.init();

			sections.forEach((section) => initSlider(section));
		}

		async function getHTML(url) {
			const response = await fetch(url);
			const resText = await response.text();
			return new DOMParser().parseFromString(resText, "text/html");
		}

		async function setupComplementary(section) {
			try {
				const url = new URL(window.location.origin + section.dataset.url);
				const sectionFetched = await getHTML(url.toString());

				const content = section.querySelector(selectors.content);
				const contentFetched = sectionFetched.querySelector(selectors.content);

				if (!contentFetched.innerHTML) {
					return;
				}

				content.innerHTML = contentFetched.innerHTML;
				section.classList.remove(cssClasses.hidden);
				window.themeCore.EventBus.emit("compare-products:init");
			} catch (e) {
				console.error(e);
			}
		}

		function initSlider(section) {
			const slider = section.querySelector(selectors.swiper);
			const buttonNext = section.querySelector(selectors.buttonNext);
			const buttonPrev = section.querySelector(selectors.buttonPrev);
			const design = section.getAttribute("data-design");

			if (!slider) {
				return;
			}

			let spaceBetweenMob = 0;
			let spaceBetweenDesk = 0;

			if (design === "alternate") {
				spaceBetweenMob = 12;
				spaceBetweenDesk = 30;
			}

			new Swiper(slider, {
				slidesPerView: 2,
				speed: 600,
				spaceBetween: spaceBetweenMob,
				navigation: {
					nextEl: buttonNext,
					prevEl: buttonPrev
				},
				pagination: {
					el: ".js-complementary-pagination",
					type: "bullets",
					clickable: true
				},
				breakpoints: {
					1200: {
						spaceBetween: spaceBetweenDesk
					}
				}
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.ProductComplementary = window.themeCore.ProductComplementary || ProductComplementary();
		window.themeCore.utils.register(window.themeCore.ProductComplementary, "product-complementary");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
