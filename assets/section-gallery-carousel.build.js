(function () {
	'use strict';

	var Slider = async (gallery) => {
		let autoplaySpeed = gallery.getAttribute("data-autoplay-speed");

		const Swiper = window.themeCore.utils.Swiper;
		const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
		const isStandardLayout = gallery.hasAttribute("data-layout-standard");
		const sectionId = gallery.closest(".js-gallery-carousel").id;

		Swiper.use([Autoplay]);

		function init() {
			const gallerySlider = new Swiper(gallery, {
				slidesPerView: "auto",
				centeredSlides: isStandardLayout,
				loop: isStandardLayout,
				autoplay: autoplaySpeed
					? {
							delay: autoplaySpeed,
							disableOnInteraction: true
					  }
					: false,
				pagination: {
					el: ".swiper-pagination",
					type: "bullets",
					clickable: true
				},
				navigation: {
					nextEl: `#${sectionId} .swiper-button-next`,
					prevEl: `#${sectionId} .swiper-button-prev`
				},
				breakpoints: {
					1200: {
						autoplay: autoplaySpeed
							? {
									delay: autoplaySpeed,
									disableOnInteraction: false,
									pauseOnMouseEnter: true
							  }
							: false
					}
				}
			});

			gallerySlider.update();
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		gallery: ".js-gallery-carousel-container"
	};

	var GalleryCarousel = () => {
		async function init(sectionId) {
			const galleries = [...document.querySelectorAll(selectors.gallery)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));

			galleries.forEach(async (gallery) => {
				const slider = await Slider(gallery);
				slider.init();
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.GalleryCarousel = window.themeCore.GalleryCarousel || GalleryCarousel();
		window.themeCore.utils.register(window.themeCore.GalleryCarousel, "gallery-carousel");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
