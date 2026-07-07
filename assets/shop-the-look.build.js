(function () {
	'use strict';

	/**
	 * Section: Shop the look
	 * ------------------------------------------------------------------------------
	 * @namespace ShopTheLookCarousel
	 */

	const selectors = {
		section: ".js-shop-the-look",
		productsSlider: ".js-shop-the-look-slider",
		productSlide: ".js-shop-the-look-slide",
		pointButton: ".js-shop-the-look-point",
		sliderButtonNext: ".js-shop-the-look-slider-button-next",
		sliderButtonPrev: ".js-shop-the-look-slider-button-prev"
	};

	const attributes = {
		pointButtonIndex: "data-point-index"
	};

	var ShopTheLookCarousel = () => {
		const Swiper = window.themeCore.utils.Swiper;
		const on = window.themeCore.utils.on;
		const cssClasses = window.themeCore.utils.cssClasses;
		let sectionComponents = [];

		function init(sectionId) {
			sectionComponents = [];
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			if (sections) {
				sections.forEach((section) => {
					sectionComponents.push({
						section,
						productSlide: [...section.querySelectorAll(selectors.productSlide)],
						productsSlider: section.querySelector(selectors.productsSlider),
						pointButtons: [...section.querySelectorAll(selectors.pointButton)],
						sliderButtonNext: section.querySelector(selectors.sliderButtonNext),
						sliderButtonPrev: section.querySelector(selectors.sliderButtonPrev)
					});
				});
			}

			setEventListeners();
			slidersInit();
		}

		/**
		 * Set click events on items.
		 */
		function setEventListeners() {
			sectionComponents.forEach(({ pointButtons }) => {
				pointButtons.forEach((pointButton) => {
					on("click", pointButton, pointButtonHandler);
				});
			});
		}

		function pointButtonHandler(event) {
			if (!isTargetPointButton(event.target)) {
				return;
			}

			const pointButton = getClosestPointButton(event.target);

			togglePointButton(pointButton);
		}

		function isTargetPointButton(target) {
			return !!sectionComponents.find(({ pointButtons }) => pointButtons.includes(target.closest(selectors.pointButton)));
		}

		function getClosestPointButton(target) {
			return target.closest(selectors.pointButton);
		}

		function togglePointButton(pointButton) {
			const closestSection = pointButton.closest(selectors.section);

			const pointButtonIndex = getPointButtonIndex(pointButton);

			const currentSection = sectionComponents.find(({ section }) => closestSection === section);

			removeActiveClasses(currentSection.pointButtons);

			setCurrentElementActive(pointButton);

			setCurrentSlide(currentSection.swiper, pointButtonIndex);
		}

		function removeActiveClasses(elements) {
			elements.forEach((element) => element.classList.remove(cssClasses.active));
		}

		function setCurrentElementActive(element) {
			element.classList.add(cssClasses.active);
		}

		function getPointButtonIndex(pointButton) {
			return +pointButton.getAttribute(attributes.pointButtonIndex);
		}

		function slidersInit() {
			sectionComponents.forEach((section) => {
				const slider = section.productsSlider;
				const buttonNext = section.sliderButtonNext;
				const buttonPrev = section.sliderButtonPrev;

				section.swiper = sliderInit(slider, buttonNext, buttonPrev);
			});
		}

		function sliderInit(slider, buttonNext, buttonPrev) {
			return new Swiper(slider, {
				slidesPerView: 2,
				slidesPerGroup: 2,
				speed: 600,
				navigation: {
					nextEl: buttonNext,
					prevEl: buttonPrev
				},
				breakpoints: {
					768: {
						slidesPerView: 1.26,
						slidesPerGroup: 1,
						spaceBetween: 30
					},
					992: {
						slidesPerView: 1.26,
						slidesPerGroup: 1,
						spaceBetween: 40
					},
					1200: {
						slidesPerView: 1.26,
						slidesPerGroup: 1,
						spaceBetween: 50
					},
					1500: {
						slidesPerView: 1.26,
						slidesPerGroup: 1,
						spaceBetween: 60
					}
				}
			});
		}

		function setCurrentSlide(slider, index) {
			slider.slideTo(index);
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Section init: ShopTheLook
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ShopTheLook
	 */

	const action = () => {
		window.themeCore.ShopTheLookCarousel = window.themeCore.ShopTheLookCarousel || ShopTheLookCarousel();
		window.themeCore.utils.register(window.themeCore.ShopTheLookCarousel, "shop-the-look");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
