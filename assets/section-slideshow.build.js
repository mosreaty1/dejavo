(function () {
	'use strict';

	const selectors$1 = {
		iframe: "iframe"
	};

	async function initVideos(config) {
		const Video = await window.themeCore.utils.getExternalUtil("Video");

		return Video(config).init();
	}

	function vimeoDisableTabIndexHandler(videos) {
		const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;

		videos.filter((video) => video.type === VIDEO_TYPES.vimeo).forEach((video) => video.player.on("loaded", () => disableTabIndex(video.videoWrapper)));
	}

	function disableTabIndex(videoElement) {
		const iframe = videoElement.querySelector(selectors$1.iframe);

		if (!iframe) {
			return;
		}

		iframe.setAttribute("tabindex", "-1");
	}

	function playVideo(player, type) {
		const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;

		switch (type) {
			case VIDEO_TYPES.html: {
				player.play();
				break;
			}

			case VIDEO_TYPES.vimeo: {
				player.play();
				break;
			}

			case VIDEO_TYPES.youtube: {
				player.mute();
				player.playVideo();
				break;
			}

			default:
				return;
		}
	}

	function pauseVideo(player, type) {
		const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;

		switch (type) {
			case VIDEO_TYPES.html: {
				player.pause();
				break;
			}

			case VIDEO_TYPES.vimeo: {
				player.pause();
				break;
			}

			case VIDEO_TYPES.youtube: {
				player.pauseVideo();
				break;
			}

			default:
				return;
		}
	}

	var Video = (videoContainer) => {
		const config = {
			videoContainer,
			options: {
				youtube: {
					autoplay: 0,
					controls: 0,
					showinfo: 0,
					rel: 0,
					playsinline: 1,
					loop: 1
				},
				vimeo: {
					controls: false,
					loop: true,
					muted: true,
					portrait: false,
					title: false,
					keyboard: false,
					byline: false,
					autopause: false
				}
			}
		};

		async function init() {
			const videos = await initVideos(config);

			if (videos && videos.length) {
				vimeoDisableTabIndexHandler(videos);
				return videos;
			}
		}

		return Object.freeze({
			init,
			playVideo,
			pauseVideo
		});
	};

	var Slider = async (section) => {
		const Swiper = window.themeCore.utils.Swiper;
		const A11y = window.themeCore.utils.swiperA11y;
		const Pagination = window.themeCore.utils.swiperPagination;
		const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
		const Parallax = await window.themeCore.utils.getExternalUtil("swiperParallax");
		const EffectFade = await window.themeCore.utils.getExternalUtil("swiperEffectFade");
		const EffectFlip = await window.themeCore.utils.getExternalUtil("swiperEffectFlip");
		const EffectCreative = await window.themeCore.utils.getExternalUtil("swiperEffectCreative");
		const cssClasses = window.themeCore.utils.cssClasses;

		Swiper.use([Pagination, Autoplay, Parallax, EffectFade, EffectFlip, EffectCreative, A11y]);

		const selectors = {
			slider: ".js-slider",
			slide: ".swiper-slide",
			activeSlide: ".swiper-slide-active",
			sliderSettings: ".js-slider-settings",
			progressbar: ".js-progressbar",
			progressbarFirstLabel: ".js-progress-first-label",
			video: ".js-video",
			videoPosterDesktop: ".js-video-poster-desktop",
			videoPosterMobile: ".js-video-poster-mobile",
			playButton: ".js-video-button-play",
			pauseButton: ".js-video-button-pause",
			showButtons: "[data-show-button=true]",
			currentVideo: ".swiper-slide.swiper-slide-active .js-video, .js-slider:not(.swiper) .js-video",
			button: ".js-button",
			iframe: "iframe",
			currentVimeoVideo: ".swiper-slide.swiper-slide-active .js-video.js-video-vimeo, .js-slider:not(.swiper) .js-video.js-video-vimeo"
		};

		const classes = {
			active: "is-active",
			swiperSlideActive: "swiper-slide-active"
		};

		const mediaSmall = window.matchMedia("(max-width: 767px)");
		const slider = section.querySelector(selectors.slider);
		const sliderSettingsDOM = section.querySelector(selectors.sliderSettings);
		const pauseButton = section.querySelector(selectors.pauseButton);
		const playButton = section.querySelector(selectors.playButton);
		const playVideo = await Video(section).playVideo;
		const pauseVideo = await Video(section).pauseVideo;
		let timeoutId, swiperSlider, sliderSettings;
		let slides;
		let isAlternateDesign;

		if (slider) {
			slides = [...slider.querySelectorAll(selectors.slide)];
		}

		async function initSwiper() {
			sliderSettings = getSettings();

			if (!sliderSettings) {
				return;
			}

			swiperSlider = new Swiper(slider, {
				...sliderSettings,
				autoplay: false
			});
			const progressbar = section.querySelector(selectors.progressbar);
			const progressbarFirstLabel = section.querySelector(selectors.progressbarFirstLabel);

			let progressbarAnimation =
				progressbar &&
				progressbar.animate([{ width: "0%" }, { width: "100%" }], {
					fill: "forwards",
					easing: "linear",
					duration: sliderSettings.autoplay.delay + sliderSettings.speed
				});

			const activeSlide = section.querySelector(selectors.activeSlide);

			if (activeSlide) {
				disableTabulationOnNotActiveSlides(activeSlide);
			}

			let videos = await Video(section).init();

			if (videos && videos.length) {
				mediaSmall.addEventListener("change", () => {
					initVideos(videos);
				});

				initVideos(videos);

				section.addEventListener("click", (event) => clickHandler(event, videos));

				swiperSlider.on("slidesLengthChange", async function () {
					videos = await Video(section).init();
				});

				window.addEventListener("resize", handleCurrentVimeoVideo);
			}

			swiperSlider.on("slideChange", function (swiper) {
				window.themeCore.LazyLoadImages.init();

				const activeSlide = section.querySelector(`${selectors.slide}:nth-child(${swiper.activeIndex + 1}`);
				disableTabulationOnNotActiveSlides(activeSlide);

				if (!videos || !videos.length) {
					return;
				}

				const currentVideo = [...section.querySelectorAll(`${selectors.slide}:nth-child(${swiper.activeIndex + 1}) ${selectors.video}`)].filter(
					(video) => getComputedStyle(video).getPropertyValue("display") !== "none"
				);

				const showButtons = !!section.querySelector(`${selectors.slide}:nth-child(${swiper.activeIndex + 1}) ${selectors.showButtons}`);

				handleVideoButtons(showButtons, currentVideo);
				handleVideos(videos, currentVideo);

				if (currentVideo && currentVideo.length) {
					currentVideo.forEach((curVideo) => {
						if (!curVideo.dataset.vimeoInitialized) {
							return;
						}

						const iframe = curVideo.querySelector(selectors.iframe);
						iframe && handleVimeoSize(iframe);
					});
				}

				const slides = swiper.slides;
				const activeIndex = swiper.activeIndex;
				swiper.el.dataset.currentSlideType = slides[activeIndex].dataset.type;
			});

			if (sliderSettings && sliderSettings.autoplay && sliderSettings.autoplay.delay) {
				autoplayIteration();
				if (progressbarAnimation) {
					progressbarAnimation.play();
				}

				swiperSlider.on("slideChangeTransitionEnd", () => {
					autoplayIteration();

					if (!progressbarAnimation) {
						return;
					}

					progressbarAnimation.currentTime = 0;
					progressbarAnimation.play();
				});
			}

			if (progressbarFirstLabel) {
				if ((!isAlternateDesign && progressbar) || (isAlternateDesign && (swiperSlider.navigation.nextEl || swiperSlider.navigation.prevEl))) {
					swiperSlider.on("realIndexChange", (swiper) => {
						progressbarFirstLabel.innerText = addZeroPrefix(swiper.realIndex + 1);
					});
				}
			}
		}

		function getSettings() {
			try {
				return JSON.parse(sliderSettingsDOM.textContent);
			} catch {
				return null;
			}
		}

		function init() {
			isAlternateDesign = document.body.classList.contains(cssClasses.designAlternate);

			if (slider && sliderSettingsDOM) {
				setIntersectionObserver(initSwiper);
				return;
			} else if (slides && slides.length === 1) {
				slides[0].classList.add(classes.swiperSlideActive);
			}

			setIntersectionObserver(initSingleVideo);
		}

		function addZeroPrefix(number) {
			if (number > 9) {
				return number;
			}

			return "0" + number;
		}

		function handleVideos(videos, currentVideo, initiatorClick) {
			const posterSelector = mediaSmall.matches ? selectors.videoPosterMobile : selectors.videoPosterDesktop;

			if (!videos) {
				return;
			}

			videos.forEach((video) => {
				let isCurrentVideo = currentVideo.some((videoItem) => video.videoWrapper === videoItem && (JSON.parse(videoItem.dataset.autoplay) || initiatorClick));

				if (currentVideo && currentVideo.length && isCurrentVideo) {
					currentVideo.forEach((curVideo) => {
						if (video.videoWrapper === curVideo && (JSON.parse(curVideo.dataset.autoplay) || initiatorClick)) {
							const poster = curVideo.closest(selectors.slide).querySelector(posterSelector);

							playVideo(video.player, video.type);

							if (poster) {
								setTimeout(() => poster.remove(), 200);
							}
						}
					});
					return;
				}

				pauseVideo(video.player, video.type);
			});
		}

		function playCurrentVideo(videos, initiatorClick) {
			/*const currentVideo = [
				...section.querySelectorAll(selectors.currentVideo)
			].find(
				(video) =>
					getComputedStyle(video).getPropertyValue("display") !== "none"
			);*/

			const currentVideo = [...section.querySelectorAll(selectors.currentVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");

			handleVideos(videos, currentVideo, initiatorClick);
		}

		function pauseVideos(videos) {
			videos.forEach((videoObj) => {
				pauseVideo(videoObj.player, videoObj.type);
			});
		}

		async function initSingleVideo() {
			let videos = await Video(section).init();

			const showButtons = !!section.querySelector(`${selectors.showButtons}`);

			const currentVideo = [...section.querySelectorAll(`${selectors.video}`)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");

			handleVideoButtons(showButtons, currentVideo);

			section.addEventListener("click", (event) => clickHandler(event, videos));
			playCurrentVideo(videos);
			window.addEventListener("resize", handleCurrentVimeoVideo);

			mediaSmall.addEventListener("change", () => {
				playCurrentVideo(videos);
				handleVideoButtons(showButtons, currentVideo);
			});
		}

		function handleVideoButtons(show, currentVideo) {
			currentVideo = currentVideo || [...section.querySelectorAll(selectors.currentVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");

			if (currentVideo && currentVideo.length && !JSON.parse(currentVideo[0].dataset.autoplay)) {
				pauseButton.classList.remove(classes.active);

				if (show) {
					playButton.classList.add(classes.active);
					return;
				}

				playButton.classList.remove(classes.active);
				return;
			}

			playButton.classList.remove(classes.active);

			if (show) {
				pauseButton.classList.add(classes.active);
				return;
			}

			pauseButton.classList.remove(classes.active);
		}

		function clickHandler(event, videos) {
			const pauseButtonCurrent = event.target.closest(selectors.pauseButton);

			if (pauseButtonCurrent) {
				pauseButton.classList.remove(classes.active);
				playButton.classList.add(classes.active);
				pauseVideos(videos);
				return;
			}

			const playButtonCurrent = event.target.closest(selectors.playButton);

			if (playButtonCurrent) {
				pauseButton.classList.add(classes.active);
				playButton.classList.remove(classes.active);
				playCurrentVideo(videos, true);
			}
		}

		function initVideos(videos) {
			const showButtons = !!section.querySelector(`${selectors.slide}${selectors.activeSlide} ${selectors.showButtons}`);

			handleVideoButtons(showButtons);

			playCurrentVideo(videos);
		}

		function disableTabulationOnNotActiveSlides(activeSlide) {
			const slides = [...section.querySelectorAll(selectors.slide)];

			slides.forEach((slide) => {
				const buttons = slide.querySelectorAll(selectors.button);

				if (!buttons.length) {
					return;
				}

				if (slide === activeSlide) {
					buttons.forEach((button) => button.setAttribute("tabindex", 0));
					return;
				}

				buttons.forEach((button) => button.setAttribute("tabindex", -1));
			});
		}

		function setIntersectionObserver(handler) {
			const observer = new IntersectionObserver(
				(entries, observer) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							handler();
							observer.unobserve(section);
						}
					});
				},
				{ threshold: 0.3 }
			);

			observer.observe(section);
			initFirstVimeoAppearance();
		}

		function handleVimeoSize(iframe) {
			if (!iframe) {
				return;
			}

			setTimeout(() => {
				const initialIframeWidth = iframe.width;
				const initialIframeHeight = iframe.height;

				const iframeContainer = iframe.parentElement;

				const aspectRatio = initialIframeWidth && initialIframeHeight ? initialIframeWidth / initialIframeHeight : 16 / 9;

				const containerWidth = iframeContainer.offsetWidth;
				const containerHeight = iframeContainer.offsetHeight;

				let iframeWidth, iframeHeight, scaleValue;

				if (containerWidth / aspectRatio < containerHeight) {
					iframeHeight = containerWidth / aspectRatio;
					scaleValue = containerHeight / iframeHeight;
				} else {
					iframeWidth = containerHeight * aspectRatio;
					scaleValue = containerWidth / iframeWidth;
				}

				iframe.style.setProperty("--scale", scaleValue);
			}, 1);
		}

		function handleCurrentVimeoVideo() {
			const currentVimeoVideos = [...section.querySelectorAll(selectors.currentVimeoVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
			if (!currentVimeoVideos.length) return;

			currentVimeoVideos.forEach((currentVimeoVideo) => {
				const currentVimeoVideoIframe = currentVimeoVideo.querySelector(selectors.iframe);
				currentVimeoVideoIframe && handleVimeoSize(currentVimeoVideoIframe);
			});
		}

		function initFirstVimeoAppearance() {
			const observer = new MutationObserver((entries) => {
				entries.forEach((mutation) => {
					if (mutation.target.dataset.vimeoInitialized) {
						handleCurrentVimeoVideo();
					}
				});
			});

			observer.observe(section, {
				attributes: true,
				childList: true,
				subtree: true
			});
		}

		function autoplayIteration() {
			clearTimeout(timeoutId);

			timeoutId = setTimeout(() => {
				swiperSlider.slideNext(sliderSettings.speed);
			}, sliderSettings.autoplay.delay);
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		section: ".js-slideshow",
		videoContainer: ".js-videos"
	};

	var Slideshow = () => {
		async function init(sectionId) {
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			sections.forEach(async (section) => {
				const slider = await Slider(section);
				slider.init();
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.Slideshow = window.themeCore.Slideshow || Slideshow();
		window.themeCore.utils.register(window.themeCore.Slideshow, "slideshow");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
