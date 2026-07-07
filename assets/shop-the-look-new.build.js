(function () {
	'use strict';

	/**
	 * Section: Shop the look (new)
	 * ------------------------------------------------------------------------------
	 * @namespace ShopTheLookCarouselNew
	 */

	const selectors = {
		section: ".js-shop-the-look",
		productsSlider: ".js-shop-the-look-slider",
		productSlide: ".js-shop-the-look-slide",
		pointButton: ".js-shop-the-look-point",
		arrowsMobile: ".js-shop-the-look-arrows-mobile",
		arrowsDesktop: ".js-shop-the-look-arrows-desktop",
		sliderButtonNext: ".js-shop-the-look-slider-button-next",
		sliderButtonPrev: ".js-shop-the-look-slider-button-prev"
	};

	const attributes = {
		pointButtonIndex: "data-point-index"
	};

	var ShopTheLookCarouselNew = () => {
		const Swiper = window.themeCore.utils.Swiper;
		const on = window.themeCore.utils.on;
		const cssClasses = window.themeCore.utils.cssClasses;
		let sectionComponents = [];

		function init(sectionId) {
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			if (sections) {
				sections.forEach((section) => {
					sectionComponents.push({
						section,
						productSlide: [...section.querySelectorAll(selectors.productSlide)],
						productsSlider: section.querySelector(selectors.productsSlider),
						pointButtons: [...section.querySelectorAll(selectors.pointButton)],
						sliderButtonNext: section.querySelector(selectors.sliderButtonNext),
						sliderButtonPrev: section.querySelector(selectors.sliderButtonPrev),
						arrowsMobile: section.querySelector(selectors.arrowsMobile),
						arrowsDesktop: section.querySelector(selectors.arrowsDesktop)
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

			updateArrowPlacement();
			window.addEventListener("resize", updateArrowPlacement);
		}

		function updateArrowPlacement() {
			sectionComponents.forEach((section) => {
				const arrowsDesktop = section.arrowsDesktop;
				const arrowsMobile = section.arrowsMobile;

				if (!arrowsMobile) {
					return;
				}

				const arrows = arrowsDesktop.children.length !== 0 ? Array.from(arrowsDesktop.children) : Array.from(arrowsMobile.children);

				if (window.matchMedia("(max-width: 768px)").matches) {
					if (arrowsMobile.childNodes.length < 2) {
						arrowsMobile.append(...arrows);
					}
				} else {
					if (arrowsDesktop.childNodes.length < 2) {
						arrowsDesktop.append(...arrows);
					}
				}
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
			elements.forEach((element) => {
				element.classList.remove(cssClasses.active);

				element.tabIndex = "0";
			});
		}

		function setCurrentElementActive(element) {
			element.classList.add(cssClasses.active);

			element.tabIndex = "-1";
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
				spaceBetween: 12,
				navigation: {
					nextEl: buttonNext,
					prevEl: buttonPrev
				},
				breakpoints: {
					768: {
						slidesPerView: 1.46,
						slidesPerGroup: 1,
						spaceBetween: 40,
						navigation: {
							nextEl: buttonNext,
							prevEl: buttonPrev
						}
					},
					992: {
						slidesPerView: 1.46,
						slidesPerGroup: 1,
						spaceBetween: 60
					},
					1200: {
						slidesPerView: 1.46,
						slidesPerGroup: 1,
						spaceBetween: 90
					},
					1501: {
						slidesPerView: 1.46,
						slidesPerGroup: 1,
						spaceBetween: 120
					},
					1701: {
						slidesPerView: 1.46,
						slidesPerGroup: 1,
						spaceBetween: 175
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
	 * Section init: ShopTheLookNew
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ShopTheLookNew
	 */

	const action = () => {
		window.themeCore.ShopTheLookCarouselNew = window.themeCore.ShopTheLookCarouselNew || ShopTheLookCarouselNew();
		window.themeCore.utils.register(window.themeCore.ShopTheLookCarouselNew, "shop-the-look-new");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
