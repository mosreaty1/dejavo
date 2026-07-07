(function () {
	'use strict';

	const selectors = {
		sections: ".js-story-telling",
		tabsWrapper: ".js-story-telling-tabs",
		tabButton: ".js-story-telling-tab-button",
		slides: ".js-story-telling-slide"
	};

	const attributes = {
		index: "data-index"
	};

	const classes = {
		sectionImageLeft: "story-telling--image-left",
		itemImageLeft: "story-telling__item--image-left",
		activeButton: "story-telling__tab-button--active",
		activeContent: "story-telling__item--visible"
	};

	var StoryTelling = () => {
		function init(sectionId) {
			const sections = [...document.querySelectorAll(selectors.sections)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));

			sections.forEach(async (section) => {
				const tabsWrappers = [...section.querySelectorAll(selectors.tabsWrapper)];
				const slides = [...section.querySelectorAll(selectors.slides)];
				const tabButtons = [...section.querySelectorAll(selectors.tabButton)];

				tabsWrappers.forEach((tabsWrapper) => {
					tabsWrapper.addEventListener("click", (event) => {
						if (!event.target.closest(selectors.tabButton) || event.target.classList.contains(classes.activeButton)) {
							return;
						}

						const { newDesign } = tabsWrapper.dataset;
						const isHorizontalScroll = tabsWrapper.scrollWidth > tabsWrapper.clientWidth;
						const activeSlide = slides.find((slide) => slide.getAttribute(attributes.index) === event.target.dataset.index);
						const currentTabButtons = tabsWrappers.map((tabsWrapper) => {
							return [...tabsWrapper.querySelectorAll(selectors.tabButton)].find((tabButton) => event.target.dataset.index === tabButton.dataset.index);
						});
						const newActiveOffset = event.target.offsetLeft;
						const tabButtonHalfWidth = event.target.offsetWidth / 2;

						tabButtons.forEach((tab) => {
							toggleClass(tab, false, classes.activeButton);
						});

						const smoothScrollAndExecute = (tabsWrapper, offset, callback) => {
							const scrollDuration = 300;
							let scrollCompleted = false;

							const onScroll = () => {
								if (Math.abs(tabsWrapper.scrollLeft - offset) < 1) {
									scrollCompleted = true;
									tabsWrapper.removeEventListener("scroll", onScroll);
									callback();
								}
							};

							tabsWrapper.addEventListener("scroll", onScroll);

							tabsWrapper.scrollTo({
								left: offset,
								behavior: "smooth"
							});

							setTimeout(() => {
								if (!scrollCompleted) {
									tabsWrapper.removeEventListener("scroll", onScroll);
									callback();
								}
							}, scrollDuration + 50);
						};

						const handleTabActions = () => {
							newDesign === "true" &&
								tabsWrappers.forEach((tab) => {
									tab.scrollLeft = newActiveOffset - tabButtonHalfWidth;
								});

							slides.forEach((slide) => {
								toggleClass(slide, false, classes.activeContent);
							});

							currentTabButtons.forEach((currentTabButton) => {
								toggleClass(currentTabButton, true, classes.activeButton);
							});

							activeSlide && toggleClass(activeSlide, true, classes.activeContent);
							activeSlide && activeSlide.classList.contains(classes.itemImageLeft)
								? toggleClass(section, true, classes.sectionImageLeft)
								: toggleClass(section, false, classes.sectionImageLeft);
						};

						if (newDesign === "true" && isHorizontalScroll) {
							smoothScrollAndExecute(tabsWrapper, newActiveOffset - tabButtonHalfWidth, handleTabActions);
						} else {
							handleTabActions();
							tabsWrapper.scrollTo({
								left: newActiveOffset - tabButtonHalfWidth,
								behavior: "smooth"
							});
						}
					});
				});
			});
		}

		function toggleClass(selector, flag, className) {
			selector.classList.toggle(className, flag);
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.StoryTelling = window.themeCore.StoryTelling || StoryTelling();
		window.themeCore.utils.register(window.themeCore.StoryTelling, "story-telling");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
