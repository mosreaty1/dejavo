(function () {
	'use strict';

	/**
	 * Component: Carousel
	 * ------------------------------------------------------------------------------
	 * An interface to create carousel objects using the Swiper plugin.
	 *
	 * @namespace carousel
	 */
	/**
	 * DOM selectors.
	 */
	const selectors$1 = {
		cell: '[data-js-carousel="cell"]',
		container: '[data-js-carousel="container"]',
		swiperCounter: ".swiper-counter",
		slide: ".swiper-slide"
	};

	/**
	 * Create a new carousel instance.
	 * @param {String} selector - DOM selector.
	 * @param {Object} config - Swiper carousel settings.
	 */
	var Carousel = (container, config) => {
		/**
		 * DOM node selectors.
		 */
		if (!container) {
			return;
		}

		const Swiper = window.themeCore.utils.Swiper;
		const extendDefaults = window.themeCore.utils.extendDefaults;
		const isElementInViewport = window.themeCore.utils.isElementInViewport;
		const on = window.themeCore.utils.on;
		const debounce = window.themeCore.utils.debounce;

		const nodeSelectors = {
			container,
			swiperCounter: container.querySelector(selectors$1.swiperCounter),
			slide: container.querySelectorAll(selectors$1.slide)
		};

		if (!nodeSelectors.container) {
			throw new Error(`Could not find carousel selector: ${container.id}`);
		}

		nodeSelectors.cells = [...nodeSelectors.container.querySelectorAll(config.swiper.cellSelector || selectors$1.cell)];

		/**
		 * Instance default settings.
		 */
		const namespace = nodeSelectors.container.id;

		const defaults = {
			aria: true,
			swiper: {
				a11y: {
					enabled: true
				},
				autoplay: false,
				centeredSlides: false,
				keyboard: {
					enabled: true,
					onlyInViewport: true
				},
				loop: true,
				on: {},
				slidesPerView: 1,
				spaceBetween: 16,
				watchSlidesVisibility: true
			}
		};

		/**
		 * Instance settings.
		 */
		const swiperSettings = extendDefaults(defaults.swiper, config.swiper);
		config.swiper = swiperSettings;
		const settings = extendDefaults(defaults, config);

		/**
		 * Instance globals.
		 */
		let carousel = {};
		const slideCount = `0${nodeSelectors.slide.length}`.slice(-2);

		/**
		 * Initialise carousel component.
		 */
		function init() {
			if (nodeSelectors.cells.length <= 1) {
				return;
			}

			carousel = new Swiper(nodeSelectors.container, {
				...settings.swiper,
				on: {
					init: () => {
						/**
						 * Offsetting event emitter to trigger.
						 */
						window.setTimeout(() => {
							window.themeCore.EventBus.emit(`Carousel-${namespace}:ready`, {
								container: nodeSelectors.container,
								selectedIndex: getSelectedIndex()
							});
						}, 0);

						/**
						 * Pagination counter that can be used injunction with normal pagination.
						 */
						if (nodeSelectors.swiperCounter) {
							nodeSelectors.swiperCounter.textContent = `01 / ${slideCount}`;
						}
					},
					transitionEnd: () => {
						window.themeCore.EventBus.emit(`Carousel-${namespace}:settle`, {
							container: nodeSelectors.container,
							selectedIndex: getSelectedIndex()
						});
					},
					slideChange: () => {
						/**
						 * Pagination counter updates when slide is changed.
						 */
						if (!nodeSelectors.swiperCounter) {
							return;
						}
						const activeSliderNumber = `0${carousel.realIndex + 1}`.slice(-2);
						nodeSelectors.swiperCounter.textContent = `${activeSliderNumber} / ${slideCount}`;
					}
				}
			});

			if (settings.aria) {
				setARIAEventListeners();
			}
		}

		/**
		 * Set listeners for Carousel and update accessibility markup.
		 */
		function setARIAEventListeners() {
			window.themeCore.EventBus.listen(`Carousel-${namespace}:ready`, (section) => {
				updateVisibleCells(section);
				on(
					"resize",
					debounce(() => updateVisibleCells(section), 500)
				);
			});

			window.themeCore.EventBus.listen(`Carousel-${namespace}:settle`, (section) => {
				updateVisibleCells(section);
			});
		}

		/**
		 * Sets tabindex to -1 to links from slides that are not active.
		 * @param {HTMLElement} section - Swiper slider.
		 */
		function updateVisibleCells(section) {
			const { container } = section;
			[...container.querySelectorAll(selectors$1.cell)].forEach((cell) => {
				if (!isElementInViewport(container, cell)) {
					updateCellARIA(cell, true, -1);
					return;
				}

				updateCellARIA(cell);
			});
		}

		/**
		 * Checks if slide is within Swiper viewport and updates the tabbable
		 * elements tabindex value.
		 * @param {HTMLElement} cell - Swiper slide.
		 * @param {Boolean} isHidden - If slide is not visible in viewport.
		 * @param {Number} tabindexValue - Tabindex value.
		 */
		function updateCellARIA(cell, isHidden = false, tabindexValue = 0) {
			const tabbableElements = cell.querySelectorAll("a, button");

			cell.setAttribute("aria-hidden", `${isHidden}`);

			if (tabbableElements.length) {
				[...tabbableElements].forEach((link) => {
					link.setAttribute("tabindex", tabindexValue);
				});
			}
		}

		/**
		 * Trigger update events.
		 */
		function update() {
			carousel.update();
		}

		/**
		 * Trigger resize events.
		 */
		function resize() {
			carousel.update();
		}

		/**
		 * Destroy instance.
		 */
		function destroy() {
			if (Object.keys(carousel).length === 0) {
				return;
			}

			carousel.destroy();
		}

		/**
		 * Updated selected slide using index.
		 * @param {Number} index - Image slide index to go to.
		 * @param {Number} speed - Optional speed parameter.
		 */
		function select(index, speed) {
			carousel.slideToLoop(Number(index), speed);
		}

		/**
		 * Get the selected index in carousel.
		 * @returns {Number}
		 */
		function getSelectedIndex() {
			return carousel.realIndex;
		}

		/**
		 * Get the Swiper instance of the carousel.
		 * @returns {Object}
		 */
		function getSwiperInstance() {
			return carousel;
		}

		/**
		 * Check if Swiper instance has been initialised.
		 */
		function isInitialised() {
			return Object.keys(carousel).length !== 0 && !carousel.destroyed;
		}

		/**
		 * MouseWheel control
		 * @returns {Object}
		 */
		function mouseWheelControl() {
			return {
				disable() {
					carousel.mousewheel.disable();
				},
				enable() {
					carousel.mousewheel.enable();
				},
				status: carousel.mousewheel.enabled
			};
		}

		/**
		 * Set carousel event
		 * @param event
		 * @param action
		 */
		function setEvent(event, action) {
			carousel.on(event, action);
		}

		/**
		 * Toggle allow touch move
		 */
		function toggleAllowTouchMove(state) {
			if (typeof state === "boolean") {
				carousel.allowTouchMove = state;
			} else {
				carousel.allowTouchMove = !carousel.params.allowTouchMove;
			}
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			destroy,
			getSelectedIndex,
			getSwiperInstance,
			init,
			isInitialised,
			resize,
			select,
			update,
			mouseWheelControl,
			setEvent,
			toggleAllowTouchMove
		});
	};

	/**
	 * Section: Our Team Slider
	 * ------------------------------------------------------------------------------
	 * @namespace OurTeamSlider
	 */

	const attributes = {
		isAlternate: "data-is-alternate"
	};

	const selectors = {
		section: ".js-our-team-section",
		container: ".js-cards-container"
	};

	var OurTeamSlider = () => {
		const section = document.querySelector(selectors.section);
		let isAlternate = false;

		if (section) {
			isAlternate = section.getAttribute(attributes.isAlternate);
		}

		const config = {
			swiper: {
				slidesPerView: isAlternate ? 1 : 1.18,
				loop: false,
				spaceBetween: isAlternate ? 20 : 0,
				cellSelector: ".js-person-card",
				centeredSlides: !isAlternate,
				pagination: {
					el: ".js-our-team-pagination",
					clickable: true,
					bulletElement: "button"
				},
				...(isAlternate && {
					breakpoints: {
						767: {
							slidesPerView: 2,
							spaceBetween: 20
						}
					}
				})
			}
		};

		function init() {
			const containers = [...document.querySelectorAll(selectors.container)];

			containers.forEach((container) => {
				Carousel(container, config).init();
			});
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Section: Our Team Slider Section
	 * ------------------------------------------------------------------------------
	 * @namespace OurTeamSliderSection
	 */

	const action = () => {
		window.themeCore.OurTeamSlider = window.themeCore.OurTeamSlider || OurTeamSlider();
		window.themeCore.utils.register(window.themeCore.OurTeamSlider, "our-team");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
