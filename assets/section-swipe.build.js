(function () {
	'use strict';

	var Swipe$1 = (section) => {
		const selectors = {
			swipeContent: ".js-swipe-content",
			swipeContentBlock: ".js-swipe-content-block",
			swipeImageBlocksContainer: ".js-swipe-image-blocks",
			swipeImageBlock: ".js-swipe-image-block",
			swipeImageBlockAlternate: ".js-swipe-image-block-alternate"
		};

		const classes = {
			active: "active"
		};

		let swipeSection = null;
		let swipeContent = null;
		let swipeImageBlocksContainer = null;
		let swipeContentBlocks = [];
		let swipeImageBlocks = [];
		let swipeImageBlocksAlternate = [];
		let swipeContentBlockActive = null;
		let swipeContentBlockPreviousActive = null;
		let swipeImageBlockActiveAlternate = null;
		let swipeImageBlockPreviousActiveAlternate = null;

		let swipeContentBlocksOffset = 40;

		let swipeContentBlockPosition = 0;
		let swipeContentBlockPreviousPosition = -1;

		let windowHeight = null;
		let swipeSectionBoundingRect = null;
		let swipeSectionTopPosition = null;
		let swipeSectionBottomPosition = null;
		let swipeContentHeight = null;
		let swipeImageBlocksContainerHeight = null;

		let scrollTop = null;

		function init() {
			swipeSection = section;

			if (!swipeSection) return;

			swipeContent = section.querySelector(selectors.swipeContent);
			swipeImageBlocksContainer = section.querySelector(selectors.swipeImageBlocksContainer);
			swipeContentBlocks = [...section.querySelectorAll(selectors.swipeContentBlock)];

			swipeImageBlocks = [...section.querySelectorAll(selectors.swipeImageBlock)];
			swipeImageBlocksAlternate = [...section.querySelectorAll(selectors.swipeImageBlockAlternate)];

			if (!swipeContent || !swipeContentBlocks.length || !swipeImageBlocks.length) return;

			initResizeListener();
		}

		function initResizeListener() {
			const mediaAfterExtraSmall = window.matchMedia("(min-width: 768px)");

			if (mediaAfterExtraSmall.matches) {
				updateSectionState();
				initScrollListener();
			}

			mediaAfterExtraSmall.addEventListener("change", (event) => {
				if (event.matches) {
					updateSectionState();
					initScrollListener();
				} else {
					destroyScrollListener();
				}
			});
		}

		function initScrollListener() {
			document.addEventListener("scroll", scrollHandler);
		}

		function destroyScrollListener() {
			document.removeEventListener("scroll", scrollHandler);
		}

		function scrollHandler() {
			updateSectionState();
		}

		function updateSectionState() {
			if (!swipeSection || !swipeContent || !swipeContentBlocks.length || !swipeImageBlocks.length) return;

			if (!isSwipeSectionInViewPort()) return;

			scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			swipeContentHeight = swipeContent.offsetHeight;
			swipeImageBlocksContainerHeight = swipeImageBlocksContainer.offsetHeight;

			if (swipeImageBlocksContainerHeight <= swipeContentHeight) {
				swipeContent.style.maxHeight = `${swipeImageBlocksContainerHeight}px`;
			} else {
				swipeContent.style.maxHeight = ``;
			}

			const halfContentHeight = swipeContentHeight / 2;

			let swipeContentBlockActiveIndex = 0;

			for (let i = 0; i < swipeImageBlocks.length; i++) {
				const swipeImageBlock = swipeImageBlocks[i];
				const swipeImageBlockTop = swipeImageBlock.offsetTop - swipeSection.offsetTop;

				if (swipeImageBlockTop < scrollTop - swipeSection.offsetTop + halfContentHeight) {
					swipeContentBlockActiveIndex = i;
				} else {
					break;
				}
			}

			swipeContentBlockPosition = swipeContentBlockActiveIndex;

			if (swipeContentBlockPosition < swipeContentBlockPreviousPosition) {
				changeSwipeContentBlockActive(true);
			} else if (swipeContentBlockPosition > swipeContentBlockPreviousPosition) {
				changeSwipeContentBlockActive(false);
			}

			swipeContentBlockPreviousPosition = swipeContentBlockPosition;
		}

		function isSwipeSectionInViewPort() {
			swipeSectionBoundingRect = swipeSection.getBoundingClientRect();
			swipeSectionTopPosition = swipeSectionBoundingRect.top;
			swipeSectionBottomPosition = swipeSectionBoundingRect.bottom;
			windowHeight = window.innerHeight;

			return swipeSectionTopPosition < windowHeight && swipeSectionBottomPosition > 0;
		}

		function changeSwipeContentBlockActive(isSwipeContentBlockChangeTopToBottom) {
			swipeContentBlockPreviousActive = swipeContentBlocks.find((swipeContentBlock) => swipeContentBlock.classList.contains(classes.active));
			swipeContentBlockActive = swipeContentBlocks[swipeContentBlockPosition];

			if (swipeImageBlocksAlternate.length) {
				swipeImageBlockPreviousActiveAlternate = swipeImageBlocksAlternate.find((swipeImageBlock) => swipeImageBlock.classList.contains(classes.active));
				swipeImageBlockActiveAlternate = swipeImageBlocksAlternate[swipeContentBlockPosition];
			}

			if (swipeContentBlockPreviousActive) {
				swipeContentBlockActive.style.transitionDuration = "0s";

				if (isSwipeContentBlockChangeTopToBottom) {
					let swipeContentBlockPreviousActiveOffset = swipeContentBlockPreviousActive.offsetHeight + swipeContentBlocksOffset;
					let swipeContentBlockPreviousActiveOffsetNegative = swipeContentBlockPreviousActiveOffset * -1;

					swipeContentBlockActive.style.transform = `translateY(${swipeContentBlockPreviousActiveOffsetNegative}px)`;
					swipeContentBlockPreviousActive.style.transform = `translateY(${swipeContentBlockPreviousActiveOffset}px)`;
				} else {
					let swipeContentBlockActiveOffset = swipeContentBlockActive.offsetHeight + swipeContentBlocksOffset;
					let swipeContentBlockActiveOffsetNegative = swipeContentBlockActiveOffset * -1;

					swipeContentBlockActive.style.transform = `translateY(${swipeContentBlockActiveOffset}px)`;
					swipeContentBlockPreviousActive.style.transform = `translateY(${swipeContentBlockActiveOffsetNegative}px)`;
				}

				swipeContentBlockPreviousActive.classList.remove(classes.active);
			}

			swipeImageBlockPreviousActiveAlternate && swipeImageBlockPreviousActiveAlternate.classList.remove(classes.active);

			setTimeout(() => {
				swipeContentBlockActive.style.transitionDuration = "";
				swipeContentBlockActive.style.transform = `translateY(0)`;
				swipeContentBlockActive.classList.add(classes.active);

				swipeImageBlockActiveAlternate && swipeImageBlockActiveAlternate.classList.add(classes.active);
			}, 0);
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		section: ".js-swipe"
	};

	var Swipe = () => {
		function init(sectionId) {
			const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
			sections.forEach((section) => Swipe$1(section).init());
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.Swipe = window.themeCore.Swipe || Swipe();
		window.themeCore.utils.register(window.themeCore.Swipe, "swipe");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
