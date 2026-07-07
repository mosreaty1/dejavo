(function () {
	'use strict';

	/**
	 * Component: RTE slider
	 * ------------------------------------------------------------------------------
	 * @namespace RteSlider
	 */

	const selectors = {
		slider: "slider"
	};

	var RteSlider = () => {
		const nodeSelectors = {};
		const swiperSliders = [];

		nodeSelectors.sliders = [...document.querySelectorAll(selectors.slider)];

		if (!nodeSelectors.sliders) {
			return false;
		}

		const Swiper = window.themeCore.utils.Swiper;
		const icons = window.themeCore.utils.icons;

		function init() {
			nodeSelectors.sliders.forEach((slider) => {
				const slidesElement = document.createElement("div");
				slidesElement.innerHTML = slider.innerHTML;
				const slides = [...slidesElement.querySelectorAll("img")];

				slider.innerHTML = `
				<div class="swiper rte-slider">
					<div class="swiper-wrapper"></div>

					<button
						class="swiper-button-next rte-slider-button-next"
						type="button"
						aria-label="Next slide"
					>
						${icons.arrowRight}
					</button>

    				<button
    					class="swiper-button-prev rte-slider-button-prev"
						type="button"
						aria-label="Prev slide"
    				>
						${icons.arrowRight}
					</button>

					<div class="swiper-pagination rte-slider-swiper-pagination"></div>
				</div>
			`;

				const sliderSwiper = slider.querySelector(".swiper");
				const swiperWrapper = slider.querySelector(".swiper-wrapper");
				slides.forEach((slide) => {
					const swiperSlide = document.createElement("div");
					swiperSlide.classList.add("swiper-slide");
					swiperSlide.appendChild(slide);

					swiperWrapper.appendChild(swiperSlide);
				});

				swiperSliders.push(
					new Swiper(sliderSwiper, {
						navigation: {
							nextEl: ".swiper-button-next",
							prevEl: ".swiper-button-prev"
						},
						pagination: {
							el: ".swiper-pagination"
						}
					})
				);
			});
		}

		return Object.freeze({
			init,
			sliders: swiperSliders
		});
	};

	const action = () => {
		window.themeCore.rteSliders = window.themeCore.rteSliders || RteSlider();
		window.themeCore.rteSliders.init();
		window.themeCore.utils.register(window.themeCore.rteSliders, "rte-sliders");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
