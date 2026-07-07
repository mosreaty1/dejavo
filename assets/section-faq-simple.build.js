(function () {
	'use strict';

	var FaqTemplate = () => {
		const cssClasses = window.themeCore.utils.cssClasses;
		const on = window.themeCore.utils.on;
		const throttle = window.themeCore.utils.throttle;
		const debounce = window.themeCore.utils.debounce;

		let sections = [];

		const selectors = {
			anchorWrapper: ".js-faq-anchor-wrapper",
			anchor: ".js-faq-anchor-link",
			anchorActive: ".js-faq-anchor-link.is-active",
			anchorsListContainer: ".js-side-navigation-container",
			anchorsList: ".js-side-navigation-list",
			section: '[data-section-type="faq-template"]',
			block: ".js-faq-block",
			blockFirst: ".js-faq-block:first-of-type",
			cssRoot: ":root",
			header: ".js-header",
			headerSticky: "[data-header-sticky]"
		};

		const attributes = {
			url: "href",
			dataHideOnScrollDown: "data-hide-on-scroll-down"
		};

		const breakpoints = {
			extraSmall: 767
		};

		const cssVariables = {
			anchorsListOffsetTop: "--sticky-sidebar-offset-top",
			headerHeight: "--header-height",
			headerOffset: "--header-offset-top"
		};

		const DEFAULT_STICKY_OFFSET = "1px";
		const DEFAULT_HEADER_OFFSET = "0px";
		const THROTTLE_DURATION = 25;
		const MINIMAL_SCROLL_OFFSET = 20;
		let SIDEBAR_OFFSET_TOP;
		let header;
		let IS_HEADER_STICKY;
		let IS_HEADER_HIDE_ON_SCROLL_DOWN;

		let cssRoot = null;
		let headerHeight = DEFAULT_STICKY_OFFSET;
		let headerOffsetTop = DEFAULT_HEADER_OFFSET;

		function init(sectionId) {
			SIDEBAR_OFFSET_TOP = parseInt(getComputedStyle(document.documentElement).getPropertyValue(cssVariables.anchorsListOffsetTop));

			header = document.querySelector(selectors.header);
			header && (IS_HEADER_STICKY = !!header.querySelector(selectors.headerSticky));
			header && (IS_HEADER_HIDE_ON_SCROLL_DOWN = header.hasAttribute(attributes.dataHideOnScrollDown));

			sections = [...document.querySelectorAll(selectors.section)]
				.filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`))
				.map((element) => {
					const blocks = element.querySelectorAll(selectors.block);
					const anchors = element.querySelectorAll(selectors.anchor);
					const navbar = element.querySelector(selectors.anchorsListContainer);
					const list = element.querySelector(selectors.anchorsList);

					return {
						el: element,
						blocks: blocks,
						anchors: anchors,
						navbar: navbar,
						list: list
					};
				});

			updateCssVariables();

			if (sections && sections.length) {
				sections.forEach((section) => {
					on("resize", window, updateCssVariables);
					on("click", section.el, anchorHandler);
					on(
						"scroll",
						throttle(() => {
							scrollHandler(section);
							updateCssVariables();
						}, THROTTLE_DURATION)
					);

					observeStickyNavigation(section.navbar);
				});
			}
		}

		function updateCssVariables() {
			cssRoot = document.querySelector(selectors.cssRoot);
			headerOffsetTop = cssRoot.style.getPropertyValue(cssVariables.headerOffset);

			if (headerOffsetTop.trim() === DEFAULT_HEADER_OFFSET) {
				headerHeight = cssRoot.style.getPropertyValue(cssVariables.headerHeight).trim();
			}

			if (!headerHeight) {
				headerHeight = DEFAULT_STICKY_OFFSET;
			}
		}

		function anchorHandler(event) {
			const target = event.target.closest(selectors.anchor);
			const section = event.target.closest(selectors.section);
			if (!target || !section) {
				return;
			}

			const blockId = target.getAttribute(attributes.url);
			if (!blockId) {
				return;
			}

			const block = section.querySelector(blockId);
			let offset = MINIMAL_SCROLL_OFFSET;

			if (block.closest(selectors.blockFirst)) {
				offset += MINIMAL_SCROLL_OFFSET * 2;
			}

			if ((IS_HEADER_STICKY && !IS_HEADER_HIDE_ON_SCROLL_DOWN) || (IS_HEADER_HIDE_ON_SCROLL_DOWN && window.scrollY > getElementY(block))) {
				offset += header.getBoundingClientRect().height;
			}

			preventEvent(event);

			scrollToTarget(block, offset);

			const activeAnchors = section.querySelectorAll(selectors.anchorActive);

			activeAnchors.forEach((anchor) => anchor.classList.remove(cssClasses.active));
		}

		function scrollHandler(section) {
			const { anchors, blocks, navbar, list } = section;

			if (!anchors || !blocks || !navbar) {
				return;
			}

			let offset = window.pageYOffset;
			const isExtraSmall = window.innerWidth <= breakpoints.extraSmall;

			if (isExtraSmall && navbar) {
				offset += navbar.offsetHeight;
			} else {
				offset += SIDEBAR_OFFSET_TOP + MINIMAL_SCROLL_OFFSET;
			}

			if ((IS_HEADER_STICKY && !IS_HEADER_HIDE_ON_SCROLL_DOWN) || (IS_HEADER_HIDE_ON_SCROLL_DOWN && header.getBoundingClientRect().y >= 0)) {
				offset += header.getBoundingClientRect().height;
			}

			let closestElement = [...blocks]
				.map((element) => ({
					el: element,
					diff: Math.round(offset - element.offsetTop)
				}))
				.filter((element) => element.diff >= 0)
				.sort((a, b) => a.diff - b.diff);

			if (closestElement[0]) {
				closestElement = closestElement[0].el;
			}

			let newActive = Array.from(anchors).find((link) => link.getAttribute(attributes.url) === `#${closestElement.id}`);

			if (!newActive || newActive.classList.contains(cssClasses.active)) {
				return null;
			}

			anchors.forEach((link) => {
				link.classList.remove(cssClasses.active);
			});

			newActive.classList.add(cssClasses.active);

			if (!list) {
				return;
			}

			const newActiveParent = newActive.closest(selectors.anchorWrapper);
			const newActiveOffset = newActiveParent.offsetLeft;

			list.scrollTo({
				left: newActiveOffset,
				behavior: "smooth"
			});
		}

		function preventEvent(event) {
			if (!event) {
				return false;
			}

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		}

		function getElementY(target) {
			return window.pageYOffset + target.getBoundingClientRect().top;
		}

		function scrollToTarget(target, offset = 0) {
			const elementY = getElementY(target);

			const targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight - MINIMAL_SCROLL_OFFSET : elementY - offset;

			window.scrollTo({
				top: targetY,
				behavior: "smooth"
			});
		}

		function observeStickyNavigation(target) {
			const handleStickyClass = () => {
				const observer = new IntersectionObserver(
					([e]) => {
						e.target.classList.toggle(cssClasses.sticky, e.intersectionRatio < 1);
					},
					{
						rootMargin: `-${headerHeight} 0px 0px 0px`
					}
				);

				observer.observe(target);
			};

			const debouncedObserver = debounce(
				() => {
					handleStickyClass();
				},
				0,
				false
			);

			on("scroll", debouncedObserver);
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.FaqTemplate = window.themeCore.FaqTemplate || FaqTemplate();

		window.themeCore.utils.register(window.themeCore.FaqTemplate, "faq-simple");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
