(function () {
	'use strict';

	var FeaturedContentSlider = (section, sliderSettings) => {
		const Swiper = window.themeCore.utils.Swiper;

		const handleTabulationOnSlides = window.themeCore.utils.handleTabulationOnSlides;
		const parseJSONfromMarkup = window.themeCore.utils.parseJSONfromMarkup;
		const updateTabindexOnElement = window.themeCore.utils.updateTabindexOnElement;

		const selectors = {
			slider: ".js-featured-content-slider",
			sliderSettings: ".js-slider-settings",
			sliderPagination: ".js-featured-content-slider-pagination",
			slide: ".swiper-slide",
			activeSlide: ".swiper-slide-active",
			scrollableWrapper: ".js-featured-content-scrollable-wrapper",
			tabulableElements: "a, button, input, select"
		};

		const breakpoints = {
			extraSmall: "(max-width: 767px)"
		};

		const sliderContainer = section.matches(selectors.slider) ? section : section.querySelector(selectors.slider);
		const slides = [...section.querySelectorAll(selectors.slide)];
		const scrollableWrapper = section.querySelector(selectors.scrollableWrapper);
		const extraSmallScreen = window.matchMedia(breakpoints.extraSmall);
		const accessibilitySettingsNode = section.querySelector(selectors.sliderSettings);
		const accessibilitySettings = parseJSONfromMarkup(accessibilitySettingsNode);

		let Slider = null;

		if (extraSmallScreen.matches) {
			Slider = initSwiper();
		}

		function initSwiper() {
			if (!sliderContainer) {
				return null;
			}

			const slider = new Swiper(sliderContainer, {
				...sliderSettings,
				...accessibilitySettings,
				pagination: {
					el: selectors.sliderPagination,
					clickable: true,
					bulletElement: "button"
				},
				watchSlidesProgress: true
			});

			const activeSlide = sliderContainer.querySelector(selectors.activeSlide);
			handleTabulationOnSlides(slides, activeSlide, selectors.tabulableElements);

			slider.on("slideChange", (swiper) => {
				const activeSlide = section.querySelector(`${selectors.slide}:nth-child(${swiper.activeIndex + 1}`);
				handleTabulationOnSlides(slides, activeSlide, selectors.tabulableElements);
			});

			return slider;
		}

		function setBreakpointListener(breakpoint) {
			if (!breakpoint.media) {
				return;
			}

			breakpoint.addEventListener("change", changeSliderStateOnBreakpoint);
		}

		function changeSliderStateOnBreakpoint(media) {
			if (media.matches) {
				if (scrollableWrapper) {
					scrollableWrapper.scrollTo({ left: 0, behavior: "smooth" });
				}

				Slider = initSwiper();
				return;
			}

			Slider && Slider.destroy();
			updateTabindexOnElement(section, 0);
			slides.forEach((slide) => slide.setAttribute("aria-hidden", false));
		}

		function init() {
			setBreakpointListener(extraSmallScreen);
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.utils.registerExternalUtil(FeaturedContentSlider, "FeaturedContentSlider");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
