(function () {
	'use strict';

	var Video = (videoContainer) => {
		let Video;
		const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
		const cssClasses = window.themeCore.utils.cssClasses;
		const mobileSize = window.matchMedia("(max-width: 767px)");

		const selectors = {
			iframe: "iframe",
			videoContainer: ".js-video-section",
			startButton: ".js-video-start-button",
			videoPlaceholder: ".js-video-placeholder",
			mobileVideoPlayer: "video__player--mobile"
		};

		const config = {
			videoContainer,
			options: {
				youtube: {
					autoplay: 0,
					controls: 1,
					showinfo: 0,
					rel: 0,
					playsinline: 1,
					loop: 0
				},
				vimeo: {
					controls: true,
					loop: false,
					muted: true,
					portrait: false,
					title: false,
					keyboard: false,
					byline: false,
					autopause: false
				}
			}
		};

		let videos;
		const startButton = videoContainer.querySelector(selectors.startButton);
		const videoPlaceholder = videoContainer.querySelector(selectors.videoPlaceholder);

		function initVideos(config) {
			return Video(config).init();
		}

		function playVideo(player, type) {
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

		function startVideo(video) {
			videoContainer.classList.add(cssClasses.active);
			startButton.classList.add("hide");
			videoPlaceholder.classList.add("hide");
			video.videoWrapper.classList.add(cssClasses.active);

			if (window.innerWidth >= 768 && video.device === "desktop") {
				playVideo(video.player, video.type);
			}

			if (window.innerWidth < 768 && video.device === "mobile") {
				playVideo(video.player, video.type);
			}
		}

		function setEventListeners(videoContainer, video) {
			videoContainer.addEventListener("click", (event) => {
				if (event.target.closest(selectors.startButton) || event.target.closest(selectors.videoPlaceholder)) {
					startVideo(video);
				}
			});

			mobileSize.addEventListener("change", () => {
				if (video.type === "html") {
					if (video.device === "mobile" && !mobileSize.matches) {
						video.player.pause();
					}

					if (video.device === "desktop" && mobileSize.matches) {
						video.player.pause();
					}
				}

				if (video.type === "vimeo") {
					if (video.device === "mobile" && !mobileSize.matches) {
						video.player.pause();
					}

					if (video.device === "desktop" && mobileSize.matches) {
						video.player.pause();
					}
				}

				if (video.type === "youtube") {
					if (video.device === "mobile" && !mobileSize.matches) {
						video.player.pauseVideo();
					}

					if (video.device === "desktop" && mobileSize.matches) {
						video.player.pauseVideo();
					}
				}
			});
		}

		async function init() {
			Video = await window.themeCore.utils.getExternalUtil("Video");
			videos = initVideos(config);

			if (videos && videos.length) {
				videos.forEach((video) => setEventListeners(videoContainer, video));
			}
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		section: ".js-video-section",
		videoContainer: ".js-video-container"
	};

	var VideoSectionPlayer = () => {
		let sections = [];
		let componentsList = {};

		function createComponents(Component, selector) {
			return sections
				.filter((section) => section.querySelector(selector))
				.map((section) => {
					const componentNode = section.querySelector(selector);
					return Component(componentNode);
				});
		}

		function init(sectionId) {
			sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));

			componentsList = {
				Video: createComponents(Video, selectors.videoContainer)
			};

			for (const list in componentsList) {
				componentsList[list].forEach((component) => component.init());
			}
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Section: Video Section
	 * ------------------------------------------------------------------------------
	 * @namespace VideoSection
	 */

	const action = () => {
		window.themeCore.VideoSectionPlayer = window.themeCore.VideoSectionPlayer || VideoSectionPlayer();
		window.themeCore.utils.register(window.themeCore.VideoSectionPlayer, "video");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
