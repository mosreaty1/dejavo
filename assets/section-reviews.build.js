(function () {
	'use strict';

	const attributes = {
		autoplaySpeed: "data-autoplay-speed",
		themeDesign: "data-design"
	};

	var Slider = async (reviewsContainer) => {
		let autoplaySpeed = reviewsContainer.getAttribute(attributes.autoplaySpeed);
		const isAlternate = reviewsContainer.getAttribute(attributes.themeDesign) === "alternate";

		const Swiper = window.themeCore.utils.Swiper;
		const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
		Swiper.use([Autoplay]);

		function init() {
			const reviewsSlider = new Swiper(reviewsContainer, {
				slidesPerView: 1,
				spaceBetween: isAlternate ? 30 : 0,
				centeredSlides: true,
				loop: true,
				autoplay: autoplaySpeed
					? {
							delay: autoplaySpeed
					  }
					: false,
				pagination: {
					el: ".swiper-pagination",
					type: "bullets",
					clickable: true
				},
				breakpoints: {
					768: {
						slidesPerView: isAlternate ? 2.25 : 2
					}
				}
			});

			reviewsSlider.update();
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		reviews: ".js-reviews-container"
	};

	var Reviews = () => {
		async function init(sectionId) {
			const reviewsContainers = [...document.querySelectorAll(selectors.reviews)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			reviewsContainers.forEach(async (reviewsContainer) => {
				const slider = await Slider(reviewsContainer);
				slider.init();
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.Reviews = window.themeCore.Reviews || Reviews();
		window.themeCore.utils.register(window.themeCore.Reviews, "reviews");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
