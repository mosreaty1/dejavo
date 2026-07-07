(function () {
	'use strict';

	/**
	 * Helper: Event bus
	 * -----------------------------------------------------------------------------
	 * A global event dispatcher used to communicate between components.
	 *
	 * @namespace eventBus
	 */
	var EventBus = () => {
		/**
		 * Create a new EventBus instance and emits.
		 */
		let eventBus = {};
		let emits = [];

		/**
		 * Listen for the given event.
		 * @param {String|Array} events - Event string. eg: Namespace:state.
		 * @param {Function} handler - Callback function to execute when event is fired.
		 */
		function listen(events, handler) {
			[...[].concat(events)].forEach((event) => {
				eventBus[event] = (eventBus[event] || []).concat(handler);
			});

			return this;
		}

		/**
		 * Remove the given event.
		 * @param {String} events - Event string. eg: Namespace:state.
		 * @param {Function} extraHandler - Callback function to execute when event is fired.
		 */
		function remove(event, extraHandler) {
			eventBus[event] = [...eventBus[event]].filter((handler) => handler !== extraHandler);

			return this;
		}

		/**
		 * Trigger all handlers for the given event.
		 * @param {String} event - Event string. eg: `Namespace:state`.
		 * @param {*} data - Payload to send to listeners.
		 */
		function emit(event, data) {
			if (!emits.includes(event)) {
				emits.push(event);
			}

			if (!eventBus[event]) {
				return false;
			}

			return [...eventBus[event]].forEach((handler) => handler(data));
		}

		/**
		 * Fetch all registered event listeners.
		 */
		function all() {
			return eventBus;
		}

		/**
		 * Clear all registered event listeners.
		 */
		function clear() {
			eventBus = {};
			emits = [];
		}

		/**
		 * Fetch all registered emits.
		 */
		function events() {
			return emits;
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			listen,
			emit,
			all,
			events,
			remove,
			clear
		});
	};

	var LazyLoadImages = () => {
		/**
		 * Initialise component.
		 */

		function init() {
			/**
			 * DOM node selectors.
			 */

			let lazyImages = [...document.querySelectorAll(".lazy img[data-srcset]")];

			if (lazyImages.length < 1) {
				return;
			}

			if ("IntersectionObserver" in window) {
				let lazyImageObserver = new IntersectionObserver(
					function (entries) {
						entries.forEach(function (entry) {
							if (entry.isIntersecting) {
								let lazyImage = entry.target;
								const targets = [...lazyImage.parentElement.querySelectorAll("[data-srcset]")];
								targets.forEach((lazyImage) => {
									lazyImage.srcset = lazyImage.dataset.srcset;

									if (lazyImage.dataset.src) {
										lazyImage.addEventListener("load", () => {
											lazyImage.parentElement.classList.remove("lazy");
										});
										lazyImage.src = lazyImage.dataset.src;
									}

									lazyImageObserver.unobserve(lazyImage);
								});
							}
						});
					},
					{ rootMargin: window.innerHeight + "px" }
				);

				lazyImages.forEach(function (lazyImage) {
					lazyImageObserver.observe(lazyImage);
				});
			} else {
				// Not supported, load all images immediately
				lazyImages.forEach(function (image) {
					image.srcset = image.dataset.srcset;

					if (image.dataset.src) {
						image.src = image.dataset.src;
					}
				});
			}
		}

		/**
		 * Public interface.
		 */
		return Object.freeze({
			init
		});
	};

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	// Older browsers don't support event options, feature detect it.

	// Adopted and modified solution from Bohdan Didukh (2017)
	// https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

	var hasPassiveEvents = false;
	if (typeof window !== 'undefined') {
	  var passiveTestOptions = {
	    get passive() {
	      hasPassiveEvents = true;
	      return undefined;
	    }
	  };
	  window.addEventListener('testPassive', null, passiveTestOptions);
	  window.removeEventListener('testPassive', null, passiveTestOptions);
	}

	var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


	var locks = [];
	var documentListenerAdded = false;
	var initialClientY = -1;
	var previousBodyOverflowSetting = void 0;
	var previousBodyPaddingRight = void 0;

	// returns true if `el` should be allowed to receive touchmove events.
	var allowTouchMove = function allowTouchMove(el) {
	  return locks.some(function (lock) {
	    if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
	      return true;
	    }

	    return false;
	  });
	};

	var preventDefault = function preventDefault(rawEvent) {
	  var e = rawEvent || window.event;

	  // For the case whereby consumers adds a touchmove event listener to document.
	  // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
	  // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
	  // the touchmove event on document will break.
	  if (allowTouchMove(e.target)) {
	    return true;
	  }

	  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
	  if (e.touches.length > 1) return true;

	  if (e.preventDefault) e.preventDefault();

	  return false;
	};

	var setOverflowHidden = function setOverflowHidden(options) {
	  // If previousBodyPaddingRight is already set, don't set it again.
	  if (previousBodyPaddingRight === undefined) {
	    var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
	    var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

	    if (_reserveScrollBarGap && scrollBarGap > 0) {
	      previousBodyPaddingRight = document.body.style.paddingRight;
	      document.body.style.paddingRight = scrollBarGap + 'px';
	    }
	  }

	  // If previousBodyOverflowSetting is already set, don't set it again.
	  if (previousBodyOverflowSetting === undefined) {
	    previousBodyOverflowSetting = document.body.style.overflow;
	    document.body.style.overflow = 'hidden';
	  }
	};

	var restoreOverflowSetting = function restoreOverflowSetting() {
	  if (previousBodyPaddingRight !== undefined) {
	    document.body.style.paddingRight = previousBodyPaddingRight;

	    // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
	    // can be set again.
	    previousBodyPaddingRight = undefined;
	  }

	  if (previousBodyOverflowSetting !== undefined) {
	    document.body.style.overflow = previousBodyOverflowSetting;

	    // Restore previousBodyOverflowSetting to undefined
	    // so setOverflowHidden knows it can be set again.
	    previousBodyOverflowSetting = undefined;
	  }
	};

	// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
	var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
	  return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
	};

	var handleScroll = function handleScroll(event, targetElement) {
	  var clientY = event.targetTouches[0].clientY - initialClientY;

	  if (allowTouchMove(event.target)) {
	    return false;
	  }

	  if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
	    // element is at the top of its scroll.
	    return preventDefault(event);
	  }

	  if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
	    // element is at the bottom of its scroll.
	    return preventDefault(event);
	  }

	  event.stopPropagation();
	  return true;
	};

	var disableBodyScroll = function disableBodyScroll(targetElement, options) {
	  // targetElement must be provided
	  if (!targetElement) {
	    // eslint-disable-next-line no-console
	    console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
	    return;
	  }

	  // disableBodyScroll must not have been called on this targetElement before
	  if (locks.some(function (lock) {
	    return lock.targetElement === targetElement;
	  })) {
	    return;
	  }

	  var lock = {
	    targetElement: targetElement,
	    options: options || {}
	  };

	  locks = [].concat(_toConsumableArray(locks), [lock]);

	  if (isIosDevice) {
	    targetElement.ontouchstart = function (event) {
	      if (event.targetTouches.length === 1) {
	        // detect single touch.
	        initialClientY = event.targetTouches[0].clientY;
	      }
	    };
	    targetElement.ontouchmove = function (event) {
	      if (event.targetTouches.length === 1) {
	        // detect single touch.
	        handleScroll(event, targetElement);
	      }
	    };

	    if (!documentListenerAdded) {
	      document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
	      documentListenerAdded = true;
	    }
	  } else {
	    setOverflowHidden(options);
	  }
	};

	var clearAllBodyScrollLocks = function clearAllBodyScrollLocks() {
	  if (isIosDevice) {
	    // Clear all locks ontouchstart/ontouchmove handlers, and the references.
	    locks.forEach(function (lock) {
	      lock.targetElement.ontouchstart = null;
	      lock.targetElement.ontouchmove = null;
	    });

	    if (documentListenerAdded) {
	      document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
	      documentListenerAdded = false;
	    }

	    // Reset initial clientY.
	    initialClientY = -1;
	  } else {
	    restoreOverflowSetting();
	  }

	  locks = [];
	};

	var enableBodyScroll = function enableBodyScroll(targetElement) {
	  if (!targetElement) {
	    // eslint-disable-next-line no-console
	    console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
	    return;
	  }

	  locks = locks.filter(function (lock) {
	    return lock.targetElement !== targetElement;
	  });

	  if (isIosDevice) {
	    targetElement.ontouchstart = null;
	    targetElement.ontouchmove = null;

	    if (documentListenerAdded && locks.length === 0) {
	      document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
	      documentListenerAdded = false;
	    }
	  } else if (!locks.length) {
	    restoreOverflowSetting();
	  }
	};

	var bodyScrollLock = /*#__PURE__*/Object.freeze({
		__proto__: null,
		clearAllBodyScrollLocks: clearAllBodyScrollLocks,
		disableBodyScroll: disableBodyScroll,
		enableBodyScroll: enableBodyScroll
	});

	/**
	 * Component: Accordion
	 * ------------------------------------------------------------------------------
	 * ARIA accessible accordion to collapse/expand content in a tabbed layout.
	 *
	 * @namespace accordion
	 */

	/**
	 * DOM selectors.
	 */

	const selectors$5 = {
		container: ".js-accordion-container",
		content: ".js-accordion-content",
		control: ".js-accordion-control",
		item: ".js-accordion-item",
		inner: ".js-accordion-inner",
		cartNoteField: ".js-cart-notes-field"
	};

	/**
	 * Export a new accordion instance.
	 */
	var Accordion = (config = {}) => {
		const cssClasses = window.themeCore.utils.cssClasses;
		const extendDefaults = window.themeCore.utils.extendDefaults;
		const on = window.themeCore.utils.on;
		const focusable = window.themeCore.utils.focusable;

		/**
		 * Instance default settings.
		 */
		const defaults = {
			singleOpen: false,
			expandInitial: false,
			expandAll: false
		};

		/**
		 * Instance settings.
		 */
		const settings = extendDefaults(defaults, config);

		if (settings.initiated) {
			return;
		}

		let containers = [];
		let accordions = [];
		let isProcessing = false;

		/**
		 * Initialise component.
		 */
		function init() {
			/**
			 * DOM node selectors.
			 */

			containers = document.querySelectorAll(selectors$5.container);
			accordions = [];

			containers.forEach((container) => {
				accordions.push({
					container,
					controls: [...container.querySelectorAll(selectors$5.control)],
					content: [...container.querySelectorAll(selectors$5.content)],
					items: [...container.querySelectorAll(selectors$5.item)]
				});
			});

			setInnerHeight();
			setDefaultState();
			setEventListeners();

			settings.initiated = true;
		}

		/**
		 * Set inner content height to allow the smooth transition.
		 */
		function setInnerHeight() {
			accordions.forEach(({ content }) => {
				content.forEach((item) => {
					if (!item.closest(selectors$5.item) || !item.closest(selectors$5.item).classList.contains(cssClasses.active)) {
						unsetTabIndexOnTarget(item);
						item.style.height = 0;
					} else {
						setTabIndexOnTarget(item);
					}
				});
			});
		}

		/**
		 * Set all default states based on settings.
		 */
		function setDefaultState() {
			if (settings.expandAll) {
				expandAllItems();
			}

			if (settings.expandInitial) {
				expandInitialItem();
			}
		}

		/**
		 * Set click events on items.
		 */
		function setEventListeners() {
			accordions.forEach(({ container }) => {
				on("click", container, handleClickEvent);
				on("keydown", container, handleKeyboardEvent);
			});
		}

		/**
		 * Set tabindex to 0 on target focusables to make them un-tabbable.
		 * @param {String} target - Target element.
		 */
		function unsetTabIndexOnTarget(target) {
			focusable(target).forEach((element) => element.setAttribute("tabindex", -1));
		}

		/**
		 * Unset tabindex on target focusables to 1 to make them tabbable.
		 * @param {String} target - Target element.
		 */
		function setTabIndexOnTarget(target) {
			focusable(target).forEach((element) => element.setAttribute("tabindex", 0));
		}

		/**
		 * Handle toggle event on accordion control click.
		 * @param {Event} event - Click event.
		 */
		function handleClickEvent(event) {
			const control = event.target.closest(selectors$5.control);
			if (!control || !isTargetControl(control)) {
				return;
			}

			event.preventDefault();
			toggleItem(event.target);
		}

		/**
		 * Handle keyboard behaviour on the main accordion container.
		 * @param {Event} event - Keydown event.
		 */
		function handleKeyboardEvent(event) {
			if (!isTargetControl(event.target)) {
				return;
			}

			if (isKeyPressArrowUp(event) || isKeyPressArrowDown(event)) {
				handleArrowEvents(event);
				return;
			}

			if (isKeyPressHome(event) || isKeyPressEnd(event)) {
				handleHomeEndEvents(event);
			}
		}

		/**
		 * Handle up arrow events when control is currently focused.
		 * - When focus is on an accordion header, moves focus to the previous accordion header.
		 * - When focus is on first accordion header, moves focus to last accordion header.
		 * @param {Event} event - Keydown event.
		 */
		function handleArrowEvents(event) {
			event.preventDefault();

			const container = event.target.closest(selectors$5.container);
			const currentAccordion = accordions.find(({ container: accordionContainer }) => container === accordionContainer);

			const index = currentAccordion.controls.indexOf(event.target);
			const direction = isKeyPressArrowUp(event) ? -1 : 1;
			const length = currentAccordion.controls.length;
			const newIndex = (index + length + direction) % length;

			currentAccordion.controls[newIndex].focus();
		}

		/**
		 * Handle events when Home or End keyboard events are pressed when control is focused.
		 * - Home: When focus is on an accordion header, moves focus to the first accordion header.
		 * - End: When focus is on an accordion header, moves focus to the last accordion header.
		 * @param {Event} event - Keydown on arrow up event.
		 */
		function handleHomeEndEvents(event) {
			event.preventDefault();

			const container = event.target.closest(selectors$5.container);
			const currentAccordion = accordions.find(({ container: accordionContainer }) => container === accordionContainer);

			if (isKeyPressHome(event)) {
				currentAccordion.controls[0].focus();
				return;
			}

			if (isKeyPressEnd(event)) {
				currentAccordion.controls[currentAccordion.controls.length - 1].focus();
			}
		}

		/**
		 * Expand targeted item and set ARIA values.
		 * @param {HTMLElement} element - The accordion item.
		 */
		function expandItem(element) {
			if (!element) {
				return;
			}

			if (isProcessing) {
				return;
			}

			const elementContent = element.querySelector(selectors$5.content);

			animateContent(element, false);

			setTabIndexOnTarget(elementContent);

			element.classList.add(cssClasses.active);
			element.querySelector(selectors$5.control).setAttribute("aria-expanded", true);
		}

		/**
		 * Animates the content element.
		 * @param {HTMLElement} element - The element to animate.
		 * @param {Boolean} hide - Hide element when closed.
		 */
		function animateContent(element, hide) {
			if (!element) {
				return;
			}

			isProcessing = true;

			function getElementMargin(element, side) {
				if (!element) return 0;

				const computedStyle = window.getComputedStyle(element);

				return parseInt(computedStyle[side], 10) || 0;
			}

			const animationDelay = 500;
			const elementContent = element.querySelector(selectors$5.content);
			const cartNoteField = element.querySelector(selectors$5.cartNoteField);
			const elementMarginTop = getElementMargin(cartNoteField, "marginTop");
			const elementMarginBottom = getElementMargin(cartNoteField, "marginBottom");
			const innerHeight = (element.querySelector(selectors$5.inner).offsetHeight || 0) + elementMarginTop + elementMarginBottom;

			if (hide) {
				elementContent.style.height = innerHeight + "px";

				setTimeout(() => {
					elementContent.style.height = 0;

					isProcessing = false;
				}, 0);
			} else {
				elementContent.style.height = innerHeight + "px";

				setTimeout(() => {
					elementContent.removeAttribute("style");

					isProcessing = false;
				}, animationDelay);
			}
		}

		/**
		 * Hide targeted item and set ARIA values.
		 * @param {HTMLElement} element - The accordion item.
		 */
		function collapseItem(element) {
			if (!element) {
				return;
			}

			if (isProcessing) {
				return;
			}

			animateContent(element, true);

			const elementContent = element.querySelector(selectors$5.content);

			unsetTabIndexOnTarget(elementContent);

			element.classList.remove(cssClasses.active);
			element.querySelector(selectors$5.control).setAttribute("aria-expanded", false);
		}

		/**
		 * Check if item is active.
		 * @param {HTMLElement} element - The accordion item.
		 * @returns {Boolean}
		 */
		function isItemExpanded(element) {
			return element.classList.contains(cssClasses.active);
		}

		/**
		 * Hide all unselected items.
		 * @param {HTMLElement} element - The accordion item.
		 */
		function collapseUnselectedItems(element) {
			const container = element.closest(selectors$5.container);
			const currentAccordion = accordions.find(({ container: accordionContainer }) => container === accordionContainer);

			if (currentAccordion) {
				currentAccordion.items.forEach((item) => {
					if (isItemExpanded(item) && item !== element) {
						collapseItem(item);
					}
				});
			}
		}

		/**
		 * Toggle targeted accordion item.
		 * @param {HTMLElement} control - The clicked accordion control.
		 */
		function toggleItem(control) {
			const item = control.closest(selectors$5.item);

			if (settings.singleOpen) {
				collapseUnselectedItems(item);
			}

			if (isItemExpanded(item)) {
				collapseItem(item);
				return;
			}

			expandItem(item);
		}

		/**
		 * Check if keycode event is a down arrow or page down.
		 * @param {Event} event - Keydown event.
		 * @returns {Boolean}
		 */
		function isKeyPressArrowDown(event) {
			return event.keyCode === 40 || event.keyCode === 34;
		}

		/**
		 * Check if keycode event is an up arrow or page up.
		 * @param {Event} event - Keydown event.
		 * @returns {Boolean}
		 */
		function isKeyPressArrowUp(event) {
			return event.keyCode === 38 || event.keyCode === 33;
		}

		/**
		 * Check if keycode event is end.
		 * @param {Event} event - Keydown event.
		 * @returns {Boolean}
		 */
		function isKeyPressEnd(event) {
			return event.keyCode === 35;
		}

		/**
		 * Check if keycode event is home.
		 * @param {Event} event - Keydown event.
		 * @return {Boolean}
		 */
		function isKeyPressHome(event) {
			return event.keyCode === 36;
		}

		/**
		 * Check if the click target is an accordion control.
		 * @param {HTMLElement} target - Clicked target to check quick view attributes against.
		 * @returns {Boolean}
		 */
		function isTargetControl(target) {
			return accordions.find(({ controls }) => controls.includes(target));
		}

		/**
		 * Expand all items in accordion.
		 */
		function expandAllItems() {
			accordions.forEach(({ items }) => {
				items.forEach((element) => {
					expandItem(element);
				});
			});
		}

		/**
		 * Expand initial item in accordion.
		 */
		function expandInitialItem() {
			accordions.forEach(({ items }) => {
				items.forEach((element, index) => {
					if (index === 0) {
						expandItem(element);
						return;
					}

					collapseItem(element);
				});
			});
		}

		/**
		 * Collapse all items in accordion.
		 */
		function collapseAllItems(selector) {
			accordions.forEach(({ items, container }) => {
				if (!selector) {
					items.forEach((item) => {
						collapseItem(item);
					});
				}

				if (typeof selector === "string") {
					selector = [selector];
				}

				if (Array.isArray(selector)) {
					const parent = container.parentElement;

					selector.forEach((elem) => {
						const container = parent.querySelector(elem);

						if (container) {
							items.forEach((item) => {
								collapseItem(item);
							});
						}
					});
				}
			});
		}

		/**
		 * Initiated status
		 * @returns {boolean}
		 */
		function initiated() {
			return !!settings.initiated;
		}

		/**
		 * Return containers state
		 * @returns {Array}
		 */
		function getContainers() {
			return containers || [];
		}

		/**
		 * Return accordions state
		 * @returns {Array}
		 */
		function getAccordions() {
			return accordions || [];
		}

		/**
		 * Set tab index for content
		 * If you need set uniq tabindex or update to default
		 * @param selector - accordion container selector
		 * @param mode - all (default) | active | hidden. Content to which tabindex is set
		 * @param index -
		 */
		function setTabIndex(selector, mode = "all", index = -1) {
			if (!selector) {
				return;
			}

			const allContainsSelector = [...document.querySelectorAll(selector)];

			const accordion = accordions.find((accordion) => allContainsSelector.find((element) => element === accordion.container));

			if (!accordion) {
				return;
			}

			let targetContent = [];

			switch (mode) {
				case "active":
					accordion.items
						.filter((item) => item.classList.contains(cssClasses.active))
						.forEach((item) => {
							accordion.content.forEach((content) => {
								if (item.contains(content)) {
									targetContent.push(content);
								}
							});
						});
					break;

				case "hidden":
					accordion.items
						.filter((item) => !item.classList.contains(cssClasses.active))
						.forEach((item) => {
							accordion.content.forEach((content) => {
								if (item.contains(content)) {
									targetContent.push(content);
								}
							});
						});
					break;

				case "all":
				default:
					targetContent = accordion.content;
					break;
			}

			targetContent.forEach((content) =>
				focusable(content).forEach((element) => {
					element.setAttribute("tabindex", index);
				})
			);
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init,
			initiated,
			collapseAllItems,
			expandAllItems,
			expandInitialItem,
			getContainers,
			getAccordions,
			setTabIndex
		});
	};

	const selectors$4 = {
		container: ".js-popover-container",
		button: ".js-popover-button",
		content: ".js-popover-content"
	};

	var Popover = () => {
		const cssClasses = window.themeCore.utils.cssClasses;

		function init() {
			document.addEventListener("click", (event) => {
				const button = event.target.closest(selectors$4.button);

				if (!button) {
					const contents = [...document.querySelectorAll(selectors$4.content)];
					contents.forEach((content) => {
						content.classList.remove(cssClasses.active);
						const container = content.closest(selectors$4.container);

						if (!container) {
							return;
						}

						const button = container.querySelector(selectors$4.button);

						if (!button) {
							return;
						}

						button.setAttribute("aria-expanded", "false");
					});
					return;
				}

				const container = button.closest(selectors$4.container);

				if (!container) {
					return;
				}

				const content = container.querySelector(selectors$4.content);

				if (!content) {
					return;
				}

				content.classList.toggle(cssClasses.active);
				const prevExpanded = button.getAttribute("aria-expanded");

				if (prevExpanded) {
					button.setAttribute("aria-expanded", prevExpanded === "true" ? "false" : "true");
				}
			});
		}

		return Object.freeze({
			init
		});
	};

	var Tabs = () => {
		/**
		 * Initialise component.
		 */

		function init() {
			document.addEventListener("click", (event) => {
				const target = event && event.target;

				if (!target) {
					return;
				}

				const button = target.closest(".js-tab-button");

				if (!button) {
					return;
				}

				if (button.classList.contains("active")) {
					return;
				}

				const tabsContainer = button.closest("[data-tabs-container]");

				const tabName = button.getAttribute("data-tab");
				const tabContent = tabsContainer.querySelector(`[data-tab-content=${tabName}]`);
				const passiveTabs = tabsContainer.querySelectorAll("[data-tab-content].active");
				const passiveTabsButtons = tabsContainer.querySelectorAll("[data-tab].active");

				button.classList.add("active");
				button.setAttribute("aria-expanded", "true");

				tabContent.classList.add("active");

				button.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "center"
				});

				passiveTabs.forEach((content) => {
					content.classList.remove("active");
				});

				passiveTabsButtons.forEach((tabButton) => {
					tabButton.classList.remove("active");
					tabButton.setAttribute("aria-expanded", "false");
				});
			});
		}

		/**
		 * Public interface.
		 */
		return Object.freeze({
			init
		});
	};

	/**
	 * Component: Product card
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ProductСard
	 */

	/**
	 * DOM selectors.
	 */
	const selectors$3 = {
		productCard: ".js-product-card",
		swatch: ".js-product-card-swatch",
		video: ".js-product-card-video",
		imagesWrapper: ".js-product-card-images-wrapper",
		quickViewButton: ".js-product-card-quick-view-button",
		minQuantity: ".js-product-card-min-value"
	};

	/**
	 * Data attributes
	 */
	const attributes$2 = {
		productHandle: "data-product-card-handle",
		swatchIndex: "data-swatch",
		imageIndex: "data-image",
		variant: "data-variant",
		preorder: "data-preorder"
	};

	/**
	 * Export a new product card instance.
	 */
	var ProductCard = () => {
		let initiatedState = false;

		if (initiatedState) {
			return;
		}

		let currentHoverVideo = null;

		const cssClasses = window.themeCore.utils.cssClasses;

		/**
		 * Initialise component.
		 */
		function init() {
			setEventListeners();
			window.themeCore.EventBus.emit("compare-products:init");
			initiatedState = true;
		}

		/**
		 * Set click events on items.
		 */
		function setEventListeners() {
			document.addEventListener("click", (event) => {
				if (isTargetQuickView(event.target)) {
					quickViewButtonHandler(event);
				}

				if (isTargetSwatch(event.target)) {
					swatchHandler(event);
				}
			});

			document.addEventListener("mouseover", (event) => {
				if (getClosestVideo(event.target)) {
					currentHoverVideo = getClosestVideo(event.target);
					productCardVideoPlay(currentHoverVideo);

					currentHoverVideo.addEventListener(
						"mouseleave",
						() => {
							productCardVideoPause(currentHoverVideo);

							currentHoverVideo = null;
						},
						{ once: true }
					);
				}
			});
		}

		/**
		 * Quick view button click event handler.
		 * @param {Event} event - Click event.
		 */
		function quickViewButtonHandler(event) {
			const button = getClosestQuickViewButton(event.target);
			const productCard = getClosestProductCard(event.target);
			const productHandle = getProductHandle(button);
			const variantId = getVariantId(getClosestProductCard(button));
			const hasMultipleVariants = !button.hasAttribute("data-variant");
			let isPromoBannerCard = !!button.closest("#promotion-products-popup");

			hasMultipleVariants ? emitQuickViewClickEvent(productHandle, variantId, isPromoBannerCard) : emitCartEvent(getVariantId(button), getMinQuantity(productCard), productCard);
		}

		/**
		 * Video mouse over event handler.
		 * @param {HTMLElement} video element.
		 */
		function productCardVideoPlay(video) {
			if (!video) {
				return;
			}

			video.play();
		}

		/**
		 * Video mouse leave event handler.
		 * @param {HTMLElement} video element.
		 */
		function productCardVideoPause(video) {
			if (!video) {
				return;
			}

			video.pause();
		}

		/**
		 * Swatch click event handler.
		 * @param {Event} event - CLick event.
		 */
		function swatchHandler(event) {
			let swatch = getClosestSwatch(event.target);

			if (swatch.classList.contains(cssClasses.active)) {
				return;
			}

			toggleSwatch(swatch);
		}

		/**
		 * Check if the click target is an a quick view button.
		 * @param {Event.target} target - CLick target.
		 * @returns {Boolean}
		 */
		function isTargetQuickView(target) {
			return !!getClosestQuickViewButton(target);
		}

		/**
		 * Check if the click target is an a swatch.
		 * @param {Event.target} target - Click target.
		 * @returns {Boolean}
		 */
		function isTargetSwatch(target) {
			return !!getClosestSwatch(target);
		}

		/**
		 * Get closest quick view button from click target.
		 * @param {Event.target} target - Click target
		 * @returns {HTMLElement}
		 */
		function getClosestQuickViewButton(target) {
			return target.closest(selectors$3.quickViewButton);
		}

		/**
		 * Get closest swatch from click target.
		 * @param {Event.target} target - Click target
		 * @returns {HTMLElement}
		 */
		function getClosestSwatch(target) {
			return target.closest(selectors$3.swatch);
		}

		/**
		 * Get closest product card from click target.
		 * @param {HTMLElement} element - Click target
		 * @returns {HTMLElement}
		 */
		function getClosestProductCard(element) {
			return element.closest(selectors$3.productCard);
		}

		/**
		 * Get closest video from mouse target.
		 * @param {HTMLElement} element - Mouse target
		 * @returns {HTMLElement}
		 */
		function getClosestVideo(element) {
			return element.closest(selectors$3.video);
		}

		/**
		 * Get product handle from clicked quick view button.
		 * @param {Event.target} target - The clicked quick view button.
		 * @returns {string}
		 */
		function getProductHandle(target) {
			return target.getAttribute(attributes$2.productHandle);
		}

		/**
		 * Get current variant id from product card.
		 * @param {Event.target} target - The clicked quick view button.
		 * @returns {string}
		 */
		function getVariantId(target) {
			const currentImage = target.querySelector(`${selectors$3.imagesWrapper}.${cssClasses.active}`);

			if (target && target.getAttribute(attributes$2.variant)) {
				return target.getAttribute(attributes$2.variant);
			} else if (currentImage && currentImage.getAttribute(attributes$2.variant)) {
				return currentImage.getAttribute(attributes$2.variant);
			}
		}

		/**
		 * Change active swatch to clicked swatch.
		 * @param {HTMLElement} swatch - The clicked swatch.
		 */
		function toggleSwatch(swatch) {
			const productCard = getClosestProductCard(swatch);

			const swatchIndex = getSwatchIndex(swatch);

			const swatches = [...productCard.querySelectorAll(selectors$3.swatch)];

			removeActiveClasses(swatches);

			setCurrentElementActive(swatch);

			toggleImage(productCard, swatchIndex);
		}

		/**
		 * Change the current image to an image with the same index as the clicked swatch.
		 * @param {HTMLElement} productCard - An array of image wrappers from the current product card destructured from an object.
		 * @param {Number} swatchIndex - Clicked swatch index.
		 */
		function toggleImage(productCard, swatchIndex) {
			const images = [...productCard.querySelectorAll(selectors$3.imagesWrapper)];

			let currentImage = images.find((image) => getImageIndex(image) === swatchIndex);

			removeActiveClasses(images);

			setCurrentElementActive(currentImage);
		}

		/**
		 * Get the index of the passed swatch.
		 * @param {HTMLElement} swatch - Passed swatch.
		 * @returns {number}
		 */
		function getSwatchIndex(swatch) {
			return swatch.getAttribute(attributes$2.swatchIndex);
		}

		/**
		 * Get the index of the passed image.
		 * @param {HTMLElement} image - Passed image.
		 * @returns {number}
		 */
		function getImageIndex(image) {
			return image.getAttribute(attributes$2.imageIndex);
		}

		/**
		 * Remove the 'is-active' class from all passed elements.
		 * @param {Array} elements - Array of images / Array of swatches.
		 */
		function removeActiveClasses(elements) {
			elements.forEach((element) => element.classList.remove(cssClasses.active));
		}

		/**
		 * Add an 'is-active' class to the passed element.
		 * @param {HTMLElement} element - Image element / Swatch element.
		 */
		function setCurrentElementActive(element) {
			if (!element) {
				return;
			}

			element.classList.add(cssClasses.active);
		}

		/**
		 * Emit an event in the eventBus when the quick view button is clicked.
		 * @param {String} handle - Product handle for quick view modal.
		 * @param {String} variantId - Product variant for quick view modal.
		 * @param {Boolean} isPromoBannerCard - is product card in the Promotion banner popup.
		 */
		function emitQuickViewClickEvent(handle, variantId, isPromoBannerCard) {
			window.themeCore.EventBus.emit("product-card:quick-view:clicked", {
				productHandle: handle,
				variant: variantId,
				isPromoBannerCard: isPromoBannerCard
			});
		}

		/**
		 * Emit an event in the eventBus when need to open cart/minicart.
		 * @param {String} variantId - Product variant.
		 * @param {Number} quantity - Product quantity.
		 */
		async function emitCartEvent(variantId, quantity, productCard) {
			try {
				const params = {
					id: variantId,
					quantity
				};

				if (productCard && productCard.hasAttribute(attributes$2.preorder)) {
					params.properties = params.properties || {};
					params.properties["_Pre-order"] = "true";
				}

				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, params);
				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART);
			} catch (error) {
				onQuantityError(error);
			}
		}

		function onQuantityError(error) {
			const CartNotificationError = window.themeCore.CartNotificationError;

			CartNotificationError.addNotification(error.description);
			CartNotificationError.open();
		}

		/**
		 * Get minimum quantity to add.
		 * @param {HTMLElement} target - Passed image.
		 * @returns {number}
		 */
		function getMinQuantity(target) {
			const minQuantityEl = target.querySelector(selectors$3.minQuantity);

			if (!minQuantityEl) {
				return 1;
			}

			return Number(minQuantityEl.value) || 1;
		}

		/**
		 * Initiated status.
		 * @returns {boolean}
		 */
		function initiated() {
			return !!initiatedState;
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init,
			initiated
		});
	};

	function disableTabulationOnNotActiveSlidesWithModel(swiper) {
		const selectors = {
			interactiveElements: ".js-video iframe, video.js-video, .js-product-media-model-button, .shopify-model-viewer-ui__button, model-viewer",
			modelViewer: "model-viewer",
			userInput: ".userInput"
		};
		const slides = swiper.slides;

		slides.forEach((slide, index) => {
			const interactiveElements = [...slide.querySelectorAll(selectors.interactiveElements)];

			const modelViewer = slide.querySelector(selectors.modelViewer);

			if (modelViewer) {
				const userInput = modelViewer.shadowRoot && modelViewer.shadowRoot.querySelector(selectors.userInput);

				if (userInput) {
					const customStyles = modelViewer.querySelector(selectors.customStyles);

					if (!customStyles) {
						const styleElement = document.createElement("style");
						styleElement.innerHTML = `.userInput:focus-visible {
								outline-offset: -3px;
							}`;
						modelViewer.shadowRoot.append(styleElement);
					}

					interactiveElements.push(userInput);
				}
			}

			if (!interactiveElements.length) {
				return;
			}

			if (index === swiper.activeIndex) {
				interactiveElements.forEach((element) => {
					if (!element.matches(selectors.modelViewer)) {
						element.setAttribute("tabindex", 0);
						return;
					}

					element.removeAttribute("tabindex");
				});
				return;
			}

			interactiveElements.forEach((element) => {
				element.setAttribute("tabindex", -1);
			});
		});
	}

	var QuickView = () => {
		let form = null;
		let loading = false;
		let currentVariant = null;
		let hiddenSelect = null;
		let formButton = null;
		let productLink = null;
		let price = null;
		let productHandle = null;
		let swatches = null;
		let sliderEl = null;
		let slider = null;
		let formError = null;
		let quantity = null;
		let quantityWrapper = null;
		let quantityWidgetEl = null;
		let showDescription = false;
		let description = null;
		const buttonContent = {};
		let focusTarget = null;
		// const Video = window.themeCore.utils.Video;
		let videos = [];
		let convertFormData = null;

		const Toggle = window.themeCore.utils.Toggle;
		const overlay = window.themeCore.utils.overlay;
		const Swiper = window.themeCore.utils.Swiper;
		const cssClasses = window.themeCore.utils.cssClasses;
		cssClasses.quickViewPromotionBanner = "js-quick-view-promotion-banner";
		let container;

		const selectors = {
			quickView: ".js-quick-view",
			preloaderOverlay: `[data-js-overlay="quick-view-preloader"]`,
			form: ".js-quick-view-form",
			variantElemJSON: "[data-selected-variant]",
			hiddenSelect: ".js-quick-view-hidden-select",
			slider: ".js-quick-view-slider",
			slide: ".js-quick-view-slider .swiper-slide",
			image: ".js-quick-view-image",
			modal: "quick-view",
			productLink: ".js-quick-view-link",
			formButton: ".js-quick-submit-button",
			price: ".js-quick-view-price",
			fetchPrice: ".price",
			swatches: "[data-option]",
			media: ".js-quick-view-media",
			selectedOption: `[data-option="option1"]:checked, [data-option="option2"]:checked, [data-option="option3"]:checked, select[data-option]`,
			sources: "[data-size]",
			loader: `[data-js-overlay="quick-view"] .loader`,
			formError: ".js-quick-view-error",
			quantity: "[data-quantity-input]",
			quantityWrapper: ".js-product-quantity",
			description: ".js-quick-view-description",
			volumePricing: ".js-product-volume-pricing",
			volumePricingList: ".js-product-volume-pricing-list",
			volumePricingJSON: "[data-product-qty-breaks-json]",
			volumePricingShowMore: ".js-product-volume-pricing-show-more",
			priceVolume: ".js-price-volume",
			quantityRules: ".js-product-quantity-rules",
			quantityRuleMin: ".js-product-quantity-rule-min",
			quantityRuleMax: ".js-product-quantity-rule-max",
			quantityRuleIncrement: ".js-product-quantity-rule-increment",
			quantityRuleMinVal: ".js-product-quantity-rule-min-val",
			quantityRuleMaxVal: ".js-product-quantity-rule-max-val",
			quantityRuleIncrementVal: ".js-product-quantity-rule-increment-val",
			breaksVal: ".js-price-breaks-val",
			video: ".js-video",
			modelButton: ".js-quick-view-model-button",
			modelContent: ".js-quick-view-model-content",
			quickViewImage: ".js-quick-view-image"
		};

		const cachedOptions = new Map();

		let fetchController = new AbortController();
		let prefetchController = new AbortController();

		function init() {
			convertFormData = window.themeCore.utils.convertFormData;

			initCurrentQuickView();
			setEventListeners();
		}

		function setEventListeners() {
			window.themeCore.EventBus.listen("product-card:quick-view:clicked", quickViewHandler);

			document.addEventListener("change", formChangeHandler);
			document.addEventListener("submit", formSubmitHandler);
		}

		async function quickViewHandler(event) {
			const variant = event.variant;
			productHandle = event.productHandle;
			showDescription = event.showDescription;
			focusTarget = event.focusTarget;
			let isPromoBannerCard = event.isPromoBannerCard;

			if (!productHandle || loading) {
				return;
			}

			const currentQuick = document.querySelector(selectors.quickView);

			if (currentQuick) {
				const modal = Toggle({
					toggleSelector: selectors.modal
				});

				modal.init({ once: true });
				modal.close(container);
				return;
			}

			loading = true;
			overlay({ namespace: `quick-view-preloader` }).open(true);
			const url = getProductUrl(productHandle, variant, "quick_view");

			if (!url) {
				return;
			}

			container = await getHTML(url, selectors.quickView);

			if (!container) {
				return;
			}

			if (isPromoBannerCard) {
				container.classList.add(cssClasses.quickViewPromotionBanner);
			}

			cachedOptions.clear(); // clear cachedOptions on open new quick-view

			initQuickViewPopup();
			await prefetchOptions(container);

			const showMoreBtn = container.querySelector(selectors.volumePricingShowMore);
			const volumePricingList = container.querySelector(selectors.volumePricingList);

			if (!showMoreBtn || !volumePricingList) {
				return;
			}

			showMoreBtn.addEventListener("click", function (e) {
				e.preventDefault();

				let listHiddenItems = volumePricingList.querySelectorAll(".is-hidden");

				if (!listHiddenItems.length) {
					return;
				}

				listHiddenItems.forEach(function (listItem) {
					listItem.classList.remove(cssClasses.hidden);
				});

				showMoreBtn.classList.add(cssClasses.hidden);
			});
		}

		function initCurrentQuickView() {
			container = document.querySelector(selectors.quickView);

			if (!container) {
				return;
			}

			initQuickViewPopup();
			document.addEventListener("change", formChangeHandler);
			document.addEventListener("submit", formSubmitHandler);
		}

		function initQuickViewPopup() {
			hiddenSelect = container.querySelector(selectors.hiddenSelect);
			formButton = container.querySelector(selectors.formButton);
			productLink = container.querySelector(selectors.productLink);
			formError = container.querySelector(selectors.formError);
			sliderEl = container.querySelector(selectors.slider);
			quantity = container.querySelector(selectors.quantity);
			quantityWrapper = container.querySelector(selectors.quantityWrapper);
			price = [...container.querySelectorAll(selectors.price)];
			swatches = [...container.querySelectorAll(selectors.swatches)];

			if (!hiddenSelect || !formButton || !productLink || !price || !formError || !quantity || !quantityWrapper || !swatches) {
				return;
			}

			description = container.querySelector(selectors.description);

			if (description && !showDescription) {
				description.remove();
			}

			currentVariant = findCurrentVariant(container);

			!document.body.contains(container) && document.body.append(container);
			window.Shopify && window.Shopify.PaymentButton && window.Shopify.PaymentButton.init && window.Shopify.PaymentButton.init();

			const toggleConfig = {
				toggleSelector: selectors.modal
			};

			focusTarget && (toggleConfig.previouslySelectedElement = focusTarget);

			const modal = Toggle(toggleConfig);

			window.themeCore.EventBus.emit(`product:count-down-timer-reinit`);
			quantityWidgetEl = window.themeCore.utils.QuantityWidget(quantityWrapper).init();

			modal.init({ once: true });
			modal.open(container);
			loading = false;

			if (sliderEl) {
				slider = new Swiper(sliderEl, {
					slidesPerView: 1,
					autoplay: false,
					navigation: {
						prevEl: container.querySelector(".js-quick-view-slider-prev-btn"),
						nextEl: container.querySelector(".js-quick-view-slider-next-btn")
					}
				});

				document.dispatchEvent(new Event("theme:all:loaded"));

				slider.on("slideChange", function (swiper) {
					onProductSliderSlideChange();
					disableTabulationOnNotActiveSlidesWithModel(swiper);
					const activeSlide = swiper.slides[swiper.activeIndex];

					if (!activeSlide) {
						return;
					}

					swiper.allowTouchMove = !(activeSlide.querySelector("model-viewer") && !activeSlide.querySelector(selectors.modelButton));
				});

				updateImage();
				initVideos();
			}

			initARModelButton();

			function initARModelButton() {
				if (!sliderEl) {
					return;
				}

				sliderEl.addEventListener("click", (event) => {
					const modelButton = event.target.closest(selectors.modelButton);

					if (!modelButton) {
						return;
					}

					const slide = modelButton.closest(selectors.slide);

					if (!slide) {
						return;
					}

					const modelContent = slide.querySelector(selectors.modelContent);
					const sliderImage = slide.querySelector(selectors.quickViewImage);

					if (!modelContent || !sliderImage) {
						return;
					}

					modelContent.classList.remove(cssClasses.hidden);
					modelButton.remove();
					sliderImage.remove();

					if (slider) {
						slider.allowTouchMove = false;
					}
				});
			}

			setTimeout(() => container.focus(), 50);
		}

		function getProductUrl(productHandle, variant, templateSuffix, optionValues) {
			if (!productHandle) {
				return;
			}

			const locale = window.Shopify.routes.root;
			const url = new URL(`${window.location.origin}${locale}products/${productHandle}`);

			url.searchParams.set("view", templateSuffix);

			if (variant) {
				url.searchParams.set("variant", variant);
			}

			if (optionValues) {
				url.searchParams.set("option_values", optionValues);
			}

			return url;
		}

		async function getHTML(url, selector) {
			try {
				const response = await fetch(url);
				const resText = await response.text();
				let result = new DOMParser().parseFromString(resText, "text/html");
				if (selector) {
					result = result.querySelector(selector);
				}

				return result;
			} catch (error) {
				console.error(error);
			}
		}

		async function formChangeHandler(event) {
			const target = event.target;
			const currentForm = event.target.closest(selectors.form);

			buttonContent.addToCard = buttonContent.addToCard || window.themeCore.translations.get("products.product.add_to_cart");
			buttonContent.preOrder = buttonContent.preOrder || window.themeCore.translations.get("products.product.pre_order");
			buttonContent.soldOut = buttonContent.soldOut || window.themeCore.translations.get("products.product.sold_out");
			buttonContent.unavailable = buttonContent.unavailable || window.themeCore.translations.get("products.product.unavailable");

			if (!currentForm || !container) {
				return;
			}

			if (target.hasAttribute("data-quantity-input")) {
				// if we change qty-input - update volume pricing
				currentVariant = findCurrentVariant(currentForm);
				let quantityVariantInCart = getVariantCountInCart();

				updateVolumePricing(quantityVariantInCart);
				updateQuantityRules();
				updateQuantityLabelCartCount(quantityVariantInCart);
			}

			if (!target || !target.hasAttribute("data-option")) {
				return;
			}

			if (target.tagName === "SELECT" && target.selectedOptions.length) {
				Array.from(target.options)
					.find((option) => option.getAttribute("selected"))
					.removeAttribute("selected");
				target.selectedOptions[0].setAttribute("selected", "selected");
			}

			const productOptionsContainer = currentForm.querySelector(".js-quick-view-product-options");

			const selectedOptionValues = Array.from(productOptionsContainer.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")).map(
				({ dataset }) => dataset.optionValueId
			);

			const productUrl = container.getAttribute("data-url");
			const params = selectedOptionValues.length > 0 ? `${selectedOptionValues.join(",")}` : "";
			const url = `${productUrl}?view=quick_view&option_values=${params}`;

			let responseText;
			const cachedResult = cachedOptions.get(url);

			if (cachedResult) {
				responseText = cachedResult;
			} else {
				try {
					responseText = await (
						await fetch(url, {
							signal: fetchController.signal
						})
					).text();
					cachedOptions.set(url, responseText);
				} catch {
					return;
				}
			}

			prefetchOptions(currentForm);

			let fetchQuickViewContainer = new DOMParser().parseFromString(responseText, "text/html");
			let fetchQuickViewOptions = fetchQuickViewContainer.querySelector(".js-quick-view-product-options");

			productOptionsContainer.innerHTML = fetchQuickViewOptions.innerHTML;
			currentVariant = findCurrentVariant(productOptionsContainer);

			let volumePricingJSONEl = currentForm.querySelector(selectors.volumePricingJSON);

			if (volumePricingJSONEl && fetchQuickViewContainer.querySelector(selectors.volumePricingJSON)) {
				volumePricingJSONEl.innerHTML = fetchQuickViewContainer.querySelector(selectors.volumePricingJSON).innerHTML;
			}

			// need to set focus to last clicked option value
			if (document.querySelector(`#${target.id}`)) {
				document.querySelector(`#${target.id}`).focus();
			}

			form = currentForm;

			changeErrorMessage();

			updateButtons();
			updateSwatchLabelName(currentVariant, form);

			const quantityVariantInCart = getVariantCountInCart();

			updateVolumePricing(quantityVariantInCart);
			updateQuantityRules();
			updateQuantityLabelCartCount(quantityVariantInCart);

			if (!currentVariant) {
				hidePrice();
				return;
			}

			setCurrentVariant(currentVariant.id);

			updatePrice(fetchQuickViewContainer);
			updateImage();
		}

		function findCurrentVariant(container) {
			if (!container) {
				return;
			}

			const variantJSONElement = container.querySelector(selectors.variantElemJSON);
			const currentVariant = variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;

			return currentVariant;
		}

		function setCurrentVariant(variantId) {
			if (!variantId || !hiddenSelect) {
				return;
			}

			hiddenSelect.value = variantId;
		}

		function updateSwatchLabelName(variant, container) {
			const swatchNameEl = container.querySelector(".js-swatch-label-name");

			if (!swatchNameEl) {
				return;
			}

			if (!variant) {
				const swatchPosition = swatchNameEl.getAttribute("data-swatch-position");
				const swatchOptionSelected = container.querySelector(`[data-option='option${swatchPosition}']:checked`);

				if (swatchOptionSelected) {
					swatchNameEl.textContent = swatchOptionSelected.value;
				}

				return;
			}

			const optionPosition = swatchNameEl.getAttribute("data-swatch-position");
			const optionLabel = "option" + optionPosition;
			const optionName = variant[optionLabel];

			if (!optionName) {
				return;
			}

			swatchNameEl.textContent = optionName;
		}

		function updateImage() {
			if (!currentVariant || !currentVariant.featured_media || !slider || !sliderEl) {
				return;
			}

			const featuredImage = sliderEl.querySelector(`[data-img-id="${currentVariant.featured_media.id}"]`);

			if (!featuredImage) {
				return;
			}

			const slideIndex = featuredImage.closest(`[data-slide-index]`).getAttribute("data-slide-index");

			slider.slideTo(slideIndex);
		}

		function updateButtons() {
			if (!formButton || !productLink) {
				return;
			}

			if (!currentVariant) {
				formButton.innerText = buttonContent.unavailable;
				formButton.disabled = true;
				return;
			}

			let isPreorder = formButton.hasAttribute("data-preorder");
			let addToCartText = isPreorder ? buttonContent.preOrder : buttonContent.addToCard;

			formButton.innerText = currentVariant.available ? addToCartText : buttonContent.soldOut;
			formButton.disabled = !currentVariant.available;

			const url = new URL(productLink.href);
			url.searchParams.set("variant", currentVariant.id);
			productLink.href = url.pathname + url.search;
		}

		function updatePrice(quickViewDOM) {
			if (!quickViewDOM) {
				return;
			}

			let newPrice = quickViewDOM.querySelector(selectors.price);

			if (!newPrice) {
				return;
			}

			let newPriceInner = newPrice.querySelector(".js-price");

			if (!newPriceInner) {
				return;
			}

			price.forEach((priceElement) => (priceElement.innerHTML = newPriceInner.outerHTML));
		}

		function hidePrice() {
			price.forEach((priceElement) => (priceElement.innerHTML = ""));
		}

		async function formSubmitHandler(event) {
			const form = event.target.closest(selectors.form);
			const formData = form && new FormData(form);

			if (!formData) {
				return;
			}

			event.preventDefault();
			const errorMessage = await addToCart(event.target);
			changeErrorMessage(errorMessage);

			if (errorMessage) {
				return;
			}

			const loader = document.querySelector(selectors.loader);

			if (loader) {
				loader.remove();
			}

			if (window.themeCore.objects.settings.show_cart_notification || window.themeCore.objects.settings.cart_type === "page") {
				window.themeCore.EventBus.emit(`Toggle:quick-view:close`);
				window.themeCore.EventBus.emit(`Overlay:quick-view:close`);
			}

			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART);
		}

		function changeErrorMessage(message = "") {
			formError.innerText = message;
		}

		function updateVolumePricing(quantity) {
			const currentVariantEl = container.querySelector("[name=id]");
			if (!currentVariantEl) {
				return;
			}
			const volumePricing = container.querySelector(selectors.volumePricing);
			const volumePricingList = container.querySelector(selectors.volumePricingList);
			const volumePricingJSONEl = container.querySelector(selectors.volumePricingJSON);

			let quantityBreaks = null;

			if (!volumePricingJSONEl || !volumePricing) {
				return;
			}

			if (currentVariant) {
				const volumePricingJSON = JSON.parse(volumePricingJSONEl.innerHTML);
				quantityBreaks = volumePricingJSON[currentVariant.id].quantity_price_breaks;

				updateVariantVolumePrice(quantityBreaks);

				if (quantityBreaks.length) {
					renderVolumePriceList(quantityBreaks);
					volumePricing.classList.remove(cssClasses.hidden);
				} else {
					volumePricing.classList.add(cssClasses.hidden);
				}
			} else {
				volumePricing.classList.add(cssClasses.hidden);
			}

			function renderVolumePriceList(quantityBreaks) {
				if (!currentVariant) {
					return;
				}

				if (Number(volumePricingList.dataset.variant) === currentVariant.id) {
					return;
				}

				volumePricingList.dataset.variant = currentVariant.id;

				const showMoreBtn = container.querySelector(selectors.volumePricingShowMore);
				const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
				const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.each", {
					price: window.themeCore.utils.formatMoney(currentVariant.price, moneyFormat)
				});

				showMoreBtn.addEventListener("click", function (e) {
					e.preventDefault();

					let listHiddenItems = volumePricingList.querySelectorAll(".is-hidden");

					if (!listHiddenItems.length) {
						return;
					}

					listHiddenItems.forEach(function (listItem) {
						listItem.classList.remove(cssClasses.hidden);
					});

					showMoreBtn.classList.add(cssClasses.hidden);
				});

				volumePricingList.innerHTML = "";

				let defaultMinPriceHTML = `
				<li class="product-volume-pricing__list-item">
					<span>${currentVariant.quantity_rule.min}<span aria-hidden>+</span></span>
					<span>${priceTranslation}</span>
				</li>
			`;

				volumePricingList.insertAdjacentHTML("beforeend", defaultMinPriceHTML);

				quantityBreaks.forEach(function (quantityBreak, i) {
					let hiddenClass = i >= 2 ? `${cssClasses.hidden}` : "";

					let quantityBreakHTML = `
					<li class="product-volume-pricing__list-item ${hiddenClass}">
						<span>${quantityBreak.minimum_quantity}<span aria-hidden>+</span></span>
						<span>${quantityBreak.price_each}</span>
					</li>
				`;

					volumePricingList.insertAdjacentHTML("beforeend", quantityBreakHTML);
				});

				if (quantityBreaks.length >= 3) {
					showMoreBtn.classList.remove(cssClasses.hidden);
				} else {
					showMoreBtn.classList.add(cssClasses.hidden);
				}
			}

			function updateVariantVolumePrice(quantityBreaks) {
				const priceEls = container.querySelectorAll(selectors.priceVolume);
				const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
				const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.price_at_each", {
					price: window.themeCore.utils.formatMoney(currentVariant.price, moneyFormat)
				});

				if (!priceEls.length) {
					return;
				}

				if (!currentVariant) {
					priceEls.forEach((el) => el.classList.add(cssClasses.hidden));
					return;
				}

				if (!quantityBreaks || !quantityBreaks.length) {
					priceEls.forEach((el) => (el.innerHTML = priceTranslation));
					priceEls.forEach((el) => {
						el.classList.remove(cssClasses.hidden);
						const volumePriceWrapper = el.closest(".js-price-volume-wrapper");

						if (volumePriceWrapper) {
							volumePriceWrapper.classList.remove(cssClasses.hidden);
						}
					});

					return;
				}

				const currentBreak = quantityBreaks.findLast((qtyBreak) => {
					return Number(quantity) + Number(quantityWidgetEl.quantity.value) >= qtyBreak.minimum_quantity;
				});

				if (!currentBreak) {
					priceEls.forEach((el) => (el.innerHTML = priceTranslation));
					priceEls.forEach((el) => {
						el.classList.remove(cssClasses.hidden);
						const volumePriceWrapper = el.closest(".js-price-volume-wrapper");

						if (volumePriceWrapper) {
							volumePriceWrapper.classList.remove(cssClasses.hidden);
						}
					});
					return;
				}

				priceEls.forEach((el) => (el.innerHTML = currentBreak.price_at_each));
				priceEls.forEach((el) => el.classList.remove(cssClasses.hidden));
			}
		}

		function updateQuantityRules() {
			const quantityRules = container.querySelector(selectors.quantityRules);

			if (!quantityRules) {
				return;
			}

			if (!currentVariant || (currentVariant && !currentVariant.quantity_rule)) {
				quantityRules.classList.add(cssClasses.hidden);
				return;
			} else {
				quantityRules.classList.remove(cssClasses.hidden);
			}

			const variantQuantityRules = currentVariant.quantity_rule;
			const quantityRuleIncrement = quantityRules.querySelector(selectors.quantityRuleIncrement);
			const quantityRuleMin = quantityRules.querySelector(selectors.quantityRuleMin);
			const quantityRuleMax = quantityRules.querySelector(selectors.quantityRuleMax);
			const quantityRuleIncrementVal = quantityRules.querySelector(selectors.quantityRuleIncrementVal);
			const quantityRuleMinVal = quantityRules.querySelector(selectors.quantityRuleMinVal);
			const quantityRuleMaxVal = quantityRules.querySelector(selectors.quantityRuleMaxVal);

			if (quantityRuleIncrementVal) {
				quantityRuleIncrementVal.textContent = window.themeCore.translations.get("products.product.increments_of", { number: variantQuantityRules.increment });

				quantityWidgetEl.setIncrement(variantQuantityRules.increment);
				variantQuantityRules.increment > 1 ? quantityRuleIncrement.classList.remove(cssClasses.hidden) : quantityRuleIncrement.classList.add(cssClasses.hidden);
			}

			if (quantityRuleMinVal) {
				quantityRuleMinVal.textContent = window.themeCore.translations.get("products.product.minimum_of", { number: variantQuantityRules.min });
				quantityWidgetEl.setMin(variantQuantityRules.min);
				quantityWidgetEl.toggleDecrease();
				quantityWidgetEl.toggleIncrease();

				variantQuantityRules.min > 1 ? quantityRuleMin.classList.remove(cssClasses.hidden) : quantityRuleMin.classList.add(cssClasses.hidden);
			}

			if (quantityRuleMaxVal) {
				if (variantQuantityRules.max !== null) {
					quantityRuleMaxVal.textContent = window.themeCore.translations.get("products.product.maximum_of", { number: variantQuantityRules.max });
					quantityRuleMax.classList.remove(cssClasses.hidden);
					quantityWidgetEl.setMax(variantQuantityRules.max);
				} else {
					quantityRuleMaxVal.textContent = "";
					quantityRuleMax.classList.add(cssClasses.hidden);
					quantityWidgetEl.setMax("");
				}

				quantityWidgetEl.toggleDecrease();
				quantityWidgetEl.toggleIncrease();
			}

			if (variantQuantityRules.increment < 2 && variantQuantityRules.min < 2 && variantQuantityRules.max === null) {
				quantityRules.classList.add(cssClasses.hidden);
			} else {
				quantityRules.classList.remove(cssClasses.hidden);
			}
		}

		function updateQuantityLabelCartCount(quantity) {
			const priceBreaksEl = container.querySelector(selectors.breaksVal);

			if (!priceBreaksEl) {
				return;
			}

			priceBreaksEl.classList.toggle(cssClasses.hidden, !quantity);

			if (!quantity || quantity.value === "0") {
				priceBreaksEl.innerHTML = "";
			}

			priceBreaksEl.innerHTML = window.themeCore.translations.get("products.product.quantity_in_cart", { quantity });
		}

		function getVariantCountInCart() {
			const cartData = window.themeCore.cartObject;

			if (!cartData || !currentVariant) {
				return;
			}

			if (!cartData.items.length) {
				return 0;
			}

			const variant = cartData.items.find(function (item) {
				return item.variant_id === currentVariant.id;
			});

			if (!variant) {
				return 0;
			}

			return variant.quantity;
		}

		async function addToCart(target) {
			const formData = new FormData(target);
			const serialized = convertFormData(formData);

			try {
				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, serialized);
			} catch (error) {
				return error.description;
			}
		}

		function onProductSliderSlideChange() {
			videos.forEach(({ player }) => {
				try {
					player.pauseVideo();
				} catch (e) {}

				try {
					player.pause();
				} catch (e) {}
			});
		}

		function initVideos() {
			const slides = [...document.querySelectorAll(selectors.slide)];
			const Video = window.themeCore.utils.Video;

			slides.forEach((slide) => {
				const [video] = Video({
					videoContainer: slide,
					options: {
						youtube: {
							controls: 1,
							showinfo: 1
						}
					}
				}).init();

				if (video) {
					videos.push(video);
				}
			});
		}

		function transformOptionsToVariants(options) {
			// Group options by name
			const groupedOptions = options.reduce((acc, option) => {
				if (!acc[option.name]) {
					acc[option.name] = [];
				}
				acc[option.name].push(option);
				return acc;
			}, {});

			// Get arrays of each option type
			const optionTypes = Object.values(groupedOptions);

			// Generate all possible combinations (Cartesian product)
			function cartesianProduct(arrays) {
				return arrays.reduce(
					(acc, curr) => {
						const result = [];
						acc.forEach((a) => {
							curr.forEach((c) => {
								result.push([...a, c]);
							});
						});
						return result;
					},
					[[]]
				);
			}

			// Create variants from all combinations
			const combinations = cartesianProduct(optionTypes);

			const variants = combinations.map((combination) => {
				return {
					option_values: combination.map((opt) => opt.value).join(","),
					selected: combination.every((opt) => opt.selected),
					options: combination
				};
			});

			return variants;
		}

		function sortVariantsByProximity(variants) {
			// Find the currently selected variant (all options selected)
			const selectedVariant = variants.find((v) => v.selected);

			if (!selectedVariant) {
				return variants; // Return as-is if no selected variant
			}

			// Get the selected options values for comparison
			const selectedValues = selectedVariant.options.map((opt) => opt.value);

			// Sort variants by proximity to selected variant
			return variants.sort((a, b) => {
				// Count how many options match the selected variant
				const aMatches = a.options.filter((opt) => selectedValues.includes(opt.value)).length;
				const bMatches = b.options.filter((opt) => selectedValues.includes(opt.value)).length;

				// Calculate "distance" from selected variant
				const aDistance = selectedValues.length - aMatches;
				const bDistance = selectedValues.length - bMatches;

				// Sort by distance (closer variants first)
				if (aDistance !== bDistance) {
					return aDistance - bDistance;
				}

				// If same distance, maintain original order
				return 0;
			});
		}

		async function fetchUrl(url) {
			const response = await fetch(url, {
				signal: prefetchController.signal
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.text();
		}

		async function prefetchOptions(form) {
			// Get the selected option value IDs and format as query param
			const productOptionsContainer = form.querySelector(".js-quick-view-product-options");

			if (!productOptionsContainer) {
				return;
			}

			const productSection = form.closest("[data-section-type=product]");
			const productUrl = productSection.getAttribute("data-url");

			const allOptions = Array.from(productOptionsContainer.querySelectorAll("select[data-option] option, input[data-option]")).map((item) => {
				return {
					name: item.dataset.option || (item.closest("select") && item.closest("select").dataset.option),
					value: item.dataset.optionValueId,
					selected: item.matches("[selected], :checked")
				};
			});

			const variants = transformOptionsToVariants(allOptions);
			const sortedVariants = sortVariantsByProximity(variants);
			const filteredVariants = sortedVariants.filter((variant) => !Array.from(cachedOptions.keys()).some((key) => key.includes(variant.option_values)));
			const variantsToFetch = filteredVariants.slice(0, 20);
			const urlsToFetch = variantsToFetch.map(({ option_values }) => `${productUrl}?view=quick_view&option_values=${option_values}`);
			prefetchController.abort();
			prefetchController = new AbortController();

			const fetchPromises = urlsToFetch.map((url) => fetchUrl(url));
			const results = await Promise.allSettled(fetchPromises);
			results.forEach((result, index) => {
				if (result.status === "fulfilled") {
					const url = urlsToFetch[index];
					cachedOptions.set(url, result.value);
				}
			});
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Mixin: Scroll direction
	 * ------------------------------------------------------------------------------
	 * An event-based mixin to fire events when scroll direction has changed.
	 *
	 * @namespace scrollDirection
	 */

	/**
	 * Create a new scroll direction helper object.
	 */
	var ScrollDirection = (config = {}) => {
		const extendDefaults = window.themeCore.utils.extendDefaults;
		const on = window.themeCore.utils.on;
		const throttle = window.themeCore.utils.throttle;

		/**
		 * Instance default settings.
		 */
		const defaults = {
			threshold: 5,
			throttle: 250,
			start: 100
		};

		/**
		 * Instance settings.
		 */
		const settings = extendDefaults(defaults, config);
		let previousScrollTop = 0;
		let currentScrollDirection = "";
		let newScrollDirection = "";

		/**
		 * Set scrolling event with throttle parameter to limit the amount
		 * the callback can fire.
		 */
		function setEventListeners() {
			on("scroll", throttle(handleScrollEvent, settings.throttle));
		}

		/**
		 * Handle scrolling events using scroll top position.
		 */
		function handleScrollEvent() {
			const scrollPosition = window.pageYOffset;
			setScrollState(scrollPosition);
		}

		/**
		 * Set new scrolling direction value and fire off event.
		 * @param {Number} scrollPosition - The window offset/scroll position.
		 */
		function setScrollState(scrollPosition) {
			const scrollState = detectScrollDirection(scrollPosition);

			if (typeof scrollState === "undefined") {
				return;
			}

			if (scrollState !== currentScrollDirection) {
				currentScrollDirection = newScrollDirection;
				window.themeCore.EventBus.emit("ScrollDirection:changed", newScrollDirection);
			}
		}

		/**
		 * Get the new scroll direction string.
		 * @param {Number} scrollPosition - The window offset/scroll position.
		 * @returns {String}
		 */
		function detectScrollDirection(scrollPosition) {
			if (Math.abs(previousScrollTop - scrollPosition) <= settings.threshold) {
				return newScrollDirection;
			}

			if (scrollPosition > previousScrollTop && scrollPosition > settings.start) {
				window.themeCore.EventBus.emit("ScrollDirection:down", "down");
				newScrollDirection = "down";
			} else {
				window.themeCore.EventBus.emit("ScrollDirection:up", "up");
				newScrollDirection = "up";
			}

			if (scrollPosition <= settings.start + 10) {
				window.themeCore.EventBus.emit("ScrollDirection:top", "at-top");
				newScrollDirection = "at-top";
			}

			previousScrollTop = scrollPosition;

			return newScrollDirection;
		}

		/**
		 * Pure function to get current scrolling direction value.
		 * @returns {String}
		 */
		function getScrollDirection() {
			return currentScrollDirection;
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init: setEventListeners,
			get: getScrollDirection
		});
	};

	var Challenge = () => {
		const selectors = {
			form: "main form"
		};

		function addHash() {
			const hash = window.location.hash;
			const form = document.querySelector(selectors.form);

			if (!hash || !form || hash === "#newsletter-popup-contact-form") {
				return;
			}

			const formURL = new URL(form.action);
			formURL.hash = hash;

			form.action = formURL.toString();
		}

		function isChallenge() {
			return location.pathname === "/challenge";
		}

		function init() {
			if (!isChallenge()) {
				return;
			}

			addHash();
		}

		return Object.freeze({
			init
		});
	};

	const selectors$2 = {
		form: ".js-localization-form",
		input: "input[name='language_code'], input[name='country_code']",
		button: ".js-disclosure__button",
		panel: ".js-disclosure-list",
		link: ".js-disclosure__link"
	};

	const attributes$1 = {
		ariaExpanded: "aria-expanded",
		hidden: "hidden"
	};

	class localizationForm extends HTMLElement {
		constructor() {
			super();

			this.initiated = false;
			this.input = this.querySelector(selectors$2.input);
			this.button = this.querySelector(selectors$2.button);
			this.panel = this.querySelector(selectors$2.panel);

			Object.freeze(this.init());
		}

		init() {
			if (this.initiated) {
				return;
			}

			this.setEventListeners();

			this.initiated = true;
		}

		setEventListeners() {
			const openSelector = this.openSelector.bind(this);
			const closeSelector = this.closeSelector.bind(this);
			const onContainerKeyUp = this.onContainerKeyUp.bind(this);
			const onItemClick = this.onItemClick.bind(this);

			this.addEventListener("click", openSelector);
			this.addEventListener("click", closeSelector);
			this.addEventListener("keyup", onContainerKeyUp);
			this.panel.addEventListener("click", onItemClick);
		}

		hidePanel() {
			let links = this.panel.querySelectorAll(selectors$2.link);
			this.button.setAttribute(attributes$1.ariaExpanded, "false");
			this.panel.setAttribute(attributes$1.hidden, "true");
			links.forEach((link) => link.setAttribute("tabindex", -1));
		}

		onContainerKeyUp(event) {
			if (event.code.toUpperCase() !== "ESCAPE") {
				return;
			}

			this.hidePanel();
			this.button.focus();
		}

		onItemClick(event) {
			const listItems = event.target.closest(selectors$2.link);

			if (!listItems) {
				return;
			}

			event.preventDefault();
			this.input.value = listItems.dataset.value;

			const form = listItems.closest(selectors$2.form);

			if (!form) {
				return;
			}

			form.submit();
		}

		openSelector() {
			if (this.isPanelActive()) {
				return;
			}

			setTimeout(() => {
				let links = this.panel.querySelectorAll(selectors$2.link);
				this.button.focus();
				this.panel.toggleAttribute(attributes$1.hidden);
				this.button.setAttribute(attributes$1.ariaExpanded, (this.button.getAttribute(attributes$1.ariaExpanded) === "false").toString());

				links.forEach((link) => link.setAttribute("tabindex", 0));
			}, 0);
		}

		closeSelector(event) {
			if (!this.isPanelActive()) {
				return;
			}

			setTimeout(() => {
				const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";

				if (event.relatedTarget === null || shouldClose) {
					this.hidePanel();
				}
			}, 0);
		}

		isPanelActive() {
			return !this.panel.hasAttribute(attributes$1.hidden);
		}
	}

	document.addEventListener("DOMContentLoaded", () => {
		customElements.define("localization-form", localizationForm);
	});

	function unescape(value) {
		const doc = new DOMParser().parseFromString(value, "text/html");

		return doc.body.innerHTML;
	}

	var translations = {
		loaded: false,
		translations: {},
		async load() {
			const locale = window.Shopify.routes.root;
			const url = locale + "?view=translations";
			const translations = await fetch(url)
				.then((response) => response.json())
				.then((response) => response);

			this.loaded = true;
			this.translations = translations;

			document.dispatchEvent(
				new CustomEvent("theme:translations:loaded", {
					detail: {
						translations
					}
				})
			);
		},
		get(name, params = {}) {
			try {
				const translation = name.split(".").reduce((translations, key) => {
					if (translations.hasOwnProperty(key)) {
						return translations[key];
					}

					throw new Error("Translation missed");
				}, this.translations);

				return Object.keys(params).reduce((result = "", key) => {
					let regex = new RegExp(`{{(\\s+)?(${key})(\\s+)?}}`, "gm");

					return result.replace(regex, params[key]);
				}, unescape(translation));
			} catch (e) {}

			return `"${name}" translation missed`;
		},
		all() {
			return this.translations;
		}
	};

	/**
	 * Component: Toggle
	 * ------------------------------------------------------------------------------
	 * A accessible function to trigger a toggle-able component with a window overlay.
	 *
	 * @namespace Toggle
	 */

	/**
	 * Export default toggle module.
	 * @param {Object} config - Configuration.
	 */
	var Toggle = (config) => {
		/**
		 * Initialise component bind to prevent double binds.
		 */
		const removeTrapFocus = window.themeCore.utils.removeTrapFocus;
		const trapFocus = window.themeCore.utils.trapFocus;
		const cssClasses = window.themeCore.utils.cssClasses;
		const focusable = window.themeCore.utils.focusable;
		const extendDefaults = window.themeCore.utils.extendDefaults;
		const isElement = window.themeCore.utils.isElement;
		const on = window.themeCore.utils.on;
		const bind = window.themeCore.utils.bind;
		const overlay = window.themeCore.utils.overlay;

		const binder = bind(document.documentElement, {
			className: "esc-bind"
		});

		/**
		 * Instance globals.
		 */
		let previouslySelectedElement = {};

		/**
		 * Avoid reopening the popup.
		 */
		let isDrawerManuallyClosed = false;

		/**
		 * Instance default settings.
		 */
		const defaults = {
			namespace: config.toggleSelector,
			elementToFocus: null,
			focusInput: true,
			overlay: true,
			scrollLock: true,
			toggleTabIndex: true,
			changeAriaExpanded: true,
			closeAccordionsOnHide: true,
			overlayPlacement: document.body,
			hasFullWidth: false
		};

		/**
		 * Instance settings.
		 */
		const settings = extendDefaults(defaults, config);
		const namespace = settings.namespace;

		/**
		 * Node selectors.
		 */

		const selectors = {
			accordionContainer: ".js-accordion-container",
			quickViewPromotionBanner: ".js-quick-view-promotion-banner"
		};

		const nodeSelectors = {
			toggleSelector: [...document.querySelectorAll(`[data-js-toggle="${config.toggleSelector}"]`)],
			fullWidthSelector: [...document.querySelectorAll(`[data-js-full-width="${config.toggleSelector}"]`)]
		};

		/**
		 * Initiate component.
		 */
		function init() {
			setEventListeners();
			setEventBusListeners(config);
		}

		/**
		 * Set click events on toggle selectors.
		 */
		function setEventListeners() {
			nodeSelectors.toggleSelector.forEach((element) => {
				const target = document.getElementById(element.dataset.target);

				on("click", element, (event) => handleToggleEvent(event, target, element));

				if (settings.toggleTabIndex) {
					unsetTabIndexOnTarget(target);
				}
			});

			nodeSelectors.fullWidthSelector.forEach((element) => {
				const target = document.getElementById(element.dataset.target);

				on("click", element, (event) => handleToggleFullWidth(event, target));

				if (settings.toggleTabIndex) {
					unsetTabIndexOnTarget(target);
				}
			});

			if (binder.isSet()) {
				return;
			}

			on("keydown", (event) => onEscEvent(event));
			binder.set();
		}

		/**
		 * Set component listeners.
		 */
		function setEventBusListeners(config) {
			const eventBus = window.themeCore && window.themeCore.EventBus && window.themeCore.EventBus.all();
			const isEventListened = eventBus && eventBus[`Toggle:${namespace}:close`];

			if (isEventListened && config && config.once) {
				eventBus[`EscEvent:on`] && window.themeCore.EventBus.remove("EscEvent:on", eventBus[`EscEvent:on`].at(-1));
				eventBus[`Overlay:${namespace}:close`] && window.themeCore.EventBus.remove(`Overlay:${namespace}:close`, eventBus[`Overlay:${namespace}:close`].at(-1));
				eventBus[`Toggle:${namespace}:close`] && window.themeCore.EventBus.remove(`Toggle:${namespace}:close`, eventBus[`Toggle:${namespace}:close`].at(-1));
			}

			window.themeCore.EventBus.listen(["EscEvent:on", `Overlay:${namespace}:close`, `Toggle:${namespace}:close`], (response) => {
				if (typeof response !== "undefined" && response.selector) {
					closeToggleTarget(getTargetOfToggle(response.selector));
					return;
				}

				let quickViewPromotionBanner = document.querySelector(selectors.quickViewPromotionBanner);

				if (namespace === "quick-view" && quickViewPromotionBanner) {
					window.themeCore.EventBus.emit(`Quick-view:close`);
				}

				closeToggleTarget(getTargetOfToggle(namespace));
			});
		}

		/**
		 * Get toggle target from selector.
		 * @param {String} selector - The id of the toggle element.
		 * @returns {HTMLElement}
		 */
		function getTargetOfToggle(selector) {
			const toggleElement = document.querySelector(`[data-js-toggle="${selector}"]`);

			if (toggleElement) {
				return document.getElementById(toggleElement.dataset.target);
			}
		}

		/**
		 * Handle toggle events.
		 * @param {Event} event Click event.
		 * @param target
		 * @param toggler
		 */
		function handleToggleEvent(event, target, toggler) {
			event.preventDefault();
			if (toggler) {
				config.previouslySelectedElement = toggler;
			}
			toggle(target);
		}

		/**
		 * Handle toggle full width events.
		 * @param {Event} event Click event.
		 * @param target
		 */
		function handleToggleFullWidth(event, target) {
			event.preventDefault();
			toggleFullWidth(target);
		}

		/**
		 * Toggle target component.
		 * @param {Object} target - The element target to toggle.
		 * @returns {Function}
		 */
		function toggle(target) {
			return isTargetActive(target) ? closeToggleTarget(target) : openToggleTarget(target);
		}

		/**
		 * Toggle full width target component.
		 * @param {Object} target - The element target to toggle.
		 * @returns {Function}
		 */
		function toggleFullWidth(target) {
			return isTargetFullWidth(target) ? disableFullWidthTarget(target) : enableFullWidthTarget(target);
		}

		/**
		 * Open target component and fire global open event.
		 * @param {Object} target - The element target to toggle.
		 */
		function openToggleTarget(target) {
			if (isDrawerManuallyClosed) {
				return;
			}

			target.classList.add(cssClasses.active);
			/* this class need to prevent bug with sticky header and focus events that scroll the page */
			document.body.classList.add("scroll-padding-0");

			if (settings.overlay) {
				overlay({
					namespace,
					overlayPlacement: settings.overlayPlacement
				}).open();
			}

			if (settings.scrollLock) {
				document.body.style.overflow = "hidden";
			}

			window.themeCore.EventBus.emit(`Toggle:${namespace}:open`, target);

			focusTarget(target, settings.elementToFocus);

			if (settings.toggleTabIndex) {
				setTabIndexOnTarget(target);
			}

			if (settings.changeAriaExpanded) {
				let togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];

				togglers.forEach((toggler) => {
					setAriaExpanded(toggler);
				});
			}

			binder.set();
		}

		/**
		 * Close target component and fire global close event.
		 * @param {Object} target - The element target to toggle.
		 */
		function closeToggleTarget(target) {
			if (!target || !isTargetActive(target)) {
				return;
			}

			isDrawerManuallyClosed = true;
			target.classList.remove(cssClasses.active);

			setTimeout(function () {
				document.body.classList.remove("scroll-padding-0");
			}, 400);

			if (settings.overlay) {
				overlay({ namespace }).close();
			}

			if (settings.scrollLock) {
				document.body.style.overflow = null;
			}

			window.themeCore.EventBus.emit(`Toggle:${namespace}:close`, target);
			removeFocusTarget();

			if (settings.toggleTabIndex) {
				unsetTabIndexOnTarget(target);
			}

			if (settings.changeAriaExpanded) {
				let togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];

				togglers.forEach((toggler) => {
					removeAriaExpanded(toggler);
				});
			}

			if (settings.hasFullWidth && isTargetFullWidth(target)) {
				disableFullWidthTarget(target);
			}

			if (settings.closeAccordionsOnHide) {
				window.themeCore.Accordion.collapseAllItems(`#${target.id} ${selectors.accordionContainer}`);
			}

			binder.remove();

			const once = target.dataset.modalOnce;

			if (once) {
				target.remove();
			}

			setTimeout(function () {
				isDrawerManuallyClosed = false;
			}, 700);
		}

		/**
		 * Expand a full screen drawer
		 * @param {Object} target - The element target to toggle.
		 */
		function enableFullWidthTarget(target) {
			target.classList.add(cssClasses.full);
		}

		/**
		 * Collapse a full screen drawer
		 * @param {Object} target - The element target to toggle.
		 */
		function disableFullWidthTarget(target) {
			target.classList.remove(cssClasses.full);
		}

		/**
		 * Check if target is active.
		 * @param {Object} target - The element target to toggle.
		 * @returns {Boolean}
		 */
		function isTargetActive(target) {
			return target.classList.contains(cssClasses.active);
		}

		/**
		 * Check if target is full width.
		 * @param {Object} target - The element target to toggle.
		 * @returns {Boolean}
		 */
		function isTargetFullWidth(target) {
			return target.classList.contains(cssClasses.full);
		}

		/**
		 * Set a11y focus on first target.
		 * @param {Object} target - The element target to toggle.
		 * @param elementToFocus - The element to initial focus
		 */
		function focusTarget(target, elementToFocus) {
			if (!target) {
				return;
			}

			/**
			 * Accessibility helpers to keep track of focused and focusable elements.
			 */
			previouslySelectedElement = config.previouslySelectedElement || document.activeElement;
			const focusableElements = focusable(target, settings);

			// May be fix bug on filter drawer when filters is clicked then drawer scrolls up.
			// elementToFocus = elementToFocus || focusableElements[0];

			trapFocus(target, { elementToFocus: focusableElements[0] });
			elementToFocus && setTimeout(() => elementToFocus.focus(), 50);
		}

		/**
		 * Remove a11y focus on target.
		 */
		function removeFocusTarget() {
			if (isElement(previouslySelectedElement)) {
				const options = {
					preventScroll: true
				};

				window.setTimeout(() => previouslySelectedElement.focus(options), 0);
			}

			removeTrapFocus();
		}

		/**
		 * Set aria-expanded to true.
		 * @param {HTMLElement} toggler - Toggler element.
		 */
		function setAriaExpanded(toggler) {
			toggler.setAttribute("aria-expanded", true);
		}

		/**
		 * Set aria-expanded to false.
		 * @param {HTMLElement} toggler - Toggler element.
		 */
		function removeAriaExpanded(toggler) {
			toggler.setAttribute("aria-expanded", false);
		}

		/**
		 * Set tabindex to 0 on target focusables to make them un-tabbable.
		 * @param {String} target - Target element.
		 */
		function unsetTabIndexOnTarget(target) {
			focusable(target, settings).forEach((element) => {
				if (!element.closest(".js-accordion-inner")) {
					element.setAttribute("tabindex", -1);
				}
			});
		}

		/**
		 * Unset tabindex on target focusables to 1 to make them tabbable.
		 * @param {String} target - Target element.
		 */
		function setTabIndexOnTarget(target) {
			focusable(target, settings).forEach((element) => {
				if (!element.closest(".js-accordion-inner")) {
					element.setAttribute("tabindex", 0);
				}
			});
		}

		/**
		 * Set Esc keyboard event.
		 * @param {Event} event - Key code event set on document.
		 */
		function onEscEvent(event) {
			if (!isKeyPressIsEsc(event) || !binder.isSet()) {
				return;
			}

			window.themeCore.EventBus.emit("EscEvent:on");
			binder.remove();
		}

		/**
		 * Check if Esc key has been pressed.
		 * @param {Event} event - Keyboard event passed from user input on document.
		 * @returns {Boolean}
		 */
		function isKeyPressIsEsc(event) {
			return event.keyCode === 27;
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init,
			open: openToggleTarget,
			close: closeToggleTarget
		});
	};

	var Timer = (timerContainer) => {
		const classes = window.themeCore.utils.cssClasses;

		const selectors = {
			settings: ".js-timer-settings",
			daysHundreds: ".js-timer-days-hundreds",
			daysDozens: ".js-timer-days-dozens",
			daysUnits: ".js-timer-days-units",
			hoursDozens: ".js-timer-hours-dozens",
			hoursUnits: ".js-timer-hours-units",
			minutesDozens: ".js-timer-minutes-dozens",
			minutesUnits: ".js-timer-minutes-units",
			secondsDozens: ".js-timer-seconds-dozens",
			secondsUnits: ".js-timer-seconds-units"
		};

		const DATE_VALUES = {
			day: 1000 * 60 * 60 * 24,
			hour: 1000 * 60 * 60,
			minute: 1000 * 60,
			second: 1000
		};

		const settings = getSettings();

		let nodes = {};

		function getSettings() {
			try {
				return JSON.parse(timerContainer.querySelector(selectors.settings).textContent);
			} catch {
				return null;
			}
		}

		function getNodes() {
			return {
				daysHundreds: timerContainer.querySelector(selectors.daysHundreds),
				daysDozens: timerContainer.querySelector(selectors.daysDozens),
				daysUnits: timerContainer.querySelector(selectors.daysUnits),
				hoursDozens: timerContainer.querySelector(selectors.hoursDozens),
				hoursUnits: timerContainer.querySelector(selectors.hoursUnits),
				minuteDozens: timerContainer.querySelector(selectors.minutesDozens),
				minuteUnits: timerContainer.querySelector(selectors.minutesUnits),
				secondsDozens: timerContainer.querySelector(selectors.secondsDozens),
				secondsUnits: timerContainer.querySelector(selectors.secondsUnits)
			};
		}

		function setCountDownTimer({ year, month, day, hour, minutes, timezone }) {
			const timezoneDifference = Number(timezone);
			const finalHour = +hour - timezoneDifference;

			const countDownDate = new Date(Date.UTC(year, month, day, finalHour, minutes || 0));

			const interval = setInterval(() => {
				timerTick(countDownDate, interval);
			}, DATE_VALUES.second);
		}

		function timerTick(countDownDate, interval) {
			const now = new Date().getTime();
			const distance = countDownDate - now;

			if (distance <= 0) {
				clearInterval(interval);
				return;
			}

			const dateToInner = getDateToInner(distance);
			changeTimerMarkup(dateToInner);
		}

		function getDateToInner(distance) {
			const days = Math.floor(distance / DATE_VALUES.day);
			const hours = Math.floor((distance % DATE_VALUES.day) / DATE_VALUES.hour);
			const minutes = Math.floor((distance % DATE_VALUES.hour) / DATE_VALUES.minute);
			const seconds = Math.floor((distance % DATE_VALUES.minute) / DATE_VALUES.second);

			return getDateAsTimer(days, hours, minutes, seconds);
		}

		function getDateAsTimer(days, hours, minutes, seconds) {
			return {
				daysHundreds: days > 99 ? Math.floor(days / 100) : 0,
				daysDozens: days > 99 ? Math.floor((days % 100) / 10) : Math.floor(days / 10),
				daysUnits: days % 10,
				hoursDozens: Math.floor(hours / 10),
				hoursUnits: hours % 10,
				minutesDozens: Math.floor(minutes / 10),
				minutesUnits: minutes % 10,
				secondsDozens: Math.floor(seconds / 10),
				secondsUnits: seconds % 10
			};
		}

		function changeTimerMarkup(dateToRender) {
			if (dateToRender.daysHundreds > 0) {
				nodes.daysHundreds.classList.contains(classes.hidden) && nodes.daysHundreds.classList.remove(classes.hidden);
				nodes.daysHundreds.innerHTML = dateToRender.daysHundreds;
			} else {
				!nodes.daysHundreds.classList.contains(classes.hidden) && nodes.daysHundreds.classList.add(classes.hidden);
			}

			nodes.daysDozens.innerHTML = dateToRender.daysDozens;
			nodes.daysUnits.innerHTML = dateToRender.daysUnits;
			nodes.hoursDozens.innerHTML = dateToRender.hoursDozens;
			nodes.hoursUnits.innerHTML = dateToRender.hoursUnits;
			nodes.minuteDozens.innerHTML = dateToRender.minutesDozens;
			nodes.minuteUnits.innerHTML = dateToRender.minutesUnits;
			nodes.secondsDozens.innerHTML = dateToRender.secondsDozens;
			nodes.secondsUnits.innerHTML = dateToRender.secondsUnits;
		}

		function init() {
			if (settings) {
				nodes = getNodes();
				setCountDownTimer(settings);
			}
		}

		return Object.freeze({
			init
		});
	};

	var ProductCountDownTimer = () => {
		let Timer;

		const selectors = {
			block: ".js-product-countdown-timer",
			timer: ".js-timer"
		};

		async function init() {
			Timer = window.themeCore.utils.Timer;

			window.themeCore.EventBus.listen(`product:count-down-timer-reinit`, reinitBlocks);
			reinitBlocks();
		}

		function reinitBlocks() {
			const blocks = [...document.querySelectorAll(selectors.block)];
			blocks.forEach((block) => {
				const timer = block.querySelector(selectors.timer);
				Timer(timer).init();
			});
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Helper: CSS classes
	 * -----------------------------------------------------------------------------
	 * Global configuration for css classes.
	 * - Used to provide consistency and keep DRY for our toggle classes.
	 */
	var cssClasses = {
		active: "is-active",
		childActive: "is-child-active",
		grandChildActive: "is-grand-child-active",
		added: "is-added",
		collapsed: "is-collapsed",
		disabled: "is-disabled",
		hidden: "is-hidden",
		lazyload: "lazyload",
		lazyloaded: "lazyloaded",
		loading: "is-loading",
		removing: "is-removing",
		sticky: "is-sticky",
		tabbable: "is-tabbable",
		transparent: "is-transparent",
		full: "is-full",
		current: "is-current",
		error: "error",
		hover: "is-hover",
		clone: "clone",
		designAlternate: "design-alternate"
	};

	/**
	 * Helper: Utils
	 * ------------------------------------------------------------------------------
	 * Frame utility functions.
	 *
	 * @namespace utils
	 */

	/**
	 * Check if array contains all elements of another array
	 * @param array1
	 * @param array2
	 * @returns {Boolean}
	 */
	function arrayIncludes(array1, array2) {
		return array2.every((v) => array1.includes(v));
	}

	/**
	 * Combine two objects using properties as the override.
	 * @param {Object} defaults - Defaults options defined in script.
	 * @param {Object} properties - Options defined by user.
	 * @returns {Object} - Defaults modified options.
	 */
	function extendDefaults(defaults, properties) {
		if (!defaults || !properties) {
			throw new Error("Invalid number of arguments, expected 2 ");
		}
		for (const property in properties) {
			if (property !== "undefined" && typeof properties[property] !== "undefined") {
				defaults[property] = properties[property];
			}
		}

		return defaults;
	}

	/**
	 * Retrieves input data from a form.
	 * @param {HTMLElement} form - HTML form elements.
	 * @returns {Object} - Form data as an object literal.
	 */
	function formToJSON(form) {
		const formData = new FormData(form);
		return Object.fromEntries(formData.entries());
	}

	/**
	 * Convert a FormData object into a plain object.
	 * @param {FormData} data - The form to serialize.
	 * @returns {Object}
	 */
	function convertFormData(data) {
		let obj = {};
		for (let [key, value] of data) {
			if (obj[key] !== undefined) {
				if (!Array.isArray(obj[key])) {
					obj[key] = [obj[key]];
				}
				obj[key].push(value);
			} else {
				obj[key] = value;
			}
		}
		return obj;
	}

	/**
	 * Shortcut function to add an event listener.
	 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com.
	 * @param {String} event -The event type.
	 * @param {Node} element - The element to attach the event to (optional, defaults to window).
	 * @param {Function} callback - The callback to run on the event.
	 * @param {Boolean} capture - If true, forces bubbling on non-bubbling events.
	 */
	function on$1(event, element = window, callback, capture = false) {
		/**
		 * If only a string is passed into the element parameter.
		 */
		if (typeof element === "string") {
			document.querySelector(element).addEventListener(event, callback, capture);
			return;
		}

		/**
		 * If an element is not defined in parameters, then shift callback across.
		 */
		if (typeof element === "function") {
			window.addEventListener(event, element);
			return;
		}

		/**
		 * Default listener.
		 */
		element.addEventListener(event, callback, capture);
	}

	/**
	 * Remove an event listener.
	 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com.
	 * @param {String} event - The event type.
	 * @param {Node} element - The element to remove the event to (optional, defaults to window).
	 * @param {Function} callback - The callback that ran on the event.
	 * @param {Boolean} capture - If true, forces bubbling on non-bubbling events.
	 */
	function off$1(event, element = window, callback, capture = false) {
		/**
		 * If only a string is passed into the element parameter.
		 */
		if (typeof element === "string") {
			document.querySelector(element).removeEventListener(event, callback, capture);
			return;
		}

		/**
		 * If an element is not defined in parameters, then shift callback across.
		 */
		if (typeof element === "function") {
			window.removeEventListener(event, element);
			return;
		}

		/**
		 * Default listener.
		 */
		element.removeEventListener(event, callback, capture);
	}

	/**
	 * Check if object is a HTMLElement.
	 * @param {Object} element - HTML element to check.
	 * @returns {HTMLElement}
	 */
	function isElement(element) {
		return element instanceof window.Element || element instanceof window.HTMLDocument;
	}

	/**
	 * Checks if an element is within viewport and visible boundary.
	 * @param {HTMLElement} viewport - Viewport container.
	 * @param {HTMLElement} element - Element to check.
	 * @param {Integer} bounce - bounce.
	 * @returns {Boolean}
	 */
	function isElementInViewport(viewport, element, bounce = 0) {
		const viewPortBounding = viewport.getBoundingClientRect();
		const elementBounding = element.getBoundingClientRect();

		const viewPortPosition = viewPortBounding.left + viewPortBounding.width;
		const elementPortPosition = elementBounding.left + elementBounding.width;
		const viewPortPositionBottom = viewPortBounding.top + viewPortBounding.height;
		const elementPortPositionBottom = elementBounding.top + elementBounding.height;

		const isElementBoundLeft = () => Math.ceil(elementBounding.left) + bounce >= viewPortBounding.left;
		const isElementBoundRight = () => viewPortPosition + bounce >= elementPortPosition;
		const isElementBoundTop = () => Math.ceil(elementBounding.top) + bounce >= viewPortBounding.top;
		const isElementBoundBottom = () => viewPortPositionBottom + bounce >= elementPortPositionBottom;

		return isElementBoundLeft() && isElementBoundRight() && isElementBoundTop() && isElementBoundBottom();
	}

	/**
	 * Returns a function, that, as long as it continues to be invoked,
	 * will not be triggered. The function will be called after it stops
	 * being called for N milliseconds. If `immediate` is passed, trigger
	 * the function on the leading edge, instead of the trailing.
	 *
	 * @param {Function} callback - The function to execute when timer is passed.
	 * @param {Number} wait - The amount of time before debounce call is triggered.
	 * @param {Boolean} immediate - Trigger the immediately.
	 */
	function throttle(callback, wait, immediate = false) {
		let timeout = null;
		let initialCall = true;

		return function (...args) {
			const callNow = immediate && initialCall;

			function next() {
				callback.apply(this, args);
				timeout = null;
			}

			if (callNow) {
				initialCall = false;
				next();
			}

			if (!timeout) {
				timeout = window.setTimeout(next, wait);
			}
		};
	}

	/**
	 * Debounce functions for better performance
	 * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
	 * @param {Function} callback The function to debounce.
	 * @param {Number} wait - The amount of time before debounce call is triggered.
	 * @param {Boolean} immediate - Trigger the immediately.
	 */
	function debounce(callback, wait, immediate) {
		let timeout = null;

		return function (...args) {
			const later = function () {
				timeout = null;
				if (!immediate) {
					callback.apply(this, args);
				}
			};

			const callNow = immediate && !timeout;
			window.clearTimeout(timeout);
			timeout = window.setTimeout(later, wait);

			if (callNow) {
				callback.apply(this, args);
			}
		};
	}

	function parseJSONfromMarkup(node) {
		if (!node || !node.textContent) {
			return null;
		}

		try {
			return JSON.parse(node.textContent);
		} catch {
			return null;
		}
	}

	function handleTabulationOnSlides(slides, activeSlide, selector) {
		slides.forEach((slide) => {
			const elements = slide.querySelectorAll(selector);

			if (!elements.length) {
				return;
			}

			if (slide === activeSlide) {
				elements.forEach((element) => element.setAttribute("tabindex", 0));
				slide.setAttribute("aria-hidden", false);
				return;
			}

			elements.forEach((element) => element.setAttribute("tabindex", -1));
			slide.setAttribute("aria-hidden", true);
		});
	}

	/**
	 * A11y Helpers
	 * -----------------------------------------------------------------------------
	 * A collection of useful functions that help make your theme more accessible
	 */

	/**
	 * Moves focus to an HTML element
	 * eg for In-page links, after scroll, focus shifts to content area so that
	 * next `tab` is where user expects. Used in bindInPageLinks()
	 * eg move focus to a modal that is opened. Used in trapFocus()
	 *
	 * @param {Element} container - Container DOM element to trap focus inside of
	 * @param {Object} options - Settings unique to your theme
	 * @param {string} options.className - Class name to apply to element on focus.
	 */
	function forceFocus(element, options) {
		options = options || {};

		let savedTabIndex = element.tabIndex;

		element.tabIndex = -1;
		element.dataset.tabIndex = savedTabIndex;
		element.focus();
		if (typeof options.className !== "undefined") {
			element.classList.add(options.className);
		}
		element.addEventListener("blur", callback);

		function callback(event) {
			event.target.removeEventListener(event.type, callback);

			element.tabIndex = savedTabIndex;
			delete element.dataset.tabIndex;
			if (typeof options.className !== "undefined") {
				element.classList.remove(options.className);
			}
		}
	}

	function focusable$1(container) {
		let elements = Array.prototype.slice.call(
			container.querySelectorAll(
				"[tabindex]," + "[draggable]," + "a[href]," + "area," + "button:enabled," + "input:not([type=hidden]):enabled," + "object," + "select:enabled," + "textarea:enabled"
			)
		);

		// Filter out elements that are not visible.
		return elements.filter(function (element) {
			return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
		});
	}

	/**
	 * Traps the focus in a particular container
	 *
	 * @param {Element} container - Container DOM element to trap focus inside of
	 * @param {Element} elementToFocus - Element to be focused on first
	 * @param {Object} options - Settings unique to your theme
	 * @param {string} options.className - Class name to apply to element on focus.
	 */

	let trapFocusHandlers = {};

	function trapFocus(container, options) {
		options = options || {};
		let elements = focusable$1(container);
		let elementToFocus = options.elementToFocus || container;
		let first = elements[0];
		let last = elements[elements.length - 1];

		removeTrapFocus();

		trapFocusHandlers.focusin = function (event) {
			elements = focusable$1(container);
			first = elements[0];
			last = elements[elements.length - 1];

			if (container !== event.target && !container.contains(event.target) && !event.target.contains(container)) {
				first.focus();
			}

			if (event.target !== container && event.target !== last && event.target !== first) return;
			document.addEventListener("keydown", trapFocusHandlers.keydown);
		};

		trapFocusHandlers.focusout = function () {
			document.removeEventListener("keydown", trapFocusHandlers.keydown);
		};

		trapFocusHandlers.keydown = function (event) {
			if (event.keyCode !== 9) return; // If not TAB key

			// On the last focusable element and tab forward, focus the first element.
			if (event.target === last && !event.shiftKey) {
				event.preventDefault();
				first.focus();
			}

			//  On the first focusable element and tab backward, focus the last element.
			if ((event.target === container || event.target === first) && event.shiftKey) {
				event.preventDefault();
				last.focus();
			}
		};

		document.addEventListener("focusout", trapFocusHandlers.focusout);
		document.addEventListener("focusin", trapFocusHandlers.focusin);

		forceFocus(elementToFocus, options);
	}

	/**
	 * Removes the trap of focus from the page
	 */
	function removeTrapFocus() {
		document.removeEventListener("focusin", trapFocusHandlers.focusin);
		document.removeEventListener("focusout", trapFocusHandlers.focusout);
		document.removeEventListener("keydown", trapFocusHandlers.keydown);
	}

	function transformLineItemProps(initialObject) {
		const transformedObject = {};

		for (const [key, value] of Object.entries(initialObject)) {
			if (key.startsWith("properties[")) {
				let isEmptyArray = false;

				if (typeof value === "object") {
					isEmptyArray = value.every((item) => !item.length);
				}

				if (value && !isEmptyArray) {
					const nestedKey = key.split("[")[1].split("]")[0];
					if (!transformedObject["properties"]) {
						transformedObject["properties"] = {};
					}

					transformedObject["properties"][nestedKey] = value;
				}
			} else {
				transformedObject[key] = value;
			}
		}

		return transformedObject;
	}

	/**
	 * Mixin: Overlay
	 * -----------------------------------------------------------------------------
	 * A simple mixin to toggle window overlay with escape events.
	 *
	 * @namespace Overlay
	 */

	/**
	 * Export overlay module as default.
	 * @param {Object} config - Configuration.
	 */
	var overlay = (config) => {
		/**
		 * Instance default settings.
		 */
		const defaults = {
			namespace: "overlay",
			container: "window-overlay",
			overlayPlacement: document.body
		};

		/**
		 * Instance settings.
		 */
		const settings = extendDefaults(defaults, config || defaults);

		/**
		 * Check and set dependencies
		 */
		window.themeCore = window.themeCore || {};
		window.themeCore.EventBus = window.themeCore.EventBus || EventBus();

		/**
		 * Construct window overlay element on DOM.
		 * @param {boolean} isLoader - Enable overlay.
		 */
		function constructOverlay(isLoader) {
			const element = document.createElement("div");
			element.classList.add(settings.container);
			element.setAttribute("data-js-overlay", settings.namespace);
			element.setAttribute("data-js-window", "overlay");

			if (isLoader) {
				const loader = document.createElement("div");
				loader.classList.add("loader");
				element.append(loader);
			}

			return element;
		}

		/**
		 * Get window overlay element.
		 * @param {String} namespace - The overlay namespace to find.
		 */
		function getOverlay(namespace) {
			if (namespace) {
				return document.querySelector(`[data-js-overlay="${namespace}"]`);
			}

			return document.querySelector(`[data-js-window="overlay"]`);
		}

		/**
		 * Update window overlay element if it already exists.
		 */
		function updateOverlay() {
			const overlay = document.querySelector(`[data-js-window="overlay"]`);
			const currentOverlay = overlay.getAttribute("data-js-overlay");

			if (currentOverlay !== settings.namespace) {
				overlay.setAttribute("data-js-overlay", settings.namespace);
				window.themeCore.EventBus.emit(`Toggle:${currentOverlay}:close`);
				setCloseEvents();
				return true;
			}

			return true;
		}

		/**
		 * Open overlay and set esc events.
		 * @param {boolean} isLoader - Enable overlay.
		 */
		function open(isLoader) {
			if (getOverlay()) {
				updateOverlay();
				return;
			}

			render(isLoader);
			setCloseEvents();
		}

		/**
		 * Hide overlay and remove esc event.
		 */
		function close() {
			if (!getOverlay()) {
				return;
			}

			remove();
		}

		/**
		 * Render overlay after constructing DOM element
		 * @param {boolean} isOverlay - Enable overlay.
		 */
		function render(isOverlay) {
			const windowOverlay = constructOverlay(isOverlay);
			settings.overlayPlacement.appendChild(windowOverlay);

			/**
			 * Dirty way to avoid MutationObserver by using an instant timeout.
			 */
			window.setTimeout(() => windowOverlay.classList.add(cssClasses.active), 1);
			window.themeCore.EventBus.emit(`Overlay:${settings.namespace}:open`);
		}

		/**
		 * Remove overlay from DOM after transitioning out.
		 */
		function remove() {
			on$1("transitionend", getOverlay(), () => {
				if (getOverlay()) {
					getOverlay().remove();
				}
			});

			/**
			 * Only close overlay if toggle namespace overlay exists.
			 */
			if (getOverlay(settings.namespace)) {
				getOverlay(settings.namespace).classList.remove(cssClasses.active);
			}
		}

		/**
		 * Set close events.
		 */
		function setCloseEvents() {
			on$1("click", getOverlay(settings.namespace), () => handleClickEvent());
		}

		document.addEventListener("shopify:section:load", () => {
			on$1("click", getOverlay(settings.namespace), () => handleClickEvent());
		});

		/**
		 * Handle click event on overlay.
		 */
		function handleClickEvent() {
			window.themeCore.EventBus.emit(`Overlay:${settings.namespace}:close`, {
				selector: settings.namespace,
				target: document.getElementById(settings.namespace)
			});

			close();
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			open,
			close
		});
	};

	/**
	 * Image Helper Functions
	 * -----------------------------------------------------------------------------
	 * A collection of functions that help with basic image operations.
	 *
	 */

	function images$1 () {
		function generateSrc(src, size) {
			if (!src || !size) {
				return;
			}

			if (!src.includes("https:") && !src.includes("http:")) {
				src = "https:" + src;
			}

			const url = new URL(src);
			url.searchParams.set("width", size);

			return url.toString();
		}

		function generateSrcset(src, size) {
			if (!src || !size) {
				return;
			}

			return generateSrc(src, size) + " 1x, " + generateSrc(src, size * 2) + " 2x";
		}

		return {
			generateSrcset,
			generateSrc
		};
	}

	/**
	 * Component: Quantity widget
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace QuantityWidget
	 */

	const DEFAULT_WIDGET_CONFIG = {
		isDisabledInput: false,
		isReadOnly: false,
		onQuantityChange: () => {},
		onIncrease: () => {},
		onDecrease: () => {},
		onQuantityZero: () => {}
	};

	const selectors$1 = {
		input: "[data-quantity-input]",
		decrease: "[data-quantity-decrease]",
		increase: "[data-quantity-increase]"
	};

	const attributes = {
		readonly: "readonly",
		disabled: "disabled",
		min: "min",
		max: "max",
		step: "step"
	};

	var QuantityWidget = (item, widgetConfig = {}) => {
		const classes = window.themeCore.utils.cssClasses;
		const on = window.themeCore.utils.on;

		if (!item) {
			throw new Error(`Quantity Widget::Error::Required parameter 'item' missing!`);
		}

		const config = {
			...DEFAULT_WIDGET_CONFIG,
			...widgetConfig
		};

		const quantity = {
			value: null,
			minValue: null,
			maxValue: null,
			step: null,
			previewsValue: null,
			initialValue: null
		};

		const controls = {
			input: null,
			decreaseBtn: null,
			increaseBtn: null
		};

		let widget = {};

		function init() {
			controls.input = item.querySelector(selectors$1.input);
			controls.decreaseBtn = item.querySelector(selectors$1.decrease);
			controls.increaseBtn = item.querySelector(selectors$1.increase);

			if (!controls.input || !controls.decreaseBtn || !controls.increaseBtn) {
				return null;
			}

			const elMin = Number(controls.input.getAttribute(attributes.min));
			const elMax = Number(controls.input.getAttribute(attributes.max));
			const elStep = Number(controls.input.getAttribute(attributes.step));

			quantity.value = Number(controls.input.value || 0);
			quantity.minValue = elMin > 0 ? elMin : 0;
			quantity.maxValue = elMax > 0 ? elMax : Infinity;
			quantity.step = elStep || 1;
			quantity.initialValue = quantity.value;
			quantity.previewsValue = quantity.initialValue;

			if (config.isReadOnly || config.isDisabledInput) {
				controls.input.setAttribute(attributes.readonly, "");
			}

			if (config.isReadOnly) {
				controls.decreaseBtn.setAttribute(attributes.disabled, "");
				controls.increaseBtn.setAttribute(attributes.disabled, "");
				controls.increaseBtn.classList.add(classes.disabled);
				controls.decreaseBtn.classList.add(classes.disabled);
			} else {
				if (quantity.value === quantity.minValue) {
					controls.decreaseBtn.setAttribute(attributes.disabled, "");
					controls.decreaseBtn.classList.add(classes.disabled);
				}

				if (quantity.value === quantity.maxValue) {
					controls.increaseBtn.setAttribute(attributes.disabled, "");
					controls.increaseBtn.classList.add(classes.disabled);
				}

				initEventListeners();
			}

			widget = {
				widget: item,
				controls: controls,
				config: config,
				quantity: quantity,
				increase,
				decrease,
				setValue,
				setMin,
				setMax,
				setIncrement,
				toggleIncrease,
				toggleDecrease,
				rollbackValue,
				dispatch
			};

			return widget;
		}

		function initEventListeners() {
			on("click", item, onChangeQuantityClick);

			if (!config.isDisabledInput) {
				on("change", controls.input, onQuantityInput);
			}
		}

		function decrease() {
			resetDisabled();

			quantity.previewsValue = quantity.value;

			if (quantity.value > quantity.minValue) {
				// quantity.value--;
				let newVal = quantity.value - Number(quantity.step);

				if (newVal % quantity.step) {
					newVal = Math.max(newVal - (newVal % quantity.step), quantity.minValue);
				}
				quantity.value = newVal;
			} else {
				quantity.value = quantity.minValue;
				controls.decreaseBtn.setAttribute(attributes.disabled, "");
				controls.decreaseBtn.classList.add(classes.disabled);
			}

			setInputValue(quantity.value);

			return quantity.value;
		}

		function increase() {
			resetDisabled();

			quantity.previewsValue = quantity.value;

			if (quantity.maxValue && quantity.value >= quantity.maxValue) {
				quantity.value = quantity.maxValue;
				controls.increaseBtn.setAttribute(attributes.disabled, "");
				controls.increaseBtn.classList.add(classes.disabled);
			} else {
				let newVal = Number(quantity.value) + Number(quantity.step);

				if (newVal % quantity.step) {
					newVal = newVal - (newVal % quantity.step);
				}
				quantity.value = newVal;
			}

			setInputValue(quantity.value);

			return quantity.value;
		}

		function resetDisabled() {
			if (config.isReadOnly) {
				return;
			}

			controls.increaseBtn.removeAttribute(attributes.disabled);
			controls.decreaseBtn.removeAttribute(attributes.disabled);
			controls.increaseBtn.classList.remove(classes.disabled);
			controls.decreaseBtn.classList.remove(classes.disabled);
		}

		function setValue(value) {
			let newValue = value;
			if (quantity.maxValue && value >= quantity.maxValue) {
				newValue = quantity.maxValue;
			}

			if (value < quantity.minValue) {
				newValue = quantity.minValue;
			}

			if (newValue % quantity.step) {
				newValue = newValue - (newValue % quantity.step);
			}

			quantity.previewsValue = quantity.value;
			quantity.value = newValue;

			setInputValue(quantity.value);

			return quantity.value;
		}

		function setMin(value) {
			controls.input.setAttribute("min", value);
			quantity.minValue = value;

			if (quantity.value < value) {
				setValue(value);
			}
		}

		function setMax(value) {
			controls.input.setAttribute("max", value);
			quantity.maxValue = value || Infinity;

			if (quantity.value > (value || Infinity)) {
				setValue(value);
			}
		}

		function setIncrement(value) {
			controls.input.setAttribute("step", value);
			quantity.step = value;

			if (quantity.value % value) {
				setValue(quantity.value - (quantity.value % value));
			}
		}

		function rollbackValue() {
			if (!quantity.previewsValue) {
				return;
			}

			const prev = quantity.previewsValue;
			quantity.value = prev;

			setInputValue(quantity.value);

			return quantity.value;
		}

		function setInputValue(value) {
			controls.input.value = value;
		}

		function toggleIncrease() {
			controls.increaseBtn.classList.toggle(classes.disabled, quantity.value >= quantity.maxValue);

			controls.increaseBtn.toggleAttribute("disabled", quantity.value >= quantity.maxValue);
		}

		function toggleDecrease() {
			controls.decreaseBtn.classList.toggle(classes.disabled, quantity.value <= quantity.minValue && quantity.minValue !== null);

			controls.decreaseBtn.toggleAttribute("disabled", quantity.value <= quantity.minValue && quantity.minValue !== null);
		}

		function dispatch() {
			if (config.onQuantityChange && typeof config.onQuantityChange === "function") {
				config.onQuantityChange(widget);
			}

			if (quantity.value === 0 && config.onQuantityZero && typeof config.onQuantityZero === "function") {
				config.onQuantityZero(widget);
			}
		}

		function onChangeQuantityClick(event) {
			const isIncrease = event.target.closest(selectors$1.increase);
			const isDecrease = event.target.closest(selectors$1.decrease);

			if (!isIncrease && !isDecrease) {
				return;
			}

			event.preventDefault();

			if (isDecrease) {
				decrease();
				if (config.onDecrease && typeof config.onDecrease === "function") {
					config.onDecrease(widget);
				}
			}

			if (isIncrease) {
				increase();
				if (config.onIncrease && typeof config.onIncrease === "function") {
					config.onIncrease(widget);
				}
			}

			toggleIncrease();
			toggleDecrease();
			controls.input.dispatchEvent(new Event("change", { bubbles: true }));
		}

		function onQuantityInput(event) {
			quantity.value = Number(event.target.value || 0);

			if (quantity.maxValue < quantity.value && quantity.maxValue !== null) {
				quantity.previewsValue = quantity.value;
				quantity.value = quantity.maxValue;
			}

			if (quantity.minValue > quantity.value) {
				quantity.previewsValue = quantity.value;
				quantity.value = quantity.minValue;
			}

			if (quantity.value % quantity.step) {
				quantity.previewsValue = quantity.value;
				quantity.value = quantity.value - (quantity.value % quantity.step);
			}

			setInputValue(quantity.value);
			toggleIncrease();
			toggleDecrease();
			dispatch();
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Component: Upsell slider
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace UpsellSlider
	 */
	const DEFAULT_SWIPER_SETTINGS = {
		grabCursor: true,
		slidesPerView: 4,
		slidesPerGroup: 4,
		navigation: {
			nextEl: ".js-upsell-slider-next",
			prevEl: ".js-upsell-slider-prev"
		}
	};

	const ALTERNATE_SWIPER_SETTINGS = {
		grabCursor: true,
		slidesPerView: "auto",
		slidesPerGroup: 1,
		navigation: {
			nextEl: ".js-upsell-slider-next",
			prevEl: ".js-upsell-slider-prev"
		},
		watchOverflow: true
	};

	var UpsellSlider = (section) => {
		const updateTabindexOnElement = window.themeCore.utils.updateTabindexOnElement;
		const Swiper = window.themeCore.utils.Swiper;

		const selectors = {
			slider: ".js-upsell-slider",
			sliderControls: ".js-upsell-slider-controls",
			slide: ".swiper-slide",
			scrollableWrapper: ".js-upsell-scrollable-wrapper",
			tabulableElements: "a, button, input, select"
		};

		const classes = {
			hidden: "is-hidden"
		};

		const attributes = {
			accessibilityHidden: "aria-hidden"
		};

		const breakpoints = {
			small: "(max-width: 991px)",
			afterSmallMobile: "(min-width: 375px)",
			afterSmall: "(min-width: 992px)"
		};

		const smallScreen = window.matchMedia(breakpoints.small);
		const afterSmallMobile = window.matchMedia(breakpoints.afterSmallMobile);
		const afterSmall = window.matchMedia(breakpoints.afterSmall);
		const mediaQueries = [afterSmallMobile, afterSmall];

		let container = null;
		let slider = null;
		let slides = null;
		let scrollableWrapper = null;
		let design = null;
		let sliderControls = null;

		function updateNavigation(swiperInstance) {
			if (window.innerWidth >= 992 && swiperInstance.slides.length <= 4) {
				sliderControls.classList.add(classes.hidden);
			} else if (window.innerWidth >= 375 && swiperInstance.slides.length <= 3) {
				sliderControls.classList.add(classes.hidden);
			} else {
				sliderControls.classList.remove(classes.hidden);
			}
		}

		function init() {
			if (!section) {
				return false;
			}

			container = section.querySelector(selectors.slider);
			sliderControls = section.querySelector(selectors.sliderControls);
			slides = [...section.querySelectorAll(selectors.slide)];

			if (!container) {
				return null;
			}

			design = container.dataset.designType;

			scrollableWrapper = section.querySelector(selectors.scrollableWrapper);

			if (!smallScreen.matches && design !== "alternate") {
				slider = initSwiper();
			} else if (design === "alternate") {
				slider = initSwiper(design);

				updateNavigation(slider);

				mediaQueries.map((mq) => {
					mq.addEventListener("change", () => {
						updateNavigation(slider);
					});
				});
			}

			if (design !== "alternate") {
				smallScreen.addEventListener("change", changeSliderStateOnBreakpoint);
			}

			return {
				slider: slider,
				container: container,
				slides: slides
			};
		}

		function initSwiper(design) {
			const settings = design === "alternate" ? ALTERNATE_SWIPER_SETTINGS : DEFAULT_SWIPER_SETTINGS;

			return new Swiper(container, settings);
		}

		function changeSliderStateOnBreakpoint(media) {
			if (!media.matches) {
				if (scrollableWrapper) {
					scrollableWrapper.scrollTo({ left: 0, behavior: "smooth" });
				}

				slider = initSwiper();
				return;
			}

			slider && slider.destroy();
			updateTabindexOnElement(section, 0);
			slides.forEach((slide) => slide.setAttribute(attributes.accessibilityHidden, false));
		}

		return Object.freeze({
			init
		});
	};

	var Preloder = (section) => {
		const globalClasses = window.themeCore.utils.cssClasses;
		const selectors = {
			preloader: ".js-preloader"
		};

		const PRELOADER_DELAY = 300;

		let isShowed = false;
		let preloader = null;

		function init() {
			if (!section || !(preloader = section.querySelector(selectors.preloader))) {
				return null;
			}

			return {
				el: preloader,
				isShowed: isShowed,
				show: show,
				hide: hide
			};
		}

		function show() {
			if (!preloader) {
				return;
			}

			preloader.classList.add(globalClasses.active);
		}

		function hide() {
			if (!preloader) {
				return;
			}

			setTimeout(() => {
				preloader.classList.remove(globalClasses.active);
			}, PRELOADER_DELAY);
		}

		return Object.freeze({
			init
		});
	};

	var ShareButton = () => {
		const selectors = {
			shareButton: ".js-social-share"
		};

		function init() {
			let shareButtons = document.querySelectorAll(selectors.shareButton);

			if (!shareButtons.length) {
				return;
			}

			shareButtons.forEach((button) => {
				button.addEventListener("click", function (e) {
					e.preventDefault();

					const shareTitle = button.getAttribute("data-share-title") || document.title;
					const shareURL = button.getAttribute("data-share-url") || document.location.href;

					if (navigator.share) {
						navigator.share({ url: shareURL, title: shareTitle });
					} else {
						const fallBackInputSelector = button.getAttribute("data-input-fallback");
						const inputCopyText = document.getElementById(fallBackInputSelector);
						const tooltip = button.querySelector(".js-share-tooltip");

						if (!inputCopyText) {
							return;
						}

						inputCopyText.select();
						inputCopyText.setSelectionRange(0, 99999); // For mobile devices

						navigator.clipboard.writeText(inputCopyText.value);

						if (tooltip) {
							button.classList.add("is-active");

							setTimeout(() => {
								button.classList.remove("is-active");
							}, 1500);
						}
					}
				});
			});
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Helpers: a11y
	 * ------------------------------------------------------------------------------
	 * Entry file for accessibility utility functions.
	 * - Focusables
	 * - Keyboard tabbable.
	 *
	 * @namespace frameA11y
	 */

	/**
	 * Get all focusable elements within targeted container.
	 * - Force included parameters defined in config.
	 * - Remove excluded elements defined in config.
	 * @param {Element} container - Required. Target container to get focusable elements from.
	 * @param {Object} config - Modifies the list of focusable elements
	 * @returns {Object}
	 */
	function focusable(container, config = {}) {
		if (!container) {
			throw new Error("Could not find container");
		}

		const defaults = [
			"[tabindex]:not([type=range])",
			"[draggable]",
			"a[href]",
			"area",
			"button:enabled",
			"input:not([type=range]):not([type=hidden]):enabled",
			"object",
			"select:enabled",
			"textarea:enabled"
		];

		/**
		 * Override default settings with component configuration.
		 */
		if (config && config.include && config.include.length) {
			config.include.forEach((selector) => defaults.push(selector));
		}

		const elements = [...container.querySelectorAll(defaults.join())];

		/**
		 * Return visible elements from the focusable items.
		 */
		const focusableElements = elements.filter((element) => {
			return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
		});

		/**
		 * Return un-excluded focusable elements.
		 */
		if (config && config.exclude && config.exclude.length) {
			const exclusionList = [...container.querySelectorAll(config.exclude.join())];

			return focusableElements.filter((element) => {
				return !exclusionList.includes(element);
			});
		}

		return focusableElements;
	}

	/**
	 * Set tabindex on focusable elements within target container.
	 * @param {Element} container - Target container to get focusable elements from.
	 * @param {Integer} tabindex - Tabindex value (Default: 0).
	 */
	function updateTabindexOnElement(container, tabindex = 0) {
		const focusableElements = focusable(container);

		focusableElements.forEach((element) => {
			element.setAttribute("tabindex", tabindex);
		});
	}

	/**
	 * Helper: SVG map
	 * -----------------------------------------------------------------------------
	 * Store for SVG icon paths to use in render functions.
	 * - Use SVGOMG to compress files.
	 * - Remove any inline fill colours.
	 * - Add closing tags to suppress warnings on HTML5 compatibility.
	 * - Add correct BEM class names.
	 */
	const arrowRight = `
	<svg class="icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path fill-rule="evenodd" clip-rule="evenodd" d="M9.36899 3.15909L12.8402 6.61591C13.0533 6.82804 13.0533 7.17196 12.8402 7.38409L9.36899 10.8409C9.15598 11.053 8.81061 11.053 8.5976 10.8409C8.38459 10.6288 8.38459 10.2848 8.5976 10.0727L11.1377 7.54318L1.54545 7.54319C1.24421 7.54319 1 7.29999 1 7C1 6.70001 1.24421 6.45681 1.54545 6.45681L11.1377 6.45681L8.5976 3.92728C8.38459 3.71515 8.38459 3.37122 8.5976 3.15909C8.81061 2.94697 9.15598 2.94697 9.36899 3.15909Z"/>
	</svg>
`;

	const icons = {
		arrowRight
	};

	/**
	 * SSR Window 4.0.2
	 * Better handling for window object in SSR environment
	 * https://github.com/nolimits4web/ssr-window
	 *
	 * Copyright 2021, Vladimir Kharlampidi
	 *
	 * Licensed under MIT
	 *
	 * Released on: December 13, 2021
	 */
	/* eslint-disable no-param-reassign */
	function isObject$1(obj) {
	    return (obj !== null &&
	        typeof obj === 'object' &&
	        'constructor' in obj &&
	        obj.constructor === Object);
	}
	function extend$1(target = {}, src = {}) {
	    Object.keys(src).forEach((key) => {
	        if (typeof target[key] === 'undefined')
	            target[key] = src[key];
	        else if (isObject$1(src[key]) &&
	            isObject$1(target[key]) &&
	            Object.keys(src[key]).length > 0) {
	            extend$1(target[key], src[key]);
	        }
	    });
	}

	const ssrDocument = {
	    body: {},
	    addEventListener() { },
	    removeEventListener() { },
	    activeElement: {
	        blur() { },
	        nodeName: '',
	    },
	    querySelector() {
	        return null;
	    },
	    querySelectorAll() {
	        return [];
	    },
	    getElementById() {
	        return null;
	    },
	    createEvent() {
	        return {
	            initEvent() { },
	        };
	    },
	    createElement() {
	        return {
	            children: [],
	            childNodes: [],
	            style: {},
	            setAttribute() { },
	            getElementsByTagName() {
	                return [];
	            },
	        };
	    },
	    createElementNS() {
	        return {};
	    },
	    importNode() {
	        return null;
	    },
	    location: {
	        hash: '',
	        host: '',
	        hostname: '',
	        href: '',
	        origin: '',
	        pathname: '',
	        protocol: '',
	        search: '',
	    },
	};
	function getDocument() {
	    const doc = typeof document !== 'undefined' ? document : {};
	    extend$1(doc, ssrDocument);
	    return doc;
	}

	const ssrWindow = {
	    document: ssrDocument,
	    navigator: {
	        userAgent: '',
	    },
	    location: {
	        hash: '',
	        host: '',
	        hostname: '',
	        href: '',
	        origin: '',
	        pathname: '',
	        protocol: '',
	        search: '',
	    },
	    history: {
	        replaceState() { },
	        pushState() { },
	        go() { },
	        back() { },
	    },
	    CustomEvent: function CustomEvent() {
	        return this;
	    },
	    addEventListener() { },
	    removeEventListener() { },
	    getComputedStyle() {
	        return {
	            getPropertyValue() {
	                return '';
	            },
	        };
	    },
	    Image() { },
	    Date() { },
	    screen: {},
	    setTimeout() { },
	    clearTimeout() { },
	    matchMedia() {
	        return {};
	    },
	    requestAnimationFrame(callback) {
	        if (typeof setTimeout === 'undefined') {
	            callback();
	            return null;
	        }
	        return setTimeout(callback, 0);
	    },
	    cancelAnimationFrame(id) {
	        if (typeof setTimeout === 'undefined') {
	            return;
	        }
	        clearTimeout(id);
	    },
	};
	function getWindow() {
	    const win = typeof window !== 'undefined' ? window : {};
	    extend$1(win, ssrWindow);
	    return win;
	}

	/**
	 * Dom7 4.0.6
	 * Minimalistic JavaScript library for DOM manipulation, with a jQuery-compatible API
	 * https://framework7.io/docs/dom7.html
	 *
	 * Copyright 2023, Vladimir Kharlampidi
	 *
	 * Licensed under MIT
	 *
	 * Released on: February 2, 2023
	 */

	/* eslint-disable no-proto */
	function makeReactive(obj) {
	  const proto = obj.__proto__;
	  Object.defineProperty(obj, '__proto__', {
	    get() {
	      return proto;
	    },

	    set(value) {
	      proto.__proto__ = value;
	    }

	  });
	}

	class Dom7 extends Array {
	  constructor(items) {
	    if (typeof items === 'number') {
	      super(items);
	    } else {
	      super(...(items || []));
	      makeReactive(this);
	    }
	  }

	}

	function arrayFlat(arr = []) {
	  const res = [];
	  arr.forEach(el => {
	    if (Array.isArray(el)) {
	      res.push(...arrayFlat(el));
	    } else {
	      res.push(el);
	    }
	  });
	  return res;
	}
	function arrayFilter(arr, callback) {
	  return Array.prototype.filter.call(arr, callback);
	}
	function arrayUnique(arr) {
	  const uniqueArray = [];

	  for (let i = 0; i < arr.length; i += 1) {
	    if (uniqueArray.indexOf(arr[i]) === -1) uniqueArray.push(arr[i]);
	  }

	  return uniqueArray;
	}

	// eslint-disable-next-line

	function qsa(selector, context) {
	  if (typeof selector !== 'string') {
	    return [selector];
	  }

	  const a = [];
	  const res = context.querySelectorAll(selector);

	  for (let i = 0; i < res.length; i += 1) {
	    a.push(res[i]);
	  }

	  return a;
	}

	function $(selector, context) {
	  const window = getWindow();
	  const document = getDocument();
	  let arr = [];

	  if (!context && selector instanceof Dom7) {
	    return selector;
	  }

	  if (!selector) {
	    return new Dom7(arr);
	  }

	  if (typeof selector === 'string') {
	    const html = selector.trim();

	    if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
	      let toCreate = 'div';
	      if (html.indexOf('<li') === 0) toCreate = 'ul';
	      if (html.indexOf('<tr') === 0) toCreate = 'tbody';
	      if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) toCreate = 'tr';
	      if (html.indexOf('<tbody') === 0) toCreate = 'table';
	      if (html.indexOf('<option') === 0) toCreate = 'select';
	      const tempParent = document.createElement(toCreate);
	      tempParent.innerHTML = html;

	      for (let i = 0; i < tempParent.childNodes.length; i += 1) {
	        arr.push(tempParent.childNodes[i]);
	      }
	    } else {
	      arr = qsa(selector.trim(), context || document);
	    } // arr = qsa(selector, document);

	  } else if (selector.nodeType || selector === window || selector === document) {
	    arr.push(selector);
	  } else if (Array.isArray(selector)) {
	    if (selector instanceof Dom7) return selector;
	    arr = selector;
	  }

	  return new Dom7(arrayUnique(arr));
	}

	$.fn = Dom7.prototype;

	// eslint-disable-next-line

	function addClass(...classes) {
	  const classNames = arrayFlat(classes.map(c => c.split(' ')));
	  this.forEach(el => {
	    el.classList.add(...classNames);
	  });
	  return this;
	}

	function removeClass(...classes) {
	  const classNames = arrayFlat(classes.map(c => c.split(' ')));
	  this.forEach(el => {
	    el.classList.remove(...classNames);
	  });
	  return this;
	}

	function toggleClass(...classes) {
	  const classNames = arrayFlat(classes.map(c => c.split(' ')));
	  this.forEach(el => {
	    classNames.forEach(className => {
	      el.classList.toggle(className);
	    });
	  });
	}

	function hasClass(...classes) {
	  const classNames = arrayFlat(classes.map(c => c.split(' ')));
	  return arrayFilter(this, el => {
	    return classNames.filter(className => el.classList.contains(className)).length > 0;
	  }).length > 0;
	}

	function attr(attrs, value) {
	  if (arguments.length === 1 && typeof attrs === 'string') {
	    // Get attr
	    if (this[0]) return this[0].getAttribute(attrs);
	    return undefined;
	  } // Set attrs


	  for (let i = 0; i < this.length; i += 1) {
	    if (arguments.length === 2) {
	      // String
	      this[i].setAttribute(attrs, value);
	    } else {
	      // Object
	      for (const attrName in attrs) {
	        this[i][attrName] = attrs[attrName];
	        this[i].setAttribute(attrName, attrs[attrName]);
	      }
	    }
	  }

	  return this;
	}

	function removeAttr(attr) {
	  for (let i = 0; i < this.length; i += 1) {
	    this[i].removeAttribute(attr);
	  }

	  return this;
	}

	function transform(transform) {
	  for (let i = 0; i < this.length; i += 1) {
	    this[i].style.transform = transform;
	  }

	  return this;
	}

	function transition$1(duration) {
	  for (let i = 0; i < this.length; i += 1) {
	    this[i].style.transitionDuration = typeof duration !== 'string' ? `${duration}ms` : duration;
	  }

	  return this;
	}

	function on(...args) {
	  let [eventType, targetSelector, listener, capture] = args;

	  if (typeof args[1] === 'function') {
	    [eventType, listener, capture] = args;
	    targetSelector = undefined;
	  }

	  if (!capture) capture = false;

	  function handleLiveEvent(e) {
	    const target = e.target;
	    if (!target) return;
	    const eventData = e.target.dom7EventData || [];

	    if (eventData.indexOf(e) < 0) {
	      eventData.unshift(e);
	    }

	    if ($(target).is(targetSelector)) listener.apply(target, eventData);else {
	      const parents = $(target).parents(); // eslint-disable-line

	      for (let k = 0; k < parents.length; k += 1) {
	        if ($(parents[k]).is(targetSelector)) listener.apply(parents[k], eventData);
	      }
	    }
	  }

	  function handleEvent(e) {
	    const eventData = e && e.target ? e.target.dom7EventData || [] : [];

	    if (eventData.indexOf(e) < 0) {
	      eventData.unshift(e);
	    }

	    listener.apply(this, eventData);
	  }

	  const events = eventType.split(' ');
	  let j;

	  for (let i = 0; i < this.length; i += 1) {
	    const el = this[i];

	    if (!targetSelector) {
	      for (j = 0; j < events.length; j += 1) {
	        const event = events[j];
	        if (!el.dom7Listeners) el.dom7Listeners = {};
	        if (!el.dom7Listeners[event]) el.dom7Listeners[event] = [];
	        el.dom7Listeners[event].push({
	          listener,
	          proxyListener: handleEvent
	        });
	        el.addEventListener(event, handleEvent, capture);
	      }
	    } else {
	      // Live events
	      for (j = 0; j < events.length; j += 1) {
	        const event = events[j];
	        if (!el.dom7LiveListeners) el.dom7LiveListeners = {};
	        if (!el.dom7LiveListeners[event]) el.dom7LiveListeners[event] = [];
	        el.dom7LiveListeners[event].push({
	          listener,
	          proxyListener: handleLiveEvent
	        });
	        el.addEventListener(event, handleLiveEvent, capture);
	      }
	    }
	  }

	  return this;
	}

	function off(...args) {
	  let [eventType, targetSelector, listener, capture] = args;

	  if (typeof args[1] === 'function') {
	    [eventType, listener, capture] = args;
	    targetSelector = undefined;
	  }

	  if (!capture) capture = false;
	  const events = eventType.split(' ');

	  for (let i = 0; i < events.length; i += 1) {
	    const event = events[i];

	    for (let j = 0; j < this.length; j += 1) {
	      const el = this[j];
	      let handlers;

	      if (!targetSelector && el.dom7Listeners) {
	        handlers = el.dom7Listeners[event];
	      } else if (targetSelector && el.dom7LiveListeners) {
	        handlers = el.dom7LiveListeners[event];
	      }

	      if (handlers && handlers.length) {
	        for (let k = handlers.length - 1; k >= 0; k -= 1) {
	          const handler = handlers[k];

	          if (listener && handler.listener === listener) {
	            el.removeEventListener(event, handler.proxyListener, capture);
	            handlers.splice(k, 1);
	          } else if (listener && handler.listener && handler.listener.dom7proxy && handler.listener.dom7proxy === listener) {
	            el.removeEventListener(event, handler.proxyListener, capture);
	            handlers.splice(k, 1);
	          } else if (!listener) {
	            el.removeEventListener(event, handler.proxyListener, capture);
	            handlers.splice(k, 1);
	          }
	        }
	      }
	    }
	  }

	  return this;
	}

	function trigger(...args) {
	  const window = getWindow();
	  const events = args[0].split(' ');
	  const eventData = args[1];

	  for (let i = 0; i < events.length; i += 1) {
	    const event = events[i];

	    for (let j = 0; j < this.length; j += 1) {
	      const el = this[j];

	      if (window.CustomEvent) {
	        const evt = new window.CustomEvent(event, {
	          detail: eventData,
	          bubbles: true,
	          cancelable: true
	        });
	        el.dom7EventData = args.filter((data, dataIndex) => dataIndex > 0);
	        el.dispatchEvent(evt);
	        el.dom7EventData = [];
	        delete el.dom7EventData;
	      }
	    }
	  }

	  return this;
	}

	function transitionEnd$1(callback) {
	  const dom = this;

	  function fireCallBack(e) {
	    if (e.target !== this) return;
	    callback.call(this, e);
	    dom.off('transitionend', fireCallBack);
	  }

	  if (callback) {
	    dom.on('transitionend', fireCallBack);
	  }

	  return this;
	}

	function outerWidth(includeMargins) {
	  if (this.length > 0) {
	    if (includeMargins) {
	      const styles = this.styles();
	      return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
	    }

	    return this[0].offsetWidth;
	  }

	  return null;
	}

	function outerHeight(includeMargins) {
	  if (this.length > 0) {
	    if (includeMargins) {
	      const styles = this.styles();
	      return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
	    }

	    return this[0].offsetHeight;
	  }

	  return null;
	}

	function offset() {
	  if (this.length > 0) {
	    const window = getWindow();
	    const document = getDocument();
	    const el = this[0];
	    const box = el.getBoundingClientRect();
	    const body = document.body;
	    const clientTop = el.clientTop || body.clientTop || 0;
	    const clientLeft = el.clientLeft || body.clientLeft || 0;
	    const scrollTop = el === window ? window.scrollY : el.scrollTop;
	    const scrollLeft = el === window ? window.scrollX : el.scrollLeft;
	    return {
	      top: box.top + scrollTop - clientTop,
	      left: box.left + scrollLeft - clientLeft
	    };
	  }

	  return null;
	}

	function styles() {
	  const window = getWindow();
	  if (this[0]) return window.getComputedStyle(this[0], null);
	  return {};
	}

	function css(props, value) {
	  const window = getWindow();
	  let i;

	  if (arguments.length === 1) {
	    if (typeof props === 'string') {
	      // .css('width')
	      if (this[0]) return window.getComputedStyle(this[0], null).getPropertyValue(props);
	    } else {
	      // .css({ width: '100px' })
	      for (i = 0; i < this.length; i += 1) {
	        for (const prop in props) {
	          this[i].style[prop] = props[prop];
	        }
	      }

	      return this;
	    }
	  }

	  if (arguments.length === 2 && typeof props === 'string') {
	    // .css('width', '100px')
	    for (i = 0; i < this.length; i += 1) {
	      this[i].style[props] = value;
	    }

	    return this;
	  }

	  return this;
	}

	function each(callback) {
	  if (!callback) return this;
	  this.forEach((el, index) => {
	    callback.apply(el, [el, index]);
	  });
	  return this;
	}

	function filter(callback) {
	  const result = arrayFilter(this, callback);
	  return $(result);
	}

	function html(html) {
	  if (typeof html === 'undefined') {
	    return this[0] ? this[0].innerHTML : null;
	  }

	  for (let i = 0; i < this.length; i += 1) {
	    this[i].innerHTML = html;
	  }

	  return this;
	}

	function text(text) {
	  if (typeof text === 'undefined') {
	    return this[0] ? this[0].textContent.trim() : null;
	  }

	  for (let i = 0; i < this.length; i += 1) {
	    this[i].textContent = text;
	  }

	  return this;
	}

	function is(selector) {
	  const window = getWindow();
	  const document = getDocument();
	  const el = this[0];
	  let compareWith;
	  let i;
	  if (!el || typeof selector === 'undefined') return false;

	  if (typeof selector === 'string') {
	    if (el.matches) return el.matches(selector);
	    if (el.webkitMatchesSelector) return el.webkitMatchesSelector(selector);
	    if (el.msMatchesSelector) return el.msMatchesSelector(selector);
	    compareWith = $(selector);

	    for (i = 0; i < compareWith.length; i += 1) {
	      if (compareWith[i] === el) return true;
	    }

	    return false;
	  }

	  if (selector === document) {
	    return el === document;
	  }

	  if (selector === window) {
	    return el === window;
	  }

	  if (selector.nodeType || selector instanceof Dom7) {
	    compareWith = selector.nodeType ? [selector] : selector;

	    for (i = 0; i < compareWith.length; i += 1) {
	      if (compareWith[i] === el) return true;
	    }

	    return false;
	  }

	  return false;
	}

	function index() {
	  let child = this[0];
	  let i;

	  if (child) {
	    i = 0; // eslint-disable-next-line

	    while ((child = child.previousSibling) !== null) {
	      if (child.nodeType === 1) i += 1;
	    }

	    return i;
	  }

	  return undefined;
	}

	function eq(index) {
	  if (typeof index === 'undefined') return this;
	  const length = this.length;

	  if (index > length - 1) {
	    return $([]);
	  }

	  if (index < 0) {
	    const returnIndex = length + index;
	    if (returnIndex < 0) return $([]);
	    return $([this[returnIndex]]);
	  }

	  return $([this[index]]);
	}

	function append(...els) {
	  let newChild;
	  const document = getDocument();

	  for (let k = 0; k < els.length; k += 1) {
	    newChild = els[k];

	    for (let i = 0; i < this.length; i += 1) {
	      if (typeof newChild === 'string') {
	        const tempDiv = document.createElement('div');
	        tempDiv.innerHTML = newChild;

	        while (tempDiv.firstChild) {
	          this[i].appendChild(tempDiv.firstChild);
	        }
	      } else if (newChild instanceof Dom7) {
	        for (let j = 0; j < newChild.length; j += 1) {
	          this[i].appendChild(newChild[j]);
	        }
	      } else {
	        this[i].appendChild(newChild);
	      }
	    }
	  }

	  return this;
	}

	function prepend(newChild) {
	  const document = getDocument();
	  let i;
	  let j;

	  for (i = 0; i < this.length; i += 1) {
	    if (typeof newChild === 'string') {
	      const tempDiv = document.createElement('div');
	      tempDiv.innerHTML = newChild;

	      for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
	        this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
	      }
	    } else if (newChild instanceof Dom7) {
	      for (j = 0; j < newChild.length; j += 1) {
	        this[i].insertBefore(newChild[j], this[i].childNodes[0]);
	      }
	    } else {
	      this[i].insertBefore(newChild, this[i].childNodes[0]);
	    }
	  }

	  return this;
	}

	function next(selector) {
	  if (this.length > 0) {
	    if (selector) {
	      if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
	        return $([this[0].nextElementSibling]);
	      }

	      return $([]);
	    }

	    if (this[0].nextElementSibling) return $([this[0].nextElementSibling]);
	    return $([]);
	  }

	  return $([]);
	}

	function nextAll(selector) {
	  const nextEls = [];
	  let el = this[0];
	  if (!el) return $([]);

	  while (el.nextElementSibling) {
	    const next = el.nextElementSibling; // eslint-disable-line

	    if (selector) {
	      if ($(next).is(selector)) nextEls.push(next);
	    } else nextEls.push(next);

	    el = next;
	  }

	  return $(nextEls);
	}

	function prev(selector) {
	  if (this.length > 0) {
	    const el = this[0];

	    if (selector) {
	      if (el.previousElementSibling && $(el.previousElementSibling).is(selector)) {
	        return $([el.previousElementSibling]);
	      }

	      return $([]);
	    }

	    if (el.previousElementSibling) return $([el.previousElementSibling]);
	    return $([]);
	  }

	  return $([]);
	}

	function prevAll(selector) {
	  const prevEls = [];
	  let el = this[0];
	  if (!el) return $([]);

	  while (el.previousElementSibling) {
	    const prev = el.previousElementSibling; // eslint-disable-line

	    if (selector) {
	      if ($(prev).is(selector)) prevEls.push(prev);
	    } else prevEls.push(prev);

	    el = prev;
	  }

	  return $(prevEls);
	}

	function parent(selector) {
	  const parents = []; // eslint-disable-line

	  for (let i = 0; i < this.length; i += 1) {
	    if (this[i].parentNode !== null) {
	      if (selector) {
	        if ($(this[i].parentNode).is(selector)) parents.push(this[i].parentNode);
	      } else {
	        parents.push(this[i].parentNode);
	      }
	    }
	  }

	  return $(parents);
	}

	function parents(selector) {
	  const parents = []; // eslint-disable-line

	  for (let i = 0; i < this.length; i += 1) {
	    let parent = this[i].parentNode; // eslint-disable-line

	    while (parent) {
	      if (selector) {
	        if ($(parent).is(selector)) parents.push(parent);
	      } else {
	        parents.push(parent);
	      }

	      parent = parent.parentNode;
	    }
	  }

	  return $(parents);
	}

	function closest(selector) {
	  let closest = this; // eslint-disable-line

	  if (typeof selector === 'undefined') {
	    return $([]);
	  }

	  if (!closest.is(selector)) {
	    closest = closest.parents(selector).eq(0);
	  }

	  return closest;
	}

	function find(selector) {
	  const foundElements = [];

	  for (let i = 0; i < this.length; i += 1) {
	    const found = this[i].querySelectorAll(selector);

	    for (let j = 0; j < found.length; j += 1) {
	      foundElements.push(found[j]);
	    }
	  }

	  return $(foundElements);
	}

	function children(selector) {
	  const children = []; // eslint-disable-line

	  for (let i = 0; i < this.length; i += 1) {
	    const childNodes = this[i].children;

	    for (let j = 0; j < childNodes.length; j += 1) {
	      if (!selector || $(childNodes[j]).is(selector)) {
	        children.push(childNodes[j]);
	      }
	    }
	  }

	  return $(children);
	}

	function remove() {
	  for (let i = 0; i < this.length; i += 1) {
	    if (this[i].parentNode) this[i].parentNode.removeChild(this[i]);
	  }

	  return this;
	}

	const Methods = {
	  addClass,
	  removeClass,
	  hasClass,
	  toggleClass,
	  attr,
	  removeAttr,
	  transform,
	  transition: transition$1,
	  on,
	  off,
	  trigger,
	  transitionEnd: transitionEnd$1,
	  outerWidth,
	  outerHeight,
	  styles,
	  offset,
	  css,
	  each,
	  html,
	  text,
	  is,
	  index,
	  eq,
	  append,
	  prepend,
	  next,
	  nextAll,
	  prev,
	  prevAll,
	  parent,
	  parents,
	  closest,
	  find,
	  children,
	  filter,
	  remove
	};
	Object.keys(Methods).forEach(methodName => {
	  Object.defineProperty($.fn, methodName, {
	    value: Methods[methodName],
	    writable: true
	  });
	});

	function deleteProps(obj) {
	  const object = obj;
	  Object.keys(object).forEach(key => {
	    try {
	      object[key] = null;
	    } catch (e) {// no getter for object
	    }

	    try {
	      delete object[key];
	    } catch (e) {// something got wrong
	    }
	  });
	}

	function nextTick(callback, delay = 0) {
	  return setTimeout(callback, delay);
	}

	function now() {
	  return Date.now();
	}

	function getComputedStyle$1(el) {
	  const window = getWindow();
	  let style;

	  if (window.getComputedStyle) {
	    style = window.getComputedStyle(el, null);
	  }

	  if (!style && el.currentStyle) {
	    style = el.currentStyle;
	  }

	  if (!style) {
	    style = el.style;
	  }

	  return style;
	}

	function getTranslate(el, axis = 'x') {
	  const window = getWindow();
	  let matrix;
	  let curTransform;
	  let transformMatrix;
	  const curStyle = getComputedStyle$1(el);

	  if (window.WebKitCSSMatrix) {
	    curTransform = curStyle.transform || curStyle.webkitTransform;

	    if (curTransform.split(',').length > 6) {
	      curTransform = curTransform.split(', ').map(a => a.replace(',', '.')).join(', ');
	    } // Some old versions of Webkit choke when 'none' is passed; pass
	    // empty string instead in this case


	    transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
	  } else {
	    transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
	    matrix = transformMatrix.toString().split(',');
	  }

	  if (axis === 'x') {
	    // Latest Chrome and webkits Fix
	    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41; // Crazy IE10 Matrix
	    else if (matrix.length === 16) curTransform = parseFloat(matrix[12]); // Normal Browsers
	    else curTransform = parseFloat(matrix[4]);
	  }

	  if (axis === 'y') {
	    // Latest Chrome and webkits Fix
	    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42; // Crazy IE10 Matrix
	    else if (matrix.length === 16) curTransform = parseFloat(matrix[13]); // Normal Browsers
	    else curTransform = parseFloat(matrix[5]);
	  }

	  return curTransform || 0;
	}

	function isObject(o) {
	  return typeof o === 'object' && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === 'Object';
	}

	function isNode(node) {
	  // eslint-disable-next-line
	  if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
	    return node instanceof HTMLElement;
	  }

	  return node && (node.nodeType === 1 || node.nodeType === 11);
	}

	function extend(...args) {
	  const to = Object(args[0]);
	  const noExtend = ['__proto__', 'constructor', 'prototype'];

	  for (let i = 1; i < args.length; i += 1) {
	    const nextSource = args[i];

	    if (nextSource !== undefined && nextSource !== null && !isNode(nextSource)) {
	      const keysArray = Object.keys(Object(nextSource)).filter(key => noExtend.indexOf(key) < 0);

	      for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
	        const nextKey = keysArray[nextIndex];
	        const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);

	        if (desc !== undefined && desc.enumerable) {
	          if (isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
	            if (nextSource[nextKey].__swiper__) {
	              to[nextKey] = nextSource[nextKey];
	            } else {
	              extend(to[nextKey], nextSource[nextKey]);
	            }
	          } else if (!isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
	            to[nextKey] = {};

	            if (nextSource[nextKey].__swiper__) {
	              to[nextKey] = nextSource[nextKey];
	            } else {
	              extend(to[nextKey], nextSource[nextKey]);
	            }
	          } else {
	            to[nextKey] = nextSource[nextKey];
	          }
	        }
	      }
	    }
	  }

	  return to;
	}

	function setCSSProperty(el, varName, varValue) {
	  el.style.setProperty(varName, varValue);
	}

	function animateCSSModeScroll({
	  swiper,
	  targetPosition,
	  side
	}) {
	  const window = getWindow();
	  const startPosition = -swiper.translate;
	  let startTime = null;
	  let time;
	  const duration = swiper.params.speed;
	  swiper.wrapperEl.style.scrollSnapType = 'none';
	  window.cancelAnimationFrame(swiper.cssModeFrameID);
	  const dir = targetPosition > startPosition ? 'next' : 'prev';

	  const isOutOfBound = (current, target) => {
	    return dir === 'next' && current >= target || dir === 'prev' && current <= target;
	  };

	  const animate = () => {
	    time = new Date().getTime();

	    if (startTime === null) {
	      startTime = time;
	    }

	    const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
	    const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
	    let currentPosition = startPosition + easeProgress * (targetPosition - startPosition);

	    if (isOutOfBound(currentPosition, targetPosition)) {
	      currentPosition = targetPosition;
	    }

	    swiper.wrapperEl.scrollTo({
	      [side]: currentPosition
	    });

	    if (isOutOfBound(currentPosition, targetPosition)) {
	      swiper.wrapperEl.style.overflow = 'hidden';
	      swiper.wrapperEl.style.scrollSnapType = '';
	      setTimeout(() => {
	        swiper.wrapperEl.style.overflow = '';
	        swiper.wrapperEl.scrollTo({
	          [side]: currentPosition
	        });
	      });
	      window.cancelAnimationFrame(swiper.cssModeFrameID);
	      return;
	    }

	    swiper.cssModeFrameID = window.requestAnimationFrame(animate);
	  };

	  animate();
	}

	let support;

	function calcSupport() {
	  const window = getWindow();
	  const document = getDocument();
	  return {
	    smoothScroll: document.documentElement && 'scrollBehavior' in document.documentElement.style,
	    touch: !!('ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch),
	    passiveListener: function checkPassiveListener() {
	      let supportsPassive = false;

	      try {
	        const opts = Object.defineProperty({}, 'passive', {
	          // eslint-disable-next-line
	          get() {
	            supportsPassive = true;
	          }

	        });
	        window.addEventListener('testPassiveListener', null, opts);
	      } catch (e) {// No support
	      }

	      return supportsPassive;
	    }(),
	    gestures: function checkGestures() {
	      return 'ongesturestart' in window;
	    }()
	  };
	}

	function getSupport() {
	  if (!support) {
	    support = calcSupport();
	  }

	  return support;
	}

	let deviceCached;

	function calcDevice({
	  userAgent
	} = {}) {
	  const support = getSupport();
	  const window = getWindow();
	  const platform = window.navigator.platform;
	  const ua = userAgent || window.navigator.userAgent;
	  const device = {
	    ios: false,
	    android: false
	  };
	  const screenWidth = window.screen.width;
	  const screenHeight = window.screen.height;
	  const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line

	  let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
	  const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
	  const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
	  const windows = platform === 'Win32';
	  let macos = platform === 'MacIntel'; // iPadOs 13 fix

	  const iPadScreens = ['1024x1366', '1366x1024', '834x1194', '1194x834', '834x1112', '1112x834', '768x1024', '1024x768', '820x1180', '1180x820', '810x1080', '1080x810'];

	  if (!ipad && macos && support.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
	    ipad = ua.match(/(Version)\/([\d.]+)/);
	    if (!ipad) ipad = [0, 1, '13_0_0'];
	    macos = false;
	  } // Android


	  if (android && !windows) {
	    device.os = 'android';
	    device.android = true;
	  }

	  if (ipad || iphone || ipod) {
	    device.os = 'ios';
	    device.ios = true;
	  } // Export object


	  return device;
	}

	function getDevice(overrides = {}) {
	  if (!deviceCached) {
	    deviceCached = calcDevice(overrides);
	  }

	  return deviceCached;
	}

	let browser;

	function calcBrowser() {
	  const window = getWindow();

	  function isSafari() {
	    const ua = window.navigator.userAgent.toLowerCase();
	    return ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0;
	  }

	  return {
	    isSafari: isSafari(),
	    isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window.navigator.userAgent)
	  };
	}

	function getBrowser() {
	  if (!browser) {
	    browser = calcBrowser();
	  }

	  return browser;
	}

	function Resize({
	  swiper,
	  on,
	  emit
	}) {
	  const window = getWindow();
	  let observer = null;
	  let animationFrame = null;

	  const resizeHandler = () => {
	    if (!swiper || swiper.destroyed || !swiper.initialized) return;
	    emit('beforeResize');
	    emit('resize');
	  };

	  const createObserver = () => {
	    if (!swiper || swiper.destroyed || !swiper.initialized) return;
	    observer = new ResizeObserver(entries => {
	      animationFrame = window.requestAnimationFrame(() => {
	        const {
	          width,
	          height
	        } = swiper;
	        let newWidth = width;
	        let newHeight = height;
	        entries.forEach(({
	          contentBoxSize,
	          contentRect,
	          target
	        }) => {
	          if (target && target !== swiper.el) return;
	          newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
	          newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
	        });

	        if (newWidth !== width || newHeight !== height) {
	          resizeHandler();
	        }
	      });
	    });
	    observer.observe(swiper.el);
	  };

	  const removeObserver = () => {
	    if (animationFrame) {
	      window.cancelAnimationFrame(animationFrame);
	    }

	    if (observer && observer.unobserve && swiper.el) {
	      observer.unobserve(swiper.el);
	      observer = null;
	    }
	  };

	  const orientationChangeHandler = () => {
	    if (!swiper || swiper.destroyed || !swiper.initialized) return;
	    emit('orientationchange');
	  };

	  on('init', () => {
	    if (swiper.params.resizeObserver && typeof window.ResizeObserver !== 'undefined') {
	      createObserver();
	      return;
	    }

	    window.addEventListener('resize', resizeHandler);
	    window.addEventListener('orientationchange', orientationChangeHandler);
	  });
	  on('destroy', () => {
	    removeObserver();
	    window.removeEventListener('resize', resizeHandler);
	    window.removeEventListener('orientationchange', orientationChangeHandler);
	  });
	}

	function Observer({
	  swiper,
	  extendParams,
	  on,
	  emit
	}) {
	  const observers = [];
	  const window = getWindow();

	  const attach = (target, options = {}) => {
	    const ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
	    const observer = new ObserverFunc(mutations => {
	      // The observerUpdate event should only be triggered
	      // once despite the number of mutations.  Additional
	      // triggers are redundant and are very costly
	      if (mutations.length === 1) {
	        emit('observerUpdate', mutations[0]);
	        return;
	      }

	      const observerUpdate = function observerUpdate() {
	        emit('observerUpdate', mutations[0]);
	      };

	      if (window.requestAnimationFrame) {
	        window.requestAnimationFrame(observerUpdate);
	      } else {
	        window.setTimeout(observerUpdate, 0);
	      }
	    });
	    observer.observe(target, {
	      attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
	      childList: typeof options.childList === 'undefined' ? true : options.childList,
	      characterData: typeof options.characterData === 'undefined' ? true : options.characterData
	    });
	    observers.push(observer);
	  };

	  const init = () => {
	    if (!swiper.params.observer) return;

	    if (swiper.params.observeParents) {
	      const containerParents = swiper.$el.parents();

	      for (let i = 0; i < containerParents.length; i += 1) {
	        attach(containerParents[i]);
	      }
	    } // Observe container


	    attach(swiper.$el[0], {
	      childList: swiper.params.observeSlideChildren
	    }); // Observe wrapper

	    attach(swiper.$wrapperEl[0], {
	      attributes: false
	    });
	  };

	  const destroy = () => {
	    observers.forEach(observer => {
	      observer.disconnect();
	    });
	    observers.splice(0, observers.length);
	  };

	  extendParams({
	    observer: false,
	    observeParents: false,
	    observeSlideChildren: false
	  });
	  on('init', init);
	  on('destroy', destroy);
	}

	/* eslint-disable no-underscore-dangle */
	var eventsEmitter = {
	  on(events, handler, priority) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (typeof handler !== 'function') return self;
	    const method = priority ? 'unshift' : 'push';
	    events.split(' ').forEach(event => {
	      if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
	      self.eventsListeners[event][method](handler);
	    });
	    return self;
	  },

	  once(events, handler, priority) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (typeof handler !== 'function') return self;

	    function onceHandler(...args) {
	      self.off(events, onceHandler);

	      if (onceHandler.__emitterProxy) {
	        delete onceHandler.__emitterProxy;
	      }

	      handler.apply(self, args);
	    }

	    onceHandler.__emitterProxy = handler;
	    return self.on(events, onceHandler, priority);
	  },

	  onAny(handler, priority) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (typeof handler !== 'function') return self;
	    const method = priority ? 'unshift' : 'push';

	    if (self.eventsAnyListeners.indexOf(handler) < 0) {
	      self.eventsAnyListeners[method](handler);
	    }

	    return self;
	  },

	  offAny(handler) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (!self.eventsAnyListeners) return self;
	    const index = self.eventsAnyListeners.indexOf(handler);

	    if (index >= 0) {
	      self.eventsAnyListeners.splice(index, 1);
	    }

	    return self;
	  },

	  off(events, handler) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (!self.eventsListeners) return self;
	    events.split(' ').forEach(event => {
	      if (typeof handler === 'undefined') {
	        self.eventsListeners[event] = [];
	      } else if (self.eventsListeners[event]) {
	        self.eventsListeners[event].forEach((eventHandler, index) => {
	          if (eventHandler === handler || eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler) {
	            self.eventsListeners[event].splice(index, 1);
	          }
	        });
	      }
	    });
	    return self;
	  },

	  emit(...args) {
	    const self = this;
	    if (!self.eventsListeners || self.destroyed) return self;
	    if (!self.eventsListeners) return self;
	    let events;
	    let data;
	    let context;

	    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
	      events = args[0];
	      data = args.slice(1, args.length);
	      context = self;
	    } else {
	      events = args[0].events;
	      data = args[0].data;
	      context = args[0].context || self;
	    }

	    data.unshift(context);
	    const eventsArray = Array.isArray(events) ? events : events.split(' ');
	    eventsArray.forEach(event => {
	      if (self.eventsAnyListeners && self.eventsAnyListeners.length) {
	        self.eventsAnyListeners.forEach(eventHandler => {
	          eventHandler.apply(context, [event, ...data]);
	        });
	      }

	      if (self.eventsListeners && self.eventsListeners[event]) {
	        self.eventsListeners[event].forEach(eventHandler => {
	          eventHandler.apply(context, data);
	        });
	      }
	    });
	    return self;
	  }

	};

	function updateSize() {
	  const swiper = this;
	  let width;
	  let height;
	  const $el = swiper.$el;

	  if (typeof swiper.params.width !== 'undefined' && swiper.params.width !== null) {
	    width = swiper.params.width;
	  } else {
	    width = $el[0].clientWidth;
	  }

	  if (typeof swiper.params.height !== 'undefined' && swiper.params.height !== null) {
	    height = swiper.params.height;
	  } else {
	    height = $el[0].clientHeight;
	  }

	  if (width === 0 && swiper.isHorizontal() || height === 0 && swiper.isVertical()) {
	    return;
	  } // Subtract paddings


	  width = width - parseInt($el.css('padding-left') || 0, 10) - parseInt($el.css('padding-right') || 0, 10);
	  height = height - parseInt($el.css('padding-top') || 0, 10) - parseInt($el.css('padding-bottom') || 0, 10);
	  if (Number.isNaN(width)) width = 0;
	  if (Number.isNaN(height)) height = 0;
	  Object.assign(swiper, {
	    width,
	    height,
	    size: swiper.isHorizontal() ? width : height
	  });
	}

	function updateSlides() {
	  const swiper = this;

	  function getDirectionLabel(property) {
	    if (swiper.isHorizontal()) {
	      return property;
	    } // prettier-ignore


	    return {
	      'width': 'height',
	      'margin-top': 'margin-left',
	      'margin-bottom ': 'margin-right',
	      'margin-left': 'margin-top',
	      'margin-right': 'margin-bottom',
	      'padding-left': 'padding-top',
	      'padding-right': 'padding-bottom',
	      'marginRight': 'marginBottom'
	    }[property];
	  }

	  function getDirectionPropertyValue(node, label) {
	    return parseFloat(node.getPropertyValue(getDirectionLabel(label)) || 0);
	  }

	  const params = swiper.params;
	  const {
	    $wrapperEl,
	    size: swiperSize,
	    rtlTranslate: rtl,
	    wrongRTL
	  } = swiper;
	  const isVirtual = swiper.virtual && params.virtual.enabled;
	  const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
	  const slides = $wrapperEl.children(`.${swiper.params.slideClass}`);
	  const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
	  let snapGrid = [];
	  const slidesGrid = [];
	  const slidesSizesGrid = [];
	  let offsetBefore = params.slidesOffsetBefore;

	  if (typeof offsetBefore === 'function') {
	    offsetBefore = params.slidesOffsetBefore.call(swiper);
	  }

	  let offsetAfter = params.slidesOffsetAfter;

	  if (typeof offsetAfter === 'function') {
	    offsetAfter = params.slidesOffsetAfter.call(swiper);
	  }

	  const previousSnapGridLength = swiper.snapGrid.length;
	  const previousSlidesGridLength = swiper.slidesGrid.length;
	  let spaceBetween = params.spaceBetween;
	  let slidePosition = -offsetBefore;
	  let prevSlideSize = 0;
	  let index = 0;

	  if (typeof swiperSize === 'undefined') {
	    return;
	  }

	  if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
	    spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiperSize;
	  }

	  swiper.virtualSize = -spaceBetween; // reset margins

	  if (rtl) slides.css({
	    marginLeft: '',
	    marginBottom: '',
	    marginTop: ''
	  });else slides.css({
	    marginRight: '',
	    marginBottom: '',
	    marginTop: ''
	  }); // reset cssMode offsets

	  if (params.centeredSlides && params.cssMode) {
	    setCSSProperty(swiper.wrapperEl, '--swiper-centered-offset-before', '');
	    setCSSProperty(swiper.wrapperEl, '--swiper-centered-offset-after', '');
	  }

	  const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;

	  if (gridEnabled) {
	    swiper.grid.initSlides(slidesLength);
	  } // Calc slides


	  let slideSize;
	  const shouldResetSlideSize = params.slidesPerView === 'auto' && params.breakpoints && Object.keys(params.breakpoints).filter(key => {
	    return typeof params.breakpoints[key].slidesPerView !== 'undefined';
	  }).length > 0;

	  for (let i = 0; i < slidesLength; i += 1) {
	    slideSize = 0;
	    const slide = slides.eq(i);

	    if (gridEnabled) {
	      swiper.grid.updateSlide(i, slide, slidesLength, getDirectionLabel);
	    }

	    if (slide.css('display') === 'none') continue; // eslint-disable-line

	    if (params.slidesPerView === 'auto') {
	      if (shouldResetSlideSize) {
	        slides[i].style[getDirectionLabel('width')] = ``;
	      }

	      const slideStyles = getComputedStyle(slide[0]);
	      const currentTransform = slide[0].style.transform;
	      const currentWebKitTransform = slide[0].style.webkitTransform;

	      if (currentTransform) {
	        slide[0].style.transform = 'none';
	      }

	      if (currentWebKitTransform) {
	        slide[0].style.webkitTransform = 'none';
	      }

	      if (params.roundLengths) {
	        slideSize = swiper.isHorizontal() ? slide.outerWidth(true) : slide.outerHeight(true);
	      } else {
	        // eslint-disable-next-line
	        const width = getDirectionPropertyValue(slideStyles, 'width');
	        const paddingLeft = getDirectionPropertyValue(slideStyles, 'padding-left');
	        const paddingRight = getDirectionPropertyValue(slideStyles, 'padding-right');
	        const marginLeft = getDirectionPropertyValue(slideStyles, 'margin-left');
	        const marginRight = getDirectionPropertyValue(slideStyles, 'margin-right');
	        const boxSizing = slideStyles.getPropertyValue('box-sizing');

	        if (boxSizing && boxSizing === 'border-box') {
	          slideSize = width + marginLeft + marginRight;
	        } else {
	          const {
	            clientWidth,
	            offsetWidth
	          } = slide[0];
	          slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
	        }
	      }

	      if (currentTransform) {
	        slide[0].style.transform = currentTransform;
	      }

	      if (currentWebKitTransform) {
	        slide[0].style.webkitTransform = currentWebKitTransform;
	      }

	      if (params.roundLengths) slideSize = Math.floor(slideSize);
	    } else {
	      slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
	      if (params.roundLengths) slideSize = Math.floor(slideSize);

	      if (slides[i]) {
	        slides[i].style[getDirectionLabel('width')] = `${slideSize}px`;
	      }
	    }

	    if (slides[i]) {
	      slides[i].swiperSlideSize = slideSize;
	    }

	    slidesSizesGrid.push(slideSize);

	    if (params.centeredSlides) {
	      slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
	      if (prevSlideSize === 0 && i !== 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
	      if (i === 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
	      if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
	      if (params.roundLengths) slidePosition = Math.floor(slidePosition);
	      if (index % params.slidesPerGroup === 0) snapGrid.push(slidePosition);
	      slidesGrid.push(slidePosition);
	    } else {
	      if (params.roundLengths) slidePosition = Math.floor(slidePosition);
	      if ((index - Math.min(swiper.params.slidesPerGroupSkip, index)) % swiper.params.slidesPerGroup === 0) snapGrid.push(slidePosition);
	      slidesGrid.push(slidePosition);
	      slidePosition = slidePosition + slideSize + spaceBetween;
	    }

	    swiper.virtualSize += slideSize + spaceBetween;
	    prevSlideSize = slideSize;
	    index += 1;
	  }

	  swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;

	  if (rtl && wrongRTL && (params.effect === 'slide' || params.effect === 'coverflow')) {
	    $wrapperEl.css({
	      width: `${swiper.virtualSize + params.spaceBetween}px`
	    });
	  }

	  if (params.setWrapperSize) {
	    $wrapperEl.css({
	      [getDirectionLabel('width')]: `${swiper.virtualSize + params.spaceBetween}px`
	    });
	  }

	  if (gridEnabled) {
	    swiper.grid.updateWrapperSize(slideSize, snapGrid, getDirectionLabel);
	  } // Remove last grid elements depending on width


	  if (!params.centeredSlides) {
	    const newSlidesGrid = [];

	    for (let i = 0; i < snapGrid.length; i += 1) {
	      let slidesGridItem = snapGrid[i];
	      if (params.roundLengths) slidesGridItem = Math.floor(slidesGridItem);

	      if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
	        newSlidesGrid.push(slidesGridItem);
	      }
	    }

	    snapGrid = newSlidesGrid;

	    if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
	      snapGrid.push(swiper.virtualSize - swiperSize);
	    }
	  }

	  if (snapGrid.length === 0) snapGrid = [0];

	  if (params.spaceBetween !== 0) {
	    const key = swiper.isHorizontal() && rtl ? 'marginLeft' : getDirectionLabel('marginRight');
	    slides.filter((_, slideIndex) => {
	      if (!params.cssMode) return true;

	      if (slideIndex === slides.length - 1) {
	        return false;
	      }

	      return true;
	    }).css({
	      [key]: `${spaceBetween}px`
	    });
	  }

	  if (params.centeredSlides && params.centeredSlidesBounds) {
	    let allSlidesSize = 0;
	    slidesSizesGrid.forEach(slideSizeValue => {
	      allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
	    });
	    allSlidesSize -= params.spaceBetween;
	    const maxSnap = allSlidesSize - swiperSize;
	    snapGrid = snapGrid.map(snap => {
	      if (snap < 0) return -offsetBefore;
	      if (snap > maxSnap) return maxSnap + offsetAfter;
	      return snap;
	    });
	  }

	  if (params.centerInsufficientSlides) {
	    let allSlidesSize = 0;
	    slidesSizesGrid.forEach(slideSizeValue => {
	      allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
	    });
	    allSlidesSize -= params.spaceBetween;

	    if (allSlidesSize < swiperSize) {
	      const allSlidesOffset = (swiperSize - allSlidesSize) / 2;
	      snapGrid.forEach((snap, snapIndex) => {
	        snapGrid[snapIndex] = snap - allSlidesOffset;
	      });
	      slidesGrid.forEach((snap, snapIndex) => {
	        slidesGrid[snapIndex] = snap + allSlidesOffset;
	      });
	    }
	  }

	  Object.assign(swiper, {
	    slides,
	    snapGrid,
	    slidesGrid,
	    slidesSizesGrid
	  });

	  if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
	    setCSSProperty(swiper.wrapperEl, '--swiper-centered-offset-before', `${-snapGrid[0]}px`);
	    setCSSProperty(swiper.wrapperEl, '--swiper-centered-offset-after', `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`);
	    const addToSnapGrid = -swiper.snapGrid[0];
	    const addToSlidesGrid = -swiper.slidesGrid[0];
	    swiper.snapGrid = swiper.snapGrid.map(v => v + addToSnapGrid);
	    swiper.slidesGrid = swiper.slidesGrid.map(v => v + addToSlidesGrid);
	  }

	  if (slidesLength !== previousSlidesLength) {
	    swiper.emit('slidesLengthChange');
	  }

	  if (snapGrid.length !== previousSnapGridLength) {
	    if (swiper.params.watchOverflow) swiper.checkOverflow();
	    swiper.emit('snapGridLengthChange');
	  }

	  if (slidesGrid.length !== previousSlidesGridLength) {
	    swiper.emit('slidesGridLengthChange');
	  }

	  if (params.watchSlidesProgress) {
	    swiper.updateSlidesOffset();
	  }

	  if (!isVirtual && !params.cssMode && (params.effect === 'slide' || params.effect === 'fade')) {
	    const backFaceHiddenClass = `${params.containerModifierClass}backface-hidden`;
	    const hasClassBackfaceClassAdded = swiper.$el.hasClass(backFaceHiddenClass);

	    if (slidesLength <= params.maxBackfaceHiddenSlides) {
	      if (!hasClassBackfaceClassAdded) swiper.$el.addClass(backFaceHiddenClass);
	    } else if (hasClassBackfaceClassAdded) {
	      swiper.$el.removeClass(backFaceHiddenClass);
	    }
	  }
	}

	function updateAutoHeight(speed) {
	  const swiper = this;
	  const activeSlides = [];
	  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
	  let newHeight = 0;
	  let i;

	  if (typeof speed === 'number') {
	    swiper.setTransition(speed);
	  } else if (speed === true) {
	    swiper.setTransition(swiper.params.speed);
	  }

	  const getSlideByIndex = index => {
	    if (isVirtual) {
	      return swiper.slides.filter(el => parseInt(el.getAttribute('data-swiper-slide-index'), 10) === index)[0];
	    }

	    return swiper.slides.eq(index)[0];
	  }; // Find slides currently in view


	  if (swiper.params.slidesPerView !== 'auto' && swiper.params.slidesPerView > 1) {
	    if (swiper.params.centeredSlides) {
	      (swiper.visibleSlides || $([])).each(slide => {
	        activeSlides.push(slide);
	      });
	    } else {
	      for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
	        const index = swiper.activeIndex + i;
	        if (index > swiper.slides.length && !isVirtual) break;
	        activeSlides.push(getSlideByIndex(index));
	      }
	    }
	  } else {
	    activeSlides.push(getSlideByIndex(swiper.activeIndex));
	  } // Find new height from highest slide in view


	  for (i = 0; i < activeSlides.length; i += 1) {
	    if (typeof activeSlides[i] !== 'undefined') {
	      const height = activeSlides[i].offsetHeight;
	      newHeight = height > newHeight ? height : newHeight;
	    }
	  } // Update Height


	  if (newHeight || newHeight === 0) swiper.$wrapperEl.css('height', `${newHeight}px`);
	}

	function updateSlidesOffset() {
	  const swiper = this;
	  const slides = swiper.slides;

	  for (let i = 0; i < slides.length; i += 1) {
	    slides[i].swiperSlideOffset = swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop;
	  }
	}

	function updateSlidesProgress(translate = this && this.translate || 0) {
	  const swiper = this;
	  const params = swiper.params;
	  const {
	    slides,
	    rtlTranslate: rtl,
	    snapGrid
	  } = swiper;
	  if (slides.length === 0) return;
	  if (typeof slides[0].swiperSlideOffset === 'undefined') swiper.updateSlidesOffset();
	  let offsetCenter = -translate;
	  if (rtl) offsetCenter = translate; // Visible Slides

	  slides.removeClass(params.slideVisibleClass);
	  swiper.visibleSlidesIndexes = [];
	  swiper.visibleSlides = [];

	  for (let i = 0; i < slides.length; i += 1) {
	    const slide = slides[i];
	    let slideOffset = slide.swiperSlideOffset;

	    if (params.cssMode && params.centeredSlides) {
	      slideOffset -= slides[0].swiperSlideOffset;
	    }

	    const slideProgress = (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + params.spaceBetween);
	    const originalSlideProgress = (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + params.spaceBetween);
	    const slideBefore = -(offsetCenter - slideOffset);
	    const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
	    const isVisible = slideBefore >= 0 && slideBefore < swiper.size - 1 || slideAfter > 1 && slideAfter <= swiper.size || slideBefore <= 0 && slideAfter >= swiper.size;

	    if (isVisible) {
	      swiper.visibleSlides.push(slide);
	      swiper.visibleSlidesIndexes.push(i);
	      slides.eq(i).addClass(params.slideVisibleClass);
	    }

	    slide.progress = rtl ? -slideProgress : slideProgress;
	    slide.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
	  }

	  swiper.visibleSlides = $(swiper.visibleSlides);
	}

	function updateProgress(translate) {
	  const swiper = this;

	  if (typeof translate === 'undefined') {
	    const multiplier = swiper.rtlTranslate ? -1 : 1; // eslint-disable-next-line

	    translate = swiper && swiper.translate && swiper.translate * multiplier || 0;
	  }

	  const params = swiper.params;
	  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
	  let {
	    progress,
	    isBeginning,
	    isEnd
	  } = swiper;
	  const wasBeginning = isBeginning;
	  const wasEnd = isEnd;

	  if (translatesDiff === 0) {
	    progress = 0;
	    isBeginning = true;
	    isEnd = true;
	  } else {
	    progress = (translate - swiper.minTranslate()) / translatesDiff;
	    isBeginning = progress <= 0;
	    isEnd = progress >= 1;
	  }

	  Object.assign(swiper, {
	    progress,
	    isBeginning,
	    isEnd
	  });
	  if (params.watchSlidesProgress || params.centeredSlides && params.autoHeight) swiper.updateSlidesProgress(translate);

	  if (isBeginning && !wasBeginning) {
	    swiper.emit('reachBeginning toEdge');
	  }

	  if (isEnd && !wasEnd) {
	    swiper.emit('reachEnd toEdge');
	  }

	  if (wasBeginning && !isBeginning || wasEnd && !isEnd) {
	    swiper.emit('fromEdge');
	  }

	  swiper.emit('progress', progress);
	}

	function updateSlidesClasses() {
	  const swiper = this;
	  const {
	    slides,
	    params,
	    $wrapperEl,
	    activeIndex,
	    realIndex
	  } = swiper;
	  const isVirtual = swiper.virtual && params.virtual.enabled;
	  slides.removeClass(`${params.slideActiveClass} ${params.slideNextClass} ${params.slidePrevClass} ${params.slideDuplicateActiveClass} ${params.slideDuplicateNextClass} ${params.slideDuplicatePrevClass}`);
	  let activeSlide;

	  if (isVirtual) {
	    activeSlide = swiper.$wrapperEl.find(`.${params.slideClass}[data-swiper-slide-index="${activeIndex}"]`);
	  } else {
	    activeSlide = slides.eq(activeIndex);
	  } // Active classes


	  activeSlide.addClass(params.slideActiveClass);

	  if (params.loop) {
	    // Duplicate to all looped slides
	    if (activeSlide.hasClass(params.slideDuplicateClass)) {
	      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${realIndex}"]`).addClass(params.slideDuplicateActiveClass);
	    } else {
	      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${realIndex}"]`).addClass(params.slideDuplicateActiveClass);
	    }
	  } // Next Slide


	  let nextSlide = activeSlide.nextAll(`.${params.slideClass}`).eq(0).addClass(params.slideNextClass);

	  if (params.loop && nextSlide.length === 0) {
	    nextSlide = slides.eq(0);
	    nextSlide.addClass(params.slideNextClass);
	  } // Prev Slide


	  let prevSlide = activeSlide.prevAll(`.${params.slideClass}`).eq(0).addClass(params.slidePrevClass);

	  if (params.loop && prevSlide.length === 0) {
	    prevSlide = slides.eq(-1);
	    prevSlide.addClass(params.slidePrevClass);
	  }

	  if (params.loop) {
	    // Duplicate to all looped slides
	    if (nextSlide.hasClass(params.slideDuplicateClass)) {
	      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${nextSlide.attr('data-swiper-slide-index')}"]`).addClass(params.slideDuplicateNextClass);
	    } else {
	      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${nextSlide.attr('data-swiper-slide-index')}"]`).addClass(params.slideDuplicateNextClass);
	    }

	    if (prevSlide.hasClass(params.slideDuplicateClass)) {
	      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${prevSlide.attr('data-swiper-slide-index')}"]`).addClass(params.slideDuplicatePrevClass);
	    } else {
	      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${prevSlide.attr('data-swiper-slide-index')}"]`).addClass(params.slideDuplicatePrevClass);
	    }
	  }

	  swiper.emitSlidesClasses();
	}

	function updateActiveIndex(newActiveIndex) {
	  const swiper = this;
	  const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
	  const {
	    slidesGrid,
	    snapGrid,
	    params,
	    activeIndex: previousIndex,
	    realIndex: previousRealIndex,
	    snapIndex: previousSnapIndex
	  } = swiper;
	  let activeIndex = newActiveIndex;
	  let snapIndex;

	  if (typeof activeIndex === 'undefined') {
	    for (let i = 0; i < slidesGrid.length; i += 1) {
	      if (typeof slidesGrid[i + 1] !== 'undefined') {
	        if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2) {
	          activeIndex = i;
	        } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
	          activeIndex = i + 1;
	        }
	      } else if (translate >= slidesGrid[i]) {
	        activeIndex = i;
	      }
	    } // Normalize slideIndex


	    if (params.normalizeSlideIndex) {
	      if (activeIndex < 0 || typeof activeIndex === 'undefined') activeIndex = 0;
	    }
	  }

	  if (snapGrid.indexOf(translate) >= 0) {
	    snapIndex = snapGrid.indexOf(translate);
	  } else {
	    const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
	    snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
	  }

	  if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;

	  if (activeIndex === previousIndex) {
	    if (snapIndex !== previousSnapIndex) {
	      swiper.snapIndex = snapIndex;
	      swiper.emit('snapIndexChange');
	    }

	    return;
	  } // Get real index


	  const realIndex = parseInt(swiper.slides.eq(activeIndex).attr('data-swiper-slide-index') || activeIndex, 10);
	  Object.assign(swiper, {
	    snapIndex,
	    realIndex,
	    previousIndex,
	    activeIndex
	  });
	  swiper.emit('activeIndexChange');
	  swiper.emit('snapIndexChange');

	  if (previousRealIndex !== realIndex) {
	    swiper.emit('realIndexChange');
	  }

	  if (swiper.initialized || swiper.params.runCallbacksOnInit) {
	    swiper.emit('slideChange');
	  }
	}

	function updateClickedSlide(e) {
	  const swiper = this;
	  const params = swiper.params;
	  const slide = $(e).closest(`.${params.slideClass}`)[0];
	  let slideFound = false;
	  let slideIndex;

	  if (slide) {
	    for (let i = 0; i < swiper.slides.length; i += 1) {
	      if (swiper.slides[i] === slide) {
	        slideFound = true;
	        slideIndex = i;
	        break;
	      }
	    }
	  }

	  if (slide && slideFound) {
	    swiper.clickedSlide = slide;

	    if (swiper.virtual && swiper.params.virtual.enabled) {
	      swiper.clickedIndex = parseInt($(slide).attr('data-swiper-slide-index'), 10);
	    } else {
	      swiper.clickedIndex = slideIndex;
	    }
	  } else {
	    swiper.clickedSlide = undefined;
	    swiper.clickedIndex = undefined;
	    return;
	  }

	  if (params.slideToClickedSlide && swiper.clickedIndex !== undefined && swiper.clickedIndex !== swiper.activeIndex) {
	    swiper.slideToClickedSlide();
	  }
	}

	var update = {
	  updateSize,
	  updateSlides,
	  updateAutoHeight,
	  updateSlidesOffset,
	  updateSlidesProgress,
	  updateProgress,
	  updateSlidesClasses,
	  updateActiveIndex,
	  updateClickedSlide
	};

	function getSwiperTranslate(axis = this.isHorizontal() ? 'x' : 'y') {
	  const swiper = this;
	  const {
	    params,
	    rtlTranslate: rtl,
	    translate,
	    $wrapperEl
	  } = swiper;

	  if (params.virtualTranslate) {
	    return rtl ? -translate : translate;
	  }

	  if (params.cssMode) {
	    return translate;
	  }

	  let currentTranslate = getTranslate($wrapperEl[0], axis);
	  if (rtl) currentTranslate = -currentTranslate;
	  return currentTranslate || 0;
	}

	function setTranslate(translate, byController) {
	  const swiper = this;
	  const {
	    rtlTranslate: rtl,
	    params,
	    $wrapperEl,
	    wrapperEl,
	    progress
	  } = swiper;
	  let x = 0;
	  let y = 0;
	  const z = 0;

	  if (swiper.isHorizontal()) {
	    x = rtl ? -translate : translate;
	  } else {
	    y = translate;
	  }

	  if (params.roundLengths) {
	    x = Math.floor(x);
	    y = Math.floor(y);
	  }

	  if (params.cssMode) {
	    wrapperEl[swiper.isHorizontal() ? 'scrollLeft' : 'scrollTop'] = swiper.isHorizontal() ? -x : -y;
	  } else if (!params.virtualTranslate) {
	    $wrapperEl.transform(`translate3d(${x}px, ${y}px, ${z}px)`);
	  }

	  swiper.previousTranslate = swiper.translate;
	  swiper.translate = swiper.isHorizontal() ? x : y; // Check if we need to update progress

	  let newProgress;
	  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();

	  if (translatesDiff === 0) {
	    newProgress = 0;
	  } else {
	    newProgress = (translate - swiper.minTranslate()) / translatesDiff;
	  }

	  if (newProgress !== progress) {
	    swiper.updateProgress(translate);
	  }

	  swiper.emit('setTranslate', swiper.translate, byController);
	}

	function minTranslate() {
	  return -this.snapGrid[0];
	}

	function maxTranslate() {
	  return -this.snapGrid[this.snapGrid.length - 1];
	}

	function translateTo(translate = 0, speed = this.params.speed, runCallbacks = true, translateBounds = true, internal) {
	  const swiper = this;
	  const {
	    params,
	    wrapperEl
	  } = swiper;

	  if (swiper.animating && params.preventInteractionOnTransition) {
	    return false;
	  }

	  const minTranslate = swiper.minTranslate();
	  const maxTranslate = swiper.maxTranslate();
	  let newTranslate;
	  if (translateBounds && translate > minTranslate) newTranslate = minTranslate;else if (translateBounds && translate < maxTranslate) newTranslate = maxTranslate;else newTranslate = translate; // Update progress

	  swiper.updateProgress(newTranslate);

	  if (params.cssMode) {
	    const isH = swiper.isHorizontal();

	    if (speed === 0) {
	      wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = -newTranslate;
	    } else {
	      if (!swiper.support.smoothScroll) {
	        animateCSSModeScroll({
	          swiper,
	          targetPosition: -newTranslate,
	          side: isH ? 'left' : 'top'
	        });
	        return true;
	      }

	      wrapperEl.scrollTo({
	        [isH ? 'left' : 'top']: -newTranslate,
	        behavior: 'smooth'
	      });
	    }

	    return true;
	  }

	  if (speed === 0) {
	    swiper.setTransition(0);
	    swiper.setTranslate(newTranslate);

	    if (runCallbacks) {
	      swiper.emit('beforeTransitionStart', speed, internal);
	      swiper.emit('transitionEnd');
	    }
	  } else {
	    swiper.setTransition(speed);
	    swiper.setTranslate(newTranslate);

	    if (runCallbacks) {
	      swiper.emit('beforeTransitionStart', speed, internal);
	      swiper.emit('transitionStart');
	    }

	    if (!swiper.animating) {
	      swiper.animating = true;

	      if (!swiper.onTranslateToWrapperTransitionEnd) {
	        swiper.onTranslateToWrapperTransitionEnd = function transitionEnd(e) {
	          if (!swiper || swiper.destroyed) return;
	          if (e.target !== this) return;
	          swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
	          swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.onTranslateToWrapperTransitionEnd);
	          swiper.onTranslateToWrapperTransitionEnd = null;
	          delete swiper.onTranslateToWrapperTransitionEnd;

	          if (runCallbacks) {
	            swiper.emit('transitionEnd');
	          }
	        };
	      }

	      swiper.$wrapperEl[0].addEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
	      swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.onTranslateToWrapperTransitionEnd);
	    }
	  }

	  return true;
	}

	var translate = {
	  getTranslate: getSwiperTranslate,
	  setTranslate,
	  minTranslate,
	  maxTranslate,
	  translateTo
	};

	function setTransition(duration, byController) {
	  const swiper = this;

	  if (!swiper.params.cssMode) {
	    swiper.$wrapperEl.transition(duration);
	  }

	  swiper.emit('setTransition', duration, byController);
	}

	function transitionEmit({
	  swiper,
	  runCallbacks,
	  direction,
	  step
	}) {
	  const {
	    activeIndex,
	    previousIndex
	  } = swiper;
	  let dir = direction;

	  if (!dir) {
	    if (activeIndex > previousIndex) dir = 'next';else if (activeIndex < previousIndex) dir = 'prev';else dir = 'reset';
	  }

	  swiper.emit(`transition${step}`);

	  if (runCallbacks && activeIndex !== previousIndex) {
	    if (dir === 'reset') {
	      swiper.emit(`slideResetTransition${step}`);
	      return;
	    }

	    swiper.emit(`slideChangeTransition${step}`);

	    if (dir === 'next') {
	      swiper.emit(`slideNextTransition${step}`);
	    } else {
	      swiper.emit(`slidePrevTransition${step}`);
	    }
	  }
	}

	function transitionStart(runCallbacks = true, direction) {
	  const swiper = this;
	  const {
	    params
	  } = swiper;
	  if (params.cssMode) return;

	  if (params.autoHeight) {
	    swiper.updateAutoHeight();
	  }

	  transitionEmit({
	    swiper,
	    runCallbacks,
	    direction,
	    step: 'Start'
	  });
	}

	function transitionEnd(runCallbacks = true, direction) {
	  const swiper = this;
	  const {
	    params
	  } = swiper;
	  swiper.animating = false;
	  if (params.cssMode) return;
	  swiper.setTransition(0);
	  transitionEmit({
	    swiper,
	    runCallbacks,
	    direction,
	    step: 'End'
	  });
	}

	var transition = {
	  setTransition,
	  transitionStart,
	  transitionEnd
	};

	function slideTo(index = 0, speed = this.params.speed, runCallbacks = true, internal, initial) {
	  if (typeof index !== 'number' && typeof index !== 'string') {
	    throw new Error(`The 'index' argument cannot have type other than 'number' or 'string'. [${typeof index}] given.`);
	  }

	  if (typeof index === 'string') {
	    /**
	     * The `index` argument converted from `string` to `number`.
	     * @type {number}
	     */
	    const indexAsNumber = parseInt(index, 10);
	    /**
	     * Determines whether the `index` argument is a valid `number`
	     * after being converted from the `string` type.
	     * @type {boolean}
	     */

	    const isValidNumber = isFinite(indexAsNumber);

	    if (!isValidNumber) {
	      throw new Error(`The passed-in 'index' (string) couldn't be converted to 'number'. [${index}] given.`);
	    } // Knowing that the converted `index` is a valid number,
	    // we can update the original argument's value.


	    index = indexAsNumber;
	  }

	  const swiper = this;
	  let slideIndex = index;
	  if (slideIndex < 0) slideIndex = 0;
	  const {
	    params,
	    snapGrid,
	    slidesGrid,
	    previousIndex,
	    activeIndex,
	    rtlTranslate: rtl,
	    wrapperEl,
	    enabled
	  } = swiper;

	  if (swiper.animating && params.preventInteractionOnTransition || !enabled && !internal && !initial) {
	    return false;
	  }

	  const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
	  let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
	  if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
	  const translate = -snapGrid[snapIndex]; // Normalize slideIndex

	  if (params.normalizeSlideIndex) {
	    for (let i = 0; i < slidesGrid.length; i += 1) {
	      const normalizedTranslate = -Math.floor(translate * 100);
	      const normalizedGrid = Math.floor(slidesGrid[i] * 100);
	      const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);

	      if (typeof slidesGrid[i + 1] !== 'undefined') {
	        if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2) {
	          slideIndex = i;
	        } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
	          slideIndex = i + 1;
	        }
	      } else if (normalizedTranslate >= normalizedGrid) {
	        slideIndex = i;
	      }
	    }
	  } // Directions locks


	  if (swiper.initialized && slideIndex !== activeIndex) {
	    if (!swiper.allowSlideNext && translate < swiper.translate && translate < swiper.minTranslate()) {
	      return false;
	    }

	    if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
	      if ((activeIndex || 0) !== slideIndex) return false;
	    }
	  }

	  if (slideIndex !== (previousIndex || 0) && runCallbacks) {
	    swiper.emit('beforeSlideChangeStart');
	  } // Update progress


	  swiper.updateProgress(translate);
	  let direction;
	  if (slideIndex > activeIndex) direction = 'next';else if (slideIndex < activeIndex) direction = 'prev';else direction = 'reset'; // Update Index

	  if (rtl && -translate === swiper.translate || !rtl && translate === swiper.translate) {
	    swiper.updateActiveIndex(slideIndex); // Update Height

	    if (params.autoHeight) {
	      swiper.updateAutoHeight();
	    }

	    swiper.updateSlidesClasses();

	    if (params.effect !== 'slide') {
	      swiper.setTranslate(translate);
	    }

	    if (direction !== 'reset') {
	      swiper.transitionStart(runCallbacks, direction);
	      swiper.transitionEnd(runCallbacks, direction);
	    }

	    return false;
	  }

	  if (params.cssMode) {
	    const isH = swiper.isHorizontal();
	    const t = rtl ? translate : -translate;

	    if (speed === 0) {
	      const isVirtual = swiper.virtual && swiper.params.virtual.enabled;

	      if (isVirtual) {
	        swiper.wrapperEl.style.scrollSnapType = 'none';
	        swiper._immediateVirtual = true;
	      }

	      wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = t;

	      if (isVirtual) {
	        requestAnimationFrame(() => {
	          swiper.wrapperEl.style.scrollSnapType = '';
	          swiper._swiperImmediateVirtual = false;
	        });
	      }
	    } else {
	      if (!swiper.support.smoothScroll) {
	        animateCSSModeScroll({
	          swiper,
	          targetPosition: t,
	          side: isH ? 'left' : 'top'
	        });
	        return true;
	      }

	      wrapperEl.scrollTo({
	        [isH ? 'left' : 'top']: t,
	        behavior: 'smooth'
	      });
	    }

	    return true;
	  }

	  swiper.setTransition(speed);
	  swiper.setTranslate(translate);
	  swiper.updateActiveIndex(slideIndex);
	  swiper.updateSlidesClasses();
	  swiper.emit('beforeTransitionStart', speed, internal);
	  swiper.transitionStart(runCallbacks, direction);

	  if (speed === 0) {
	    swiper.transitionEnd(runCallbacks, direction);
	  } else if (!swiper.animating) {
	    swiper.animating = true;

	    if (!swiper.onSlideToWrapperTransitionEnd) {
	      swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
	        if (!swiper || swiper.destroyed) return;
	        if (e.target !== this) return;
	        swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
	        swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
	        swiper.onSlideToWrapperTransitionEnd = null;
	        delete swiper.onSlideToWrapperTransitionEnd;
	        swiper.transitionEnd(runCallbacks, direction);
	      };
	    }

	    swiper.$wrapperEl[0].addEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
	    swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
	  }

	  return true;
	}

	function slideToLoop(index = 0, speed = this.params.speed, runCallbacks = true, internal) {
	  if (typeof index === 'string') {
	    /**
	     * The `index` argument converted from `string` to `number`.
	     * @type {number}
	     */
	    const indexAsNumber = parseInt(index, 10);
	    /**
	     * Determines whether the `index` argument is a valid `number`
	     * after being converted from the `string` type.
	     * @type {boolean}
	     */

	    const isValidNumber = isFinite(indexAsNumber);

	    if (!isValidNumber) {
	      throw new Error(`The passed-in 'index' (string) couldn't be converted to 'number'. [${index}] given.`);
	    } // Knowing that the converted `index` is a valid number,
	    // we can update the original argument's value.


	    index = indexAsNumber;
	  }

	  const swiper = this;
	  let newIndex = index;

	  if (swiper.params.loop) {
	    newIndex += swiper.loopedSlides;
	  }

	  return swiper.slideTo(newIndex, speed, runCallbacks, internal);
	}

	/* eslint no-unused-vars: "off" */
	function slideNext(speed = this.params.speed, runCallbacks = true, internal) {
	  const swiper = this;
	  const {
	    animating,
	    enabled,
	    params
	  } = swiper;
	  if (!enabled) return swiper;
	  let perGroup = params.slidesPerGroup;

	  if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
	    perGroup = Math.max(swiper.slidesPerViewDynamic('current', true), 1);
	  }

	  const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;

	  if (params.loop) {
	    if (animating && params.loopPreventsSlide) return false;
	    swiper.loopFix(); // eslint-disable-next-line

	    swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
	  }

	  if (params.rewind && swiper.isEnd) {
	    return swiper.slideTo(0, speed, runCallbacks, internal);
	  }

	  return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
	}

	/* eslint no-unused-vars: "off" */
	function slidePrev(speed = this.params.speed, runCallbacks = true, internal) {
	  const swiper = this;
	  const {
	    params,
	    animating,
	    snapGrid,
	    slidesGrid,
	    rtlTranslate,
	    enabled
	  } = swiper;
	  if (!enabled) return swiper;

	  if (params.loop) {
	    if (animating && params.loopPreventsSlide) return false;
	    swiper.loopFix(); // eslint-disable-next-line

	    swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
	  }

	  const translate = rtlTranslate ? swiper.translate : -swiper.translate;

	  function normalize(val) {
	    if (val < 0) return -Math.floor(Math.abs(val));
	    return Math.floor(val);
	  }

	  const normalizedTranslate = normalize(translate);
	  const normalizedSnapGrid = snapGrid.map(val => normalize(val));
	  let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];

	  if (typeof prevSnap === 'undefined' && params.cssMode) {
	    let prevSnapIndex;
	    snapGrid.forEach((snap, snapIndex) => {
	      if (normalizedTranslate >= snap) {
	        // prevSnap = snap;
	        prevSnapIndex = snapIndex;
	      }
	    });

	    if (typeof prevSnapIndex !== 'undefined') {
	      prevSnap = snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
	    }
	  }

	  let prevIndex = 0;

	  if (typeof prevSnap !== 'undefined') {
	    prevIndex = slidesGrid.indexOf(prevSnap);
	    if (prevIndex < 0) prevIndex = swiper.activeIndex - 1;

	    if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
	      prevIndex = prevIndex - swiper.slidesPerViewDynamic('previous', true) + 1;
	      prevIndex = Math.max(prevIndex, 0);
	    }
	  }

	  if (params.rewind && swiper.isBeginning) {
	    const lastIndex = swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
	    return swiper.slideTo(lastIndex, speed, runCallbacks, internal);
	  }

	  return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
	}

	/* eslint no-unused-vars: "off" */
	function slideReset(speed = this.params.speed, runCallbacks = true, internal) {
	  const swiper = this;
	  return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
	}

	/* eslint no-unused-vars: "off" */
	function slideToClosest(speed = this.params.speed, runCallbacks = true, internal, threshold = 0.5) {
	  const swiper = this;
	  let index = swiper.activeIndex;
	  const skip = Math.min(swiper.params.slidesPerGroupSkip, index);
	  const snapIndex = skip + Math.floor((index - skip) / swiper.params.slidesPerGroup);
	  const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;

	  if (translate >= swiper.snapGrid[snapIndex]) {
	    // The current translate is on or after the current snap index, so the choice
	    // is between the current index and the one after it.
	    const currentSnap = swiper.snapGrid[snapIndex];
	    const nextSnap = swiper.snapGrid[snapIndex + 1];

	    if (translate - currentSnap > (nextSnap - currentSnap) * threshold) {
	      index += swiper.params.slidesPerGroup;
	    }
	  } else {
	    // The current translate is before the current snap index, so the choice
	    // is between the current index and the one before it.
	    const prevSnap = swiper.snapGrid[snapIndex - 1];
	    const currentSnap = swiper.snapGrid[snapIndex];

	    if (translate - prevSnap <= (currentSnap - prevSnap) * threshold) {
	      index -= swiper.params.slidesPerGroup;
	    }
	  }

	  index = Math.max(index, 0);
	  index = Math.min(index, swiper.slidesGrid.length - 1);
	  return swiper.slideTo(index, speed, runCallbacks, internal);
	}

	function slideToClickedSlide() {
	  const swiper = this;
	  const {
	    params,
	    $wrapperEl
	  } = swiper;
	  const slidesPerView = params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : params.slidesPerView;
	  let slideToIndex = swiper.clickedIndex;
	  let realIndex;

	  if (params.loop) {
	    if (swiper.animating) return;
	    realIndex = parseInt($(swiper.clickedSlide).attr('data-swiper-slide-index'), 10);

	    if (params.centeredSlides) {
	      if (slideToIndex < swiper.loopedSlides - slidesPerView / 2 || slideToIndex > swiper.slides.length - swiper.loopedSlides + slidesPerView / 2) {
	        swiper.loopFix();
	        slideToIndex = $wrapperEl.children(`.${params.slideClass}[data-swiper-slide-index="${realIndex}"]:not(.${params.slideDuplicateClass})`).eq(0).index();
	        nextTick(() => {
	          swiper.slideTo(slideToIndex);
	        });
	      } else {
	        swiper.slideTo(slideToIndex);
	      }
	    } else if (slideToIndex > swiper.slides.length - slidesPerView) {
	      swiper.loopFix();
	      slideToIndex = $wrapperEl.children(`.${params.slideClass}[data-swiper-slide-index="${realIndex}"]:not(.${params.slideDuplicateClass})`).eq(0).index();
	      nextTick(() => {
	        swiper.slideTo(slideToIndex);
	      });
	    } else {
	      swiper.slideTo(slideToIndex);
	    }
	  } else {
	    swiper.slideTo(slideToIndex);
	  }
	}

	var slide = {
	  slideTo,
	  slideToLoop,
	  slideNext,
	  slidePrev,
	  slideReset,
	  slideToClosest,
	  slideToClickedSlide
	};

	function loopCreate() {
	  const swiper = this;
	  const document = getDocument();
	  const {
	    params,
	    $wrapperEl
	  } = swiper; // Remove duplicated slides

	  const $selector = $wrapperEl.children().length > 0 ? $($wrapperEl.children()[0].parentNode) : $wrapperEl;
	  $selector.children(`.${params.slideClass}.${params.slideDuplicateClass}`).remove();
	  let slides = $selector.children(`.${params.slideClass}`);

	  if (params.loopFillGroupWithBlank) {
	    const blankSlidesNum = params.slidesPerGroup - slides.length % params.slidesPerGroup;

	    if (blankSlidesNum !== params.slidesPerGroup) {
	      for (let i = 0; i < blankSlidesNum; i += 1) {
	        const blankNode = $(document.createElement('div')).addClass(`${params.slideClass} ${params.slideBlankClass}`);
	        $selector.append(blankNode);
	      }

	      slides = $selector.children(`.${params.slideClass}`);
	    }
	  }

	  if (params.slidesPerView === 'auto' && !params.loopedSlides) params.loopedSlides = slides.length;
	  swiper.loopedSlides = Math.ceil(parseFloat(params.loopedSlides || params.slidesPerView, 10));
	  swiper.loopedSlides += params.loopAdditionalSlides;

	  if (swiper.loopedSlides > slides.length && swiper.params.loopedSlidesLimit) {
	    swiper.loopedSlides = slides.length;
	  }

	  const prependSlides = [];
	  const appendSlides = [];
	  slides.each((el, index) => {
	    const slide = $(el);
	    slide.attr('data-swiper-slide-index', index);
	  });

	  for (let i = 0; i < swiper.loopedSlides; i += 1) {
	    const index = i - Math.floor(i / slides.length) * slides.length;
	    appendSlides.push(slides.eq(index)[0]);
	    prependSlides.unshift(slides.eq(slides.length - index - 1)[0]);
	  }

	  for (let i = 0; i < appendSlides.length; i += 1) {
	    $selector.append($(appendSlides[i].cloneNode(true)).addClass(params.slideDuplicateClass));
	  }

	  for (let i = prependSlides.length - 1; i >= 0; i -= 1) {
	    $selector.prepend($(prependSlides[i].cloneNode(true)).addClass(params.slideDuplicateClass));
	  }
	}

	function loopFix() {
	  const swiper = this;
	  swiper.emit('beforeLoopFix');
	  const {
	    activeIndex,
	    slides,
	    loopedSlides,
	    allowSlidePrev,
	    allowSlideNext,
	    snapGrid,
	    rtlTranslate: rtl
	  } = swiper;
	  let newIndex;
	  swiper.allowSlidePrev = true;
	  swiper.allowSlideNext = true;
	  const snapTranslate = -snapGrid[activeIndex];
	  const diff = snapTranslate - swiper.getTranslate(); // Fix For Negative Oversliding

	  if (activeIndex < loopedSlides) {
	    newIndex = slides.length - loopedSlides * 3 + activeIndex;
	    newIndex += loopedSlides;
	    const slideChanged = swiper.slideTo(newIndex, 0, false, true);

	    if (slideChanged && diff !== 0) {
	      swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
	    }
	  } else if (activeIndex >= slides.length - loopedSlides) {
	    // Fix For Positive Oversliding
	    newIndex = -slides.length + activeIndex + loopedSlides;
	    newIndex += loopedSlides;
	    const slideChanged = swiper.slideTo(newIndex, 0, false, true);

	    if (slideChanged && diff !== 0) {
	      swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
	    }
	  }

	  swiper.allowSlidePrev = allowSlidePrev;
	  swiper.allowSlideNext = allowSlideNext;
	  swiper.emit('loopFix');
	}

	function loopDestroy() {
	  const swiper = this;
	  const {
	    $wrapperEl,
	    params,
	    slides
	  } = swiper;
	  $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass},.${params.slideClass}.${params.slideBlankClass}`).remove();
	  slides.removeAttr('data-swiper-slide-index');
	}

	var loop = {
	  loopCreate,
	  loopFix,
	  loopDestroy
	};

	function setGrabCursor(moving) {
	  const swiper = this;
	  if (swiper.support.touch || !swiper.params.simulateTouch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) return;
	  const el = swiper.params.touchEventsTarget === 'container' ? swiper.el : swiper.wrapperEl;
	  el.style.cursor = 'move';
	  el.style.cursor = moving ? 'grabbing' : 'grab';
	}

	function unsetGrabCursor() {
	  const swiper = this;

	  if (swiper.support.touch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) {
	    return;
	  }

	  swiper[swiper.params.touchEventsTarget === 'container' ? 'el' : 'wrapperEl'].style.cursor = '';
	}

	var grabCursor = {
	  setGrabCursor,
	  unsetGrabCursor
	};

	function closestElement(selector, base = this) {
	  function __closestFrom(el) {
	    if (!el || el === getDocument() || el === getWindow()) return null;
	    if (el.assignedSlot) el = el.assignedSlot;
	    const found = el.closest(selector);

	    if (!found && !el.getRootNode) {
	      return null;
	    }

	    return found || __closestFrom(el.getRootNode().host);
	  }

	  return __closestFrom(base);
	}

	function onTouchStart(event) {
	  const swiper = this;
	  const document = getDocument();
	  const window = getWindow();
	  const data = swiper.touchEventsData;
	  const {
	    params,
	    touches,
	    enabled
	  } = swiper;
	  if (!enabled) return;

	  if (swiper.animating && params.preventInteractionOnTransition) {
	    return;
	  }

	  if (!swiper.animating && params.cssMode && params.loop) {
	    swiper.loopFix();
	  }

	  let e = event;
	  if (e.originalEvent) e = e.originalEvent;
	  let $targetEl = $(e.target);

	  if (params.touchEventsTarget === 'wrapper') {
	    if (!$targetEl.closest(swiper.wrapperEl).length) return;
	  }

	  data.isTouchEvent = e.type === 'touchstart';
	  if (!data.isTouchEvent && 'which' in e && e.which === 3) return;
	  if (!data.isTouchEvent && 'button' in e && e.button > 0) return;
	  if (data.isTouched && data.isMoved) return; // change target el for shadow root component

	  const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== ''; // eslint-disable-next-line

	  const eventPath = event.composedPath ? event.composedPath() : event.path;

	  if (swipingClassHasValue && e.target && e.target.shadowRoot && eventPath) {
	    $targetEl = $(eventPath[0]);
	  }

	  const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
	  const isTargetShadow = !!(e.target && e.target.shadowRoot); // use closestElement for shadow root element to get the actual closest for nested shadow root element

	  if (params.noSwiping && (isTargetShadow ? closestElement(noSwipingSelector, $targetEl[0]) : $targetEl.closest(noSwipingSelector)[0])) {
	    swiper.allowClick = true;
	    return;
	  }

	  if (params.swipeHandler) {
	    if (!$targetEl.closest(params.swipeHandler)[0]) return;
	  }

	  touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
	  touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
	  const startX = touches.currentX;
	  const startY = touches.currentY; // Do NOT start if iOS edge swipe is detected. Otherwise iOS app cannot swipe-to-go-back anymore

	  const edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
	  const edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;

	  if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window.innerWidth - edgeSwipeThreshold)) {
	    if (edgeSwipeDetection === 'prevent') {
	      event.preventDefault();
	    } else {
	      return;
	    }
	  }

	  Object.assign(data, {
	    isTouched: true,
	    isMoved: false,
	    allowTouchCallbacks: true,
	    isScrolling: undefined,
	    startMoving: undefined
	  });
	  touches.startX = startX;
	  touches.startY = startY;
	  data.touchStartTime = now();
	  swiper.allowClick = true;
	  swiper.updateSize();
	  swiper.swipeDirection = undefined;
	  if (params.threshold > 0) data.allowThresholdMove = false;

	  if (e.type !== 'touchstart') {
	    let preventDefault = true;

	    if ($targetEl.is(data.focusableElements)) {
	      preventDefault = false;

	      if ($targetEl[0].nodeName === 'SELECT') {
	        data.isTouched = false;
	      }
	    }

	    if (document.activeElement && $(document.activeElement).is(data.focusableElements) && document.activeElement !== $targetEl[0]) {
	      document.activeElement.blur();
	    }

	    const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;

	    if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !$targetEl[0].isContentEditable) {
	      e.preventDefault();
	    }
	  }

	  if (swiper.params.freeMode && swiper.params.freeMode.enabled && swiper.freeMode && swiper.animating && !params.cssMode) {
	    swiper.freeMode.onTouchStart();
	  }

	  swiper.emit('touchStart', e);
	}

	function onTouchMove(event) {
	  const document = getDocument();
	  const swiper = this;
	  const data = swiper.touchEventsData;
	  const {
	    params,
	    touches,
	    rtlTranslate: rtl,
	    enabled
	  } = swiper;
	  if (!enabled) return;
	  let e = event;
	  if (e.originalEvent) e = e.originalEvent;

	  if (!data.isTouched) {
	    if (data.startMoving && data.isScrolling) {
	      swiper.emit('touchMoveOpposite', e);
	    }

	    return;
	  }

	  if (data.isTouchEvent && e.type !== 'touchmove') return;
	  const targetTouch = e.type === 'touchmove' && e.targetTouches && (e.targetTouches[0] || e.changedTouches[0]);
	  const pageX = e.type === 'touchmove' ? targetTouch.pageX : e.pageX;
	  const pageY = e.type === 'touchmove' ? targetTouch.pageY : e.pageY;

	  if (e.preventedByNestedSwiper) {
	    touches.startX = pageX;
	    touches.startY = pageY;
	    return;
	  }

	  if (!swiper.allowTouchMove) {
	    if (!$(e.target).is(data.focusableElements)) {
	      swiper.allowClick = false;
	    }

	    if (data.isTouched) {
	      Object.assign(touches, {
	        startX: pageX,
	        startY: pageY,
	        currentX: pageX,
	        currentY: pageY
	      });
	      data.touchStartTime = now();
	    }

	    return;
	  }

	  if (data.isTouchEvent && params.touchReleaseOnEdges && !params.loop) {
	    if (swiper.isVertical()) {
	      // Vertical
	      if (pageY < touches.startY && swiper.translate <= swiper.maxTranslate() || pageY > touches.startY && swiper.translate >= swiper.minTranslate()) {
	        data.isTouched = false;
	        data.isMoved = false;
	        return;
	      }
	    } else if (pageX < touches.startX && swiper.translate <= swiper.maxTranslate() || pageX > touches.startX && swiper.translate >= swiper.minTranslate()) {
	      return;
	    }
	  }

	  if (data.isTouchEvent && document.activeElement) {
	    if (e.target === document.activeElement && $(e.target).is(data.focusableElements)) {
	      data.isMoved = true;
	      swiper.allowClick = false;
	      return;
	    }
	  }

	  if (data.allowTouchCallbacks) {
	    swiper.emit('touchMove', e);
	  }

	  if (e.targetTouches && e.targetTouches.length > 1) return;
	  touches.currentX = pageX;
	  touches.currentY = pageY;
	  const diffX = touches.currentX - touches.startX;
	  const diffY = touches.currentY - touches.startY;
	  if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold) return;

	  if (typeof data.isScrolling === 'undefined') {
	    let touchAngle;

	    if (swiper.isHorizontal() && touches.currentY === touches.startY || swiper.isVertical() && touches.currentX === touches.startX) {
	      data.isScrolling = false;
	    } else {
	      // eslint-disable-next-line
	      if (diffX * diffX + diffY * diffY >= 25) {
	        touchAngle = Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180 / Math.PI;
	        data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : 90 - touchAngle > params.touchAngle;
	      }
	    }
	  }

	  if (data.isScrolling) {
	    swiper.emit('touchMoveOpposite', e);
	  }

	  if (typeof data.startMoving === 'undefined') {
	    if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
	      data.startMoving = true;
	    }
	  }

	  if (data.isScrolling) {
	    data.isTouched = false;
	    return;
	  }

	  if (!data.startMoving) {
	    return;
	  }

	  swiper.allowClick = false;

	  if (!params.cssMode && e.cancelable) {
	    e.preventDefault();
	  }

	  if (params.touchMoveStopPropagation && !params.nested) {
	    e.stopPropagation();
	  }

	  if (!data.isMoved) {
	    if (params.loop && !params.cssMode) {
	      swiper.loopFix();
	    }

	    data.startTranslate = swiper.getTranslate();
	    swiper.setTransition(0);

	    if (swiper.animating) {
	      swiper.$wrapperEl.trigger('webkitTransitionEnd transitionend');
	    }

	    data.allowMomentumBounce = false; // Grab Cursor

	    if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
	      swiper.setGrabCursor(true);
	    }

	    swiper.emit('sliderFirstMove', e);
	  }

	  swiper.emit('sliderMove', e);
	  data.isMoved = true;
	  let diff = swiper.isHorizontal() ? diffX : diffY;
	  touches.diff = diff;
	  diff *= params.touchRatio;
	  if (rtl) diff = -diff;
	  swiper.swipeDirection = diff > 0 ? 'prev' : 'next';
	  data.currentTranslate = diff + data.startTranslate;
	  let disableParentSwiper = true;
	  let resistanceRatio = params.resistanceRatio;

	  if (params.touchReleaseOnEdges) {
	    resistanceRatio = 0;
	  }

	  if (diff > 0 && data.currentTranslate > swiper.minTranslate()) {
	    disableParentSwiper = false;
	    if (params.resistance) data.currentTranslate = swiper.minTranslate() - 1 + (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
	  } else if (diff < 0 && data.currentTranslate < swiper.maxTranslate()) {
	    disableParentSwiper = false;
	    if (params.resistance) data.currentTranslate = swiper.maxTranslate() + 1 - (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
	  }

	  if (disableParentSwiper) {
	    e.preventedByNestedSwiper = true;
	  } // Directions locks


	  if (!swiper.allowSlideNext && swiper.swipeDirection === 'next' && data.currentTranslate < data.startTranslate) {
	    data.currentTranslate = data.startTranslate;
	  }

	  if (!swiper.allowSlidePrev && swiper.swipeDirection === 'prev' && data.currentTranslate > data.startTranslate) {
	    data.currentTranslate = data.startTranslate;
	  }

	  if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
	    data.currentTranslate = data.startTranslate;
	  } // Threshold


	  if (params.threshold > 0) {
	    if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
	      if (!data.allowThresholdMove) {
	        data.allowThresholdMove = true;
	        touches.startX = touches.currentX;
	        touches.startY = touches.currentY;
	        data.currentTranslate = data.startTranslate;
	        touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
	        return;
	      }
	    } else {
	      data.currentTranslate = data.startTranslate;
	      return;
	    }
	  }

	  if (!params.followFinger || params.cssMode) return; // Update active index in free mode

	  if (params.freeMode && params.freeMode.enabled && swiper.freeMode || params.watchSlidesProgress) {
	    swiper.updateActiveIndex();
	    swiper.updateSlidesClasses();
	  }

	  if (swiper.params.freeMode && params.freeMode.enabled && swiper.freeMode) {
	    swiper.freeMode.onTouchMove();
	  } // Update progress


	  swiper.updateProgress(data.currentTranslate); // Update translate

	  swiper.setTranslate(data.currentTranslate);
	}

	function onTouchEnd(event) {
	  const swiper = this;
	  const data = swiper.touchEventsData;
	  const {
	    params,
	    touches,
	    rtlTranslate: rtl,
	    slidesGrid,
	    enabled
	  } = swiper;
	  if (!enabled) return;
	  let e = event;
	  if (e.originalEvent) e = e.originalEvent;

	  if (data.allowTouchCallbacks) {
	    swiper.emit('touchEnd', e);
	  }

	  data.allowTouchCallbacks = false;

	  if (!data.isTouched) {
	    if (data.isMoved && params.grabCursor) {
	      swiper.setGrabCursor(false);
	    }

	    data.isMoved = false;
	    data.startMoving = false;
	    return;
	  } // Return Grab Cursor


	  if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
	    swiper.setGrabCursor(false);
	  } // Time diff


	  const touchEndTime = now();
	  const timeDiff = touchEndTime - data.touchStartTime; // Tap, doubleTap, Click

	  if (swiper.allowClick) {
	    const pathTree = e.path || e.composedPath && e.composedPath();
	    swiper.updateClickedSlide(pathTree && pathTree[0] || e.target);
	    swiper.emit('tap click', e);

	    if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
	      swiper.emit('doubleTap doubleClick', e);
	    }
	  }

	  data.lastClickTime = now();
	  nextTick(() => {
	    if (!swiper.destroyed) swiper.allowClick = true;
	  });

	  if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 || data.currentTranslate === data.startTranslate) {
	    data.isTouched = false;
	    data.isMoved = false;
	    data.startMoving = false;
	    return;
	  }

	  data.isTouched = false;
	  data.isMoved = false;
	  data.startMoving = false;
	  let currentPos;

	  if (params.followFinger) {
	    currentPos = rtl ? swiper.translate : -swiper.translate;
	  } else {
	    currentPos = -data.currentTranslate;
	  }

	  if (params.cssMode) {
	    return;
	  }

	  if (swiper.params.freeMode && params.freeMode.enabled) {
	    swiper.freeMode.onTouchEnd({
	      currentPos
	    });
	    return;
	  } // Find current slide


	  let stopIndex = 0;
	  let groupSize = swiper.slidesSizesGrid[0];

	  for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
	    const increment = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;

	    if (typeof slidesGrid[i + increment] !== 'undefined') {
	      if (currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment]) {
	        stopIndex = i;
	        groupSize = slidesGrid[i + increment] - slidesGrid[i];
	      }
	    } else if (currentPos >= slidesGrid[i]) {
	      stopIndex = i;
	      groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
	    }
	  }

	  let rewindFirstIndex = null;
	  let rewindLastIndex = null;

	  if (params.rewind) {
	    if (swiper.isBeginning) {
	      rewindLastIndex = swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
	    } else if (swiper.isEnd) {
	      rewindFirstIndex = 0;
	    }
	  } // Find current slide size


	  const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
	  const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;

	  if (timeDiff > params.longSwipesMs) {
	    // Long touches
	    if (!params.longSwipes) {
	      swiper.slideTo(swiper.activeIndex);
	      return;
	    }

	    if (swiper.swipeDirection === 'next') {
	      if (ratio >= params.longSwipesRatio) swiper.slideTo(params.rewind && swiper.isEnd ? rewindFirstIndex : stopIndex + increment);else swiper.slideTo(stopIndex);
	    }

	    if (swiper.swipeDirection === 'prev') {
	      if (ratio > 1 - params.longSwipesRatio) {
	        swiper.slideTo(stopIndex + increment);
	      } else if (rewindLastIndex !== null && ratio < 0 && Math.abs(ratio) > params.longSwipesRatio) {
	        swiper.slideTo(rewindLastIndex);
	      } else {
	        swiper.slideTo(stopIndex);
	      }
	    }
	  } else {
	    // Short swipes
	    if (!params.shortSwipes) {
	      swiper.slideTo(swiper.activeIndex);
	      return;
	    }

	    const isNavButtonTarget = swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);

	    if (!isNavButtonTarget) {
	      if (swiper.swipeDirection === 'next') {
	        swiper.slideTo(rewindFirstIndex !== null ? rewindFirstIndex : stopIndex + increment);
	      }

	      if (swiper.swipeDirection === 'prev') {
	        swiper.slideTo(rewindLastIndex !== null ? rewindLastIndex : stopIndex);
	      }
	    } else if (e.target === swiper.navigation.nextEl) {
	      swiper.slideTo(stopIndex + increment);
	    } else {
	      swiper.slideTo(stopIndex);
	    }
	  }
	}

	function onResize() {
	  const swiper = this;
	  const {
	    params,
	    el
	  } = swiper;
	  if (el && el.offsetWidth === 0) return; // Breakpoints

	  if (params.breakpoints) {
	    swiper.setBreakpoint();
	  } // Save locks


	  const {
	    allowSlideNext,
	    allowSlidePrev,
	    snapGrid
	  } = swiper; // Disable locks on resize

	  swiper.allowSlideNext = true;
	  swiper.allowSlidePrev = true;
	  swiper.updateSize();
	  swiper.updateSlides();
	  swiper.updateSlidesClasses();

	  if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !swiper.isBeginning && !swiper.params.centeredSlides) {
	    swiper.slideTo(swiper.slides.length - 1, 0, false, true);
	  } else {
	    swiper.slideTo(swiper.activeIndex, 0, false, true);
	  }

	  if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
	    swiper.autoplay.run();
	  } // Return locks after resize


	  swiper.allowSlidePrev = allowSlidePrev;
	  swiper.allowSlideNext = allowSlideNext;

	  if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
	    swiper.checkOverflow();
	  }
	}

	function onClick(e) {
	  const swiper = this;
	  if (!swiper.enabled) return;

	  if (!swiper.allowClick) {
	    if (swiper.params.preventClicks) e.preventDefault();

	    if (swiper.params.preventClicksPropagation && swiper.animating) {
	      e.stopPropagation();
	      e.stopImmediatePropagation();
	    }
	  }
	}

	function onScroll() {
	  const swiper = this;
	  const {
	    wrapperEl,
	    rtlTranslate,
	    enabled
	  } = swiper;
	  if (!enabled) return;
	  swiper.previousTranslate = swiper.translate;

	  if (swiper.isHorizontal()) {
	    swiper.translate = -wrapperEl.scrollLeft;
	  } else {
	    swiper.translate = -wrapperEl.scrollTop;
	  } // eslint-disable-next-line


	  if (swiper.translate === 0) swiper.translate = 0;
	  swiper.updateActiveIndex();
	  swiper.updateSlidesClasses();
	  let newProgress;
	  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();

	  if (translatesDiff === 0) {
	    newProgress = 0;
	  } else {
	    newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
	  }

	  if (newProgress !== swiper.progress) {
	    swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
	  }

	  swiper.emit('setTranslate', swiper.translate, false);
	}

	let dummyEventAttached = false;

	function dummyEventListener() {}

	const events = (swiper, method) => {
	  const document = getDocument();
	  const {
	    params,
	    touchEvents,
	    el,
	    wrapperEl,
	    device,
	    support
	  } = swiper;
	  const capture = !!params.nested;
	  const domMethod = method === 'on' ? 'addEventListener' : 'removeEventListener';
	  const swiperMethod = method; // Touch Events

	  if (!support.touch) {
	    el[domMethod](touchEvents.start, swiper.onTouchStart, false);
	    document[domMethod](touchEvents.move, swiper.onTouchMove, capture);
	    document[domMethod](touchEvents.end, swiper.onTouchEnd, false);
	  } else {
	    const passiveListener = touchEvents.start === 'touchstart' && support.passiveListener && params.passiveListeners ? {
	      passive: true,
	      capture: false
	    } : false;
	    el[domMethod](touchEvents.start, swiper.onTouchStart, passiveListener);
	    el[domMethod](touchEvents.move, swiper.onTouchMove, support.passiveListener ? {
	      passive: false,
	      capture
	    } : capture);
	    el[domMethod](touchEvents.end, swiper.onTouchEnd, passiveListener);

	    if (touchEvents.cancel) {
	      el[domMethod](touchEvents.cancel, swiper.onTouchEnd, passiveListener);
	    }
	  } // Prevent Links Clicks


	  if (params.preventClicks || params.preventClicksPropagation) {
	    el[domMethod]('click', swiper.onClick, true);
	  }

	  if (params.cssMode) {
	    wrapperEl[domMethod]('scroll', swiper.onScroll);
	  } // Resize handler


	  if (params.updateOnWindowResize) {
	    swiper[swiperMethod](device.ios || device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate', onResize, true);
	  } else {
	    swiper[swiperMethod]('observerUpdate', onResize, true);
	  }
	};

	function attachEvents() {
	  const swiper = this;
	  const document = getDocument();
	  const {
	    params,
	    support
	  } = swiper;
	  swiper.onTouchStart = onTouchStart.bind(swiper);
	  swiper.onTouchMove = onTouchMove.bind(swiper);
	  swiper.onTouchEnd = onTouchEnd.bind(swiper);

	  if (params.cssMode) {
	    swiper.onScroll = onScroll.bind(swiper);
	  }

	  swiper.onClick = onClick.bind(swiper);

	  if (support.touch && !dummyEventAttached) {
	    document.addEventListener('touchstart', dummyEventListener);
	    dummyEventAttached = true;
	  }

	  events(swiper, 'on');
	}

	function detachEvents() {
	  const swiper = this;
	  events(swiper, 'off');
	}

	var events$1 = {
	  attachEvents,
	  detachEvents
	};

	const isGridEnabled = (swiper, params) => {
	  return swiper.grid && params.grid && params.grid.rows > 1;
	};

	function setBreakpoint() {
	  const swiper = this;
	  const {
	    activeIndex,
	    initialized,
	    loopedSlides = 0,
	    params,
	    $el
	  } = swiper;
	  const breakpoints = params.breakpoints;
	  if (!breakpoints || breakpoints && Object.keys(breakpoints).length === 0) return; // Get breakpoint for window width and update parameters

	  const breakpoint = swiper.getBreakpoint(breakpoints, swiper.params.breakpointsBase, swiper.el);
	  if (!breakpoint || swiper.currentBreakpoint === breakpoint) return;
	  const breakpointOnlyParams = breakpoint in breakpoints ? breakpoints[breakpoint] : undefined;
	  const breakpointParams = breakpointOnlyParams || swiper.originalParams;
	  const wasMultiRow = isGridEnabled(swiper, params);
	  const isMultiRow = isGridEnabled(swiper, breakpointParams);
	  const wasEnabled = params.enabled;

	  if (wasMultiRow && !isMultiRow) {
	    $el.removeClass(`${params.containerModifierClass}grid ${params.containerModifierClass}grid-column`);
	    swiper.emitContainerClasses();
	  } else if (!wasMultiRow && isMultiRow) {
	    $el.addClass(`${params.containerModifierClass}grid`);

	    if (breakpointParams.grid.fill && breakpointParams.grid.fill === 'column' || !breakpointParams.grid.fill && params.grid.fill === 'column') {
	      $el.addClass(`${params.containerModifierClass}grid-column`);
	    }

	    swiper.emitContainerClasses();
	  } // Toggle navigation, pagination, scrollbar


	  ['navigation', 'pagination', 'scrollbar'].forEach(prop => {
	    const wasModuleEnabled = params[prop] && params[prop].enabled;
	    const isModuleEnabled = breakpointParams[prop] && breakpointParams[prop].enabled;

	    if (wasModuleEnabled && !isModuleEnabled) {
	      swiper[prop].disable();
	    }

	    if (!wasModuleEnabled && isModuleEnabled) {
	      swiper[prop].enable();
	    }
	  });
	  const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
	  const needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);

	  if (directionChanged && initialized) {
	    swiper.changeDirection();
	  }

	  extend(swiper.params, breakpointParams);
	  const isEnabled = swiper.params.enabled;
	  Object.assign(swiper, {
	    allowTouchMove: swiper.params.allowTouchMove,
	    allowSlideNext: swiper.params.allowSlideNext,
	    allowSlidePrev: swiper.params.allowSlidePrev
	  });

	  if (wasEnabled && !isEnabled) {
	    swiper.disable();
	  } else if (!wasEnabled && isEnabled) {
	    swiper.enable();
	  }

	  swiper.currentBreakpoint = breakpoint;
	  swiper.emit('_beforeBreakpoint', breakpointParams);

	  if (needsReLoop && initialized) {
	    swiper.loopDestroy();
	    swiper.loopCreate();
	    swiper.updateSlides();
	    swiper.slideTo(activeIndex - loopedSlides + swiper.loopedSlides, 0, false);
	  }

	  swiper.emit('breakpoint', breakpointParams);
	}

	function getBreakpoint(breakpoints, base = 'window', containerEl) {
	  if (!breakpoints || base === 'container' && !containerEl) return undefined;
	  let breakpoint = false;
	  const window = getWindow();
	  const currentHeight = base === 'window' ? window.innerHeight : containerEl.clientHeight;
	  const points = Object.keys(breakpoints).map(point => {
	    if (typeof point === 'string' && point.indexOf('@') === 0) {
	      const minRatio = parseFloat(point.substr(1));
	      const value = currentHeight * minRatio;
	      return {
	        value,
	        point
	      };
	    }

	    return {
	      value: point,
	      point
	    };
	  });
	  points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));

	  for (let i = 0; i < points.length; i += 1) {
	    const {
	      point,
	      value
	    } = points[i];

	    if (base === 'window') {
	      if (window.matchMedia(`(min-width: ${value}px)`).matches) {
	        breakpoint = point;
	      }
	    } else if (value <= containerEl.clientWidth) {
	      breakpoint = point;
	    }
	  }

	  return breakpoint || 'max';
	}

	var breakpoints = {
	  setBreakpoint,
	  getBreakpoint
	};

	function prepareClasses(entries, prefix) {
	  const resultClasses = [];
	  entries.forEach(item => {
	    if (typeof item === 'object') {
	      Object.keys(item).forEach(classNames => {
	        if (item[classNames]) {
	          resultClasses.push(prefix + classNames);
	        }
	      });
	    } else if (typeof item === 'string') {
	      resultClasses.push(prefix + item);
	    }
	  });
	  return resultClasses;
	}

	function addClasses() {
	  const swiper = this;
	  const {
	    classNames,
	    params,
	    rtl,
	    $el,
	    device,
	    support
	  } = swiper; // prettier-ignore

	  const suffixes = prepareClasses(['initialized', params.direction, {
	    'pointer-events': !support.touch
	  }, {
	    'free-mode': swiper.params.freeMode && params.freeMode.enabled
	  }, {
	    'autoheight': params.autoHeight
	  }, {
	    'rtl': rtl
	  }, {
	    'grid': params.grid && params.grid.rows > 1
	  }, {
	    'grid-column': params.grid && params.grid.rows > 1 && params.grid.fill === 'column'
	  }, {
	    'android': device.android
	  }, {
	    'ios': device.ios
	  }, {
	    'css-mode': params.cssMode
	  }, {
	    'centered': params.cssMode && params.centeredSlides
	  }, {
	    'watch-progress': params.watchSlidesProgress
	  }], params.containerModifierClass);
	  classNames.push(...suffixes);
	  $el.addClass([...classNames].join(' '));
	  swiper.emitContainerClasses();
	}

	function removeClasses() {
	  const swiper = this;
	  const {
	    $el,
	    classNames
	  } = swiper;
	  $el.removeClass(classNames.join(' '));
	  swiper.emitContainerClasses();
	}

	var classes = {
	  addClasses,
	  removeClasses
	};

	function loadImage(imageEl, src, srcset, sizes, checkForComplete, callback) {
	  const window = getWindow();
	  let image;

	  function onReady() {
	    if (callback) callback();
	  }

	  const isPicture = $(imageEl).parent('picture')[0];

	  if (!isPicture && (!imageEl.complete || !checkForComplete)) {
	    if (src) {
	      image = new window.Image();
	      image.onload = onReady;
	      image.onerror = onReady;

	      if (sizes) {
	        image.sizes = sizes;
	      }

	      if (srcset) {
	        image.srcset = srcset;
	      }

	      if (src) {
	        image.src = src;
	      }
	    } else {
	      onReady();
	    }
	  } else {
	    // image already loaded...
	    onReady();
	  }
	}

	function preloadImages() {
	  const swiper = this;
	  swiper.imagesToLoad = swiper.$el.find('img');

	  function onReady() {
	    if (typeof swiper === 'undefined' || swiper === null || !swiper || swiper.destroyed) return;
	    if (swiper.imagesLoaded !== undefined) swiper.imagesLoaded += 1;

	    if (swiper.imagesLoaded === swiper.imagesToLoad.length) {
	      if (swiper.params.updateOnImagesReady) swiper.update();
	      swiper.emit('imagesReady');
	    }
	  }

	  for (let i = 0; i < swiper.imagesToLoad.length; i += 1) {
	    const imageEl = swiper.imagesToLoad[i];
	    swiper.loadImage(imageEl, imageEl.currentSrc || imageEl.getAttribute('src'), imageEl.srcset || imageEl.getAttribute('srcset'), imageEl.sizes || imageEl.getAttribute('sizes'), true, onReady);
	  }
	}

	var images = {
	  loadImage,
	  preloadImages
	};

	function checkOverflow() {
	  const swiper = this;
	  const {
	    isLocked: wasLocked,
	    params
	  } = swiper;
	  const {
	    slidesOffsetBefore
	  } = params;

	  if (slidesOffsetBefore) {
	    const lastSlideIndex = swiper.slides.length - 1;
	    const lastSlideRightEdge = swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
	    swiper.isLocked = swiper.size > lastSlideRightEdge;
	  } else {
	    swiper.isLocked = swiper.snapGrid.length === 1;
	  }

	  if (params.allowSlideNext === true) {
	    swiper.allowSlideNext = !swiper.isLocked;
	  }

	  if (params.allowSlidePrev === true) {
	    swiper.allowSlidePrev = !swiper.isLocked;
	  }

	  if (wasLocked && wasLocked !== swiper.isLocked) {
	    swiper.isEnd = false;
	  }

	  if (wasLocked !== swiper.isLocked) {
	    swiper.emit(swiper.isLocked ? 'lock' : 'unlock');
	  }
	}

	var checkOverflow$1 = {
	  checkOverflow
	};

	var defaults = {
	  init: true,
	  direction: 'horizontal',
	  touchEventsTarget: 'wrapper',
	  initialSlide: 0,
	  speed: 300,
	  cssMode: false,
	  updateOnWindowResize: true,
	  resizeObserver: true,
	  nested: false,
	  createElements: false,
	  enabled: true,
	  focusableElements: 'input, select, option, textarea, button, video, label',
	  // Overrides
	  width: null,
	  height: null,
	  //
	  preventInteractionOnTransition: false,
	  // ssr
	  userAgent: null,
	  url: null,
	  // To support iOS's swipe-to-go-back gesture (when being used in-app).
	  edgeSwipeDetection: false,
	  edgeSwipeThreshold: 20,
	  // Autoheight
	  autoHeight: false,
	  // Set wrapper width
	  setWrapperSize: false,
	  // Virtual Translate
	  virtualTranslate: false,
	  // Effects
	  effect: 'slide',
	  // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'
	  // Breakpoints
	  breakpoints: undefined,
	  breakpointsBase: 'window',
	  // Slides grid
	  spaceBetween: 0,
	  slidesPerView: 1,
	  slidesPerGroup: 1,
	  slidesPerGroupSkip: 0,
	  slidesPerGroupAuto: false,
	  centeredSlides: false,
	  centeredSlidesBounds: false,
	  slidesOffsetBefore: 0,
	  // in px
	  slidesOffsetAfter: 0,
	  // in px
	  normalizeSlideIndex: true,
	  centerInsufficientSlides: false,
	  // Disable swiper and hide navigation when container not overflow
	  watchOverflow: true,
	  // Round length
	  roundLengths: false,
	  // Touches
	  touchRatio: 1,
	  touchAngle: 45,
	  simulateTouch: true,
	  shortSwipes: true,
	  longSwipes: true,
	  longSwipesRatio: 0.5,
	  longSwipesMs: 300,
	  followFinger: true,
	  allowTouchMove: true,
	  threshold: 0,
	  touchMoveStopPropagation: false,
	  touchStartPreventDefault: true,
	  touchStartForcePreventDefault: false,
	  touchReleaseOnEdges: false,
	  // Unique Navigation Elements
	  uniqueNavElements: true,
	  // Resistance
	  resistance: true,
	  resistanceRatio: 0.85,
	  // Progress
	  watchSlidesProgress: false,
	  // Cursor
	  grabCursor: false,
	  // Clicks
	  preventClicks: true,
	  preventClicksPropagation: true,
	  slideToClickedSlide: false,
	  // Images
	  preloadImages: true,
	  updateOnImagesReady: true,
	  // loop
	  loop: false,
	  loopAdditionalSlides: 0,
	  loopedSlides: null,
	  loopedSlidesLimit: true,
	  loopFillGroupWithBlank: false,
	  loopPreventsSlide: true,
	  // rewind
	  rewind: false,
	  // Swiping/no swiping
	  allowSlidePrev: true,
	  allowSlideNext: true,
	  swipeHandler: null,
	  // '.swipe-handler',
	  noSwiping: true,
	  noSwipingClass: 'swiper-no-swiping',
	  noSwipingSelector: null,
	  // Passive Listeners
	  passiveListeners: true,
	  maxBackfaceHiddenSlides: 10,
	  // NS
	  containerModifierClass: 'swiper-',
	  // NEW
	  slideClass: 'swiper-slide',
	  slideBlankClass: 'swiper-slide-invisible-blank',
	  slideActiveClass: 'swiper-slide-active',
	  slideDuplicateActiveClass: 'swiper-slide-duplicate-active',
	  slideVisibleClass: 'swiper-slide-visible',
	  slideDuplicateClass: 'swiper-slide-duplicate',
	  slideNextClass: 'swiper-slide-next',
	  slideDuplicateNextClass: 'swiper-slide-duplicate-next',
	  slidePrevClass: 'swiper-slide-prev',
	  slideDuplicatePrevClass: 'swiper-slide-duplicate-prev',
	  wrapperClass: 'swiper-wrapper',
	  // Callbacks
	  runCallbacksOnInit: true,
	  // Internals
	  _emitClasses: false
	};

	function moduleExtendParams(params, allModulesParams) {
	  return function extendParams(obj = {}) {
	    const moduleParamName = Object.keys(obj)[0];
	    const moduleParams = obj[moduleParamName];

	    if (typeof moduleParams !== 'object' || moduleParams === null) {
	      extend(allModulesParams, obj);
	      return;
	    }

	    if (['navigation', 'pagination', 'scrollbar'].indexOf(moduleParamName) >= 0 && params[moduleParamName] === true) {
	      params[moduleParamName] = {
	        auto: true
	      };
	    }

	    if (!(moduleParamName in params && 'enabled' in moduleParams)) {
	      extend(allModulesParams, obj);
	      return;
	    }

	    if (params[moduleParamName] === true) {
	      params[moduleParamName] = {
	        enabled: true
	      };
	    }

	    if (typeof params[moduleParamName] === 'object' && !('enabled' in params[moduleParamName])) {
	      params[moduleParamName].enabled = true;
	    }

	    if (!params[moduleParamName]) params[moduleParamName] = {
	      enabled: false
	    };
	    extend(allModulesParams, obj);
	  };
	}

	/* eslint no-param-reassign: "off" */
	const prototypes = {
	  eventsEmitter,
	  update,
	  translate,
	  transition,
	  slide,
	  loop,
	  grabCursor,
	  events: events$1,
	  breakpoints,
	  checkOverflow: checkOverflow$1,
	  classes,
	  images
	};
	const extendedDefaults = {};

	class Swiper {
	  constructor(...args) {
	    let el;
	    let params;

	    if (args.length === 1 && args[0].constructor && Object.prototype.toString.call(args[0]).slice(8, -1) === 'Object') {
	      params = args[0];
	    } else {
	      [el, params] = args;
	    }

	    if (!params) params = {};
	    params = extend({}, params);
	    if (el && !params.el) params.el = el;

	    if (params.el && $(params.el).length > 1) {
	      const swipers = [];
	      $(params.el).each(containerEl => {
	        const newParams = extend({}, params, {
	          el: containerEl
	        });
	        swipers.push(new Swiper(newParams));
	      }); // eslint-disable-next-line no-constructor-return

	      return swipers;
	    } // Swiper Instance


	    const swiper = this;
	    swiper.__swiper__ = true;
	    swiper.support = getSupport();
	    swiper.device = getDevice({
	      userAgent: params.userAgent
	    });
	    swiper.browser = getBrowser();
	    swiper.eventsListeners = {};
	    swiper.eventsAnyListeners = [];
	    swiper.modules = [...swiper.__modules__];

	    if (params.modules && Array.isArray(params.modules)) {
	      swiper.modules.push(...params.modules);
	    }

	    const allModulesParams = {};
	    swiper.modules.forEach(mod => {
	      mod({
	        swiper,
	        extendParams: moduleExtendParams(params, allModulesParams),
	        on: swiper.on.bind(swiper),
	        once: swiper.once.bind(swiper),
	        off: swiper.off.bind(swiper),
	        emit: swiper.emit.bind(swiper)
	      });
	    }); // Extend defaults with modules params

	    const swiperParams = extend({}, defaults, allModulesParams); // Extend defaults with passed params

	    swiper.params = extend({}, swiperParams, extendedDefaults, params);
	    swiper.originalParams = extend({}, swiper.params);
	    swiper.passedParams = extend({}, params); // add event listeners

	    if (swiper.params && swiper.params.on) {
	      Object.keys(swiper.params.on).forEach(eventName => {
	        swiper.on(eventName, swiper.params.on[eventName]);
	      });
	    }

	    if (swiper.params && swiper.params.onAny) {
	      swiper.onAny(swiper.params.onAny);
	    } // Save Dom lib


	    swiper.$ = $; // Extend Swiper

	    Object.assign(swiper, {
	      enabled: swiper.params.enabled,
	      el,
	      // Classes
	      classNames: [],
	      // Slides
	      slides: $(),
	      slidesGrid: [],
	      snapGrid: [],
	      slidesSizesGrid: [],

	      // isDirection
	      isHorizontal() {
	        return swiper.params.direction === 'horizontal';
	      },

	      isVertical() {
	        return swiper.params.direction === 'vertical';
	      },

	      // Indexes
	      activeIndex: 0,
	      realIndex: 0,
	      //
	      isBeginning: true,
	      isEnd: false,
	      // Props
	      translate: 0,
	      previousTranslate: 0,
	      progress: 0,
	      velocity: 0,
	      animating: false,
	      // Locks
	      allowSlideNext: swiper.params.allowSlideNext,
	      allowSlidePrev: swiper.params.allowSlidePrev,
	      // Touch Events
	      touchEvents: function touchEvents() {
	        const touch = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
	        const desktop = ['pointerdown', 'pointermove', 'pointerup'];
	        swiper.touchEventsTouch = {
	          start: touch[0],
	          move: touch[1],
	          end: touch[2],
	          cancel: touch[3]
	        };
	        swiper.touchEventsDesktop = {
	          start: desktop[0],
	          move: desktop[1],
	          end: desktop[2]
	        };
	        return swiper.support.touch || !swiper.params.simulateTouch ? swiper.touchEventsTouch : swiper.touchEventsDesktop;
	      }(),
	      touchEventsData: {
	        isTouched: undefined,
	        isMoved: undefined,
	        allowTouchCallbacks: undefined,
	        touchStartTime: undefined,
	        isScrolling: undefined,
	        currentTranslate: undefined,
	        startTranslate: undefined,
	        allowThresholdMove: undefined,
	        // Form elements to match
	        focusableElements: swiper.params.focusableElements,
	        // Last click time
	        lastClickTime: now(),
	        clickTimeout: undefined,
	        // Velocities
	        velocities: [],
	        allowMomentumBounce: undefined,
	        isTouchEvent: undefined,
	        startMoving: undefined
	      },
	      // Clicks
	      allowClick: true,
	      // Touches
	      allowTouchMove: swiper.params.allowTouchMove,
	      touches: {
	        startX: 0,
	        startY: 0,
	        currentX: 0,
	        currentY: 0,
	        diff: 0
	      },
	      // Images
	      imagesToLoad: [],
	      imagesLoaded: 0
	    });
	    swiper.emit('_swiper'); // Init

	    if (swiper.params.init) {
	      swiper.init();
	    } // Return app instance
	    // eslint-disable-next-line no-constructor-return


	    return swiper;
	  }

	  enable() {
	    const swiper = this;
	    if (swiper.enabled) return;
	    swiper.enabled = true;

	    if (swiper.params.grabCursor) {
	      swiper.setGrabCursor();
	    }

	    swiper.emit('enable');
	  }

	  disable() {
	    const swiper = this;
	    if (!swiper.enabled) return;
	    swiper.enabled = false;

	    if (swiper.params.grabCursor) {
	      swiper.unsetGrabCursor();
	    }

	    swiper.emit('disable');
	  }

	  setProgress(progress, speed) {
	    const swiper = this;
	    progress = Math.min(Math.max(progress, 0), 1);
	    const min = swiper.minTranslate();
	    const max = swiper.maxTranslate();
	    const current = (max - min) * progress + min;
	    swiper.translateTo(current, typeof speed === 'undefined' ? 0 : speed);
	    swiper.updateActiveIndex();
	    swiper.updateSlidesClasses();
	  }

	  emitContainerClasses() {
	    const swiper = this;
	    if (!swiper.params._emitClasses || !swiper.el) return;
	    const cls = swiper.el.className.split(' ').filter(className => {
	      return className.indexOf('swiper') === 0 || className.indexOf(swiper.params.containerModifierClass) === 0;
	    });
	    swiper.emit('_containerClasses', cls.join(' '));
	  }

	  getSlideClasses(slideEl) {
	    const swiper = this;
	    if (swiper.destroyed) return '';
	    return slideEl.className.split(' ').filter(className => {
	      return className.indexOf('swiper-slide') === 0 || className.indexOf(swiper.params.slideClass) === 0;
	    }).join(' ');
	  }

	  emitSlidesClasses() {
	    const swiper = this;
	    if (!swiper.params._emitClasses || !swiper.el) return;
	    const updates = [];
	    swiper.slides.each(slideEl => {
	      const classNames = swiper.getSlideClasses(slideEl);
	      updates.push({
	        slideEl,
	        classNames
	      });
	      swiper.emit('_slideClass', slideEl, classNames);
	    });
	    swiper.emit('_slideClasses', updates);
	  }

	  slidesPerViewDynamic(view = 'current', exact = false) {
	    const swiper = this;
	    const {
	      params,
	      slides,
	      slidesGrid,
	      slidesSizesGrid,
	      size: swiperSize,
	      activeIndex
	    } = swiper;
	    let spv = 1;

	    if (params.centeredSlides) {
	      let slideSize = slides[activeIndex].swiperSlideSize;
	      let breakLoop;

	      for (let i = activeIndex + 1; i < slides.length; i += 1) {
	        if (slides[i] && !breakLoop) {
	          slideSize += slides[i].swiperSlideSize;
	          spv += 1;
	          if (slideSize > swiperSize) breakLoop = true;
	        }
	      }

	      for (let i = activeIndex - 1; i >= 0; i -= 1) {
	        if (slides[i] && !breakLoop) {
	          slideSize += slides[i].swiperSlideSize;
	          spv += 1;
	          if (slideSize > swiperSize) breakLoop = true;
	        }
	      }
	    } else {
	      // eslint-disable-next-line
	      if (view === 'current') {
	        for (let i = activeIndex + 1; i < slides.length; i += 1) {
	          const slideInView = exact ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;

	          if (slideInView) {
	            spv += 1;
	          }
	        }
	      } else {
	        // previous
	        for (let i = activeIndex - 1; i >= 0; i -= 1) {
	          const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;

	          if (slideInView) {
	            spv += 1;
	          }
	        }
	      }
	    }

	    return spv;
	  }

	  update() {
	    const swiper = this;
	    if (!swiper || swiper.destroyed) return;
	    const {
	      snapGrid,
	      params
	    } = swiper; // Breakpoints

	    if (params.breakpoints) {
	      swiper.setBreakpoint();
	    }

	    swiper.updateSize();
	    swiper.updateSlides();
	    swiper.updateProgress();
	    swiper.updateSlidesClasses();

	    function setTranslate() {
	      const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
	      const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
	      swiper.setTranslate(newTranslate);
	      swiper.updateActiveIndex();
	      swiper.updateSlidesClasses();
	    }

	    let translated;

	    if (swiper.params.freeMode && swiper.params.freeMode.enabled) {
	      setTranslate();

	      if (swiper.params.autoHeight) {
	        swiper.updateAutoHeight();
	      }
	    } else {
	      if ((swiper.params.slidesPerView === 'auto' || swiper.params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
	        translated = swiper.slideTo(swiper.slides.length - 1, 0, false, true);
	      } else {
	        translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
	      }

	      if (!translated) {
	        setTranslate();
	      }
	    }

	    if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
	      swiper.checkOverflow();
	    }

	    swiper.emit('update');
	  }

	  changeDirection(newDirection, needUpdate = true) {
	    const swiper = this;
	    const currentDirection = swiper.params.direction;

	    if (!newDirection) {
	      // eslint-disable-next-line
	      newDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
	    }

	    if (newDirection === currentDirection || newDirection !== 'horizontal' && newDirection !== 'vertical') {
	      return swiper;
	    }

	    swiper.$el.removeClass(`${swiper.params.containerModifierClass}${currentDirection}`).addClass(`${swiper.params.containerModifierClass}${newDirection}`);
	    swiper.emitContainerClasses();
	    swiper.params.direction = newDirection;
	    swiper.slides.each(slideEl => {
	      if (newDirection === 'vertical') {
	        slideEl.style.width = '';
	      } else {
	        slideEl.style.height = '';
	      }
	    });
	    swiper.emit('changeDirection');
	    if (needUpdate) swiper.update();
	    return swiper;
	  }

	  changeLanguageDirection(direction) {
	    const swiper = this;
	    if (swiper.rtl && direction === 'rtl' || !swiper.rtl && direction === 'ltr') return;
	    swiper.rtl = direction === 'rtl';
	    swiper.rtlTranslate = swiper.params.direction === 'horizontal' && swiper.rtl;

	    if (swiper.rtl) {
	      swiper.$el.addClass(`${swiper.params.containerModifierClass}rtl`);
	      swiper.el.dir = 'rtl';
	    } else {
	      swiper.$el.removeClass(`${swiper.params.containerModifierClass}rtl`);
	      swiper.el.dir = 'ltr';
	    }

	    swiper.update();
	  }

	  mount(el) {
	    const swiper = this;
	    if (swiper.mounted) return true; // Find el

	    const $el = $(el || swiper.params.el);
	    el = $el[0];

	    if (!el) {
	      return false;
	    }

	    el.swiper = swiper;

	    const getWrapperSelector = () => {
	      return `.${(swiper.params.wrapperClass || '').trim().split(' ').join('.')}`;
	    };

	    const getWrapper = () => {
	      if (el && el.shadowRoot && el.shadowRoot.querySelector) {
	        const res = $(el.shadowRoot.querySelector(getWrapperSelector())); // Children needs to return slot items

	        res.children = options => $el.children(options);

	        return res;
	      }

	      if (!$el.children) {
	        return $($el).children(getWrapperSelector());
	      }

	      return $el.children(getWrapperSelector());
	    }; // Find Wrapper


	    let $wrapperEl = getWrapper();

	    if ($wrapperEl.length === 0 && swiper.params.createElements) {
	      const document = getDocument();
	      const wrapper = document.createElement('div');
	      $wrapperEl = $(wrapper);
	      wrapper.className = swiper.params.wrapperClass;
	      $el.append(wrapper);
	      $el.children(`.${swiper.params.slideClass}`).each(slideEl => {
	        $wrapperEl.append(slideEl);
	      });
	    }

	    Object.assign(swiper, {
	      $el,
	      el,
	      $wrapperEl,
	      wrapperEl: $wrapperEl[0],
	      mounted: true,
	      // RTL
	      rtl: el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl',
	      rtlTranslate: swiper.params.direction === 'horizontal' && (el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl'),
	      wrongRTL: $wrapperEl.css('display') === '-webkit-box'
	    });
	    return true;
	  }

	  init(el) {
	    const swiper = this;
	    if (swiper.initialized) return swiper;
	    const mounted = swiper.mount(el);
	    if (mounted === false) return swiper;
	    swiper.emit('beforeInit'); // Set breakpoint

	    if (swiper.params.breakpoints) {
	      swiper.setBreakpoint();
	    } // Add Classes


	    swiper.addClasses(); // Create loop

	    if (swiper.params.loop) {
	      swiper.loopCreate();
	    } // Update size


	    swiper.updateSize(); // Update slides

	    swiper.updateSlides();

	    if (swiper.params.watchOverflow) {
	      swiper.checkOverflow();
	    } // Set Grab Cursor


	    if (swiper.params.grabCursor && swiper.enabled) {
	      swiper.setGrabCursor();
	    }

	    if (swiper.params.preloadImages) {
	      swiper.preloadImages();
	    } // Slide To Initial Slide


	    if (swiper.params.loop) {
	      swiper.slideTo(swiper.params.initialSlide + swiper.loopedSlides, 0, swiper.params.runCallbacksOnInit, false, true);
	    } else {
	      swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
	    } // Attach events


	    swiper.attachEvents(); // Init Flag

	    swiper.initialized = true; // Emit

	    swiper.emit('init');
	    swiper.emit('afterInit');
	    return swiper;
	  }

	  destroy(deleteInstance = true, cleanStyles = true) {
	    const swiper = this;
	    const {
	      params,
	      $el,
	      $wrapperEl,
	      slides
	    } = swiper;

	    if (typeof swiper.params === 'undefined' || swiper.destroyed) {
	      return null;
	    }

	    swiper.emit('beforeDestroy'); // Init Flag

	    swiper.initialized = false; // Detach events

	    swiper.detachEvents(); // Destroy loop

	    if (params.loop) {
	      swiper.loopDestroy();
	    } // Cleanup styles


	    if (cleanStyles) {
	      swiper.removeClasses();
	      $el.removeAttr('style');
	      $wrapperEl.removeAttr('style');

	      if (slides && slides.length) {
	        slides.removeClass([params.slideVisibleClass, params.slideActiveClass, params.slideNextClass, params.slidePrevClass].join(' ')).removeAttr('style').removeAttr('data-swiper-slide-index');
	      }
	    }

	    swiper.emit('destroy'); // Detach emitter events

	    Object.keys(swiper.eventsListeners).forEach(eventName => {
	      swiper.off(eventName);
	    });

	    if (deleteInstance !== false) {
	      swiper.$el[0].swiper = null;
	      deleteProps(swiper);
	    }

	    swiper.destroyed = true;
	    return null;
	  }

	  static extendDefaults(newDefaults) {
	    extend(extendedDefaults, newDefaults);
	  }

	  static get extendedDefaults() {
	    return extendedDefaults;
	  }

	  static get defaults() {
	    return defaults;
	  }

	  static installModule(mod) {
	    if (!Swiper.prototype.__modules__) Swiper.prototype.__modules__ = [];
	    const modules = Swiper.prototype.__modules__;

	    if (typeof mod === 'function' && modules.indexOf(mod) < 0) {
	      modules.push(mod);
	    }
	  }

	  static use(module) {
	    if (Array.isArray(module)) {
	      module.forEach(m => Swiper.installModule(m));
	      return Swiper;
	    }

	    Swiper.installModule(module);
	    return Swiper;
	  }

	}

	Object.keys(prototypes).forEach(prototypeGroup => {
	  Object.keys(prototypes[prototypeGroup]).forEach(protoMethod => {
	    Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
	  });
	});
	Swiper.use([Resize, Observer]);

	function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
	  const document = getDocument();

	  if (swiper.params.createElements) {
	    Object.keys(checkProps).forEach(key => {
	      if (!params[key] && params.auto === true) {
	        let element = swiper.$el.children(`.${checkProps[key]}`)[0];

	        if (!element) {
	          element = document.createElement('div');
	          element.className = checkProps[key];
	          swiper.$el.append(element);
	        }

	        params[key] = element;
	        originalParams[key] = element;
	      }
	    });
	  }

	  return params;
	}

	function Navigation({
	  swiper,
	  extendParams,
	  on,
	  emit
	}) {
	  extendParams({
	    navigation: {
	      nextEl: null,
	      prevEl: null,
	      hideOnClick: false,
	      disabledClass: 'swiper-button-disabled',
	      hiddenClass: 'swiper-button-hidden',
	      lockClass: 'swiper-button-lock',
	      navigationDisabledClass: 'swiper-navigation-disabled'
	    }
	  });
	  swiper.navigation = {
	    nextEl: null,
	    $nextEl: null,
	    prevEl: null,
	    $prevEl: null
	  };

	  function getEl(el) {
	    let $el;

	    if (el) {
	      $el = $(el);

	      if (swiper.params.uniqueNavElements && typeof el === 'string' && $el.length > 1 && swiper.$el.find(el).length === 1) {
	        $el = swiper.$el.find(el);
	      }
	    }

	    return $el;
	  }

	  function toggleEl($el, disabled) {
	    const params = swiper.params.navigation;

	    if ($el && $el.length > 0) {
	      $el[disabled ? 'addClass' : 'removeClass'](params.disabledClass);
	      if ($el[0] && $el[0].tagName === 'BUTTON') $el[0].disabled = disabled;

	      if (swiper.params.watchOverflow && swiper.enabled) {
	        $el[swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
	      }
	    }
	  }

	  function update() {
	    // Update Navigation Buttons
	    if (swiper.params.loop) return;
	    const {
	      $nextEl,
	      $prevEl
	    } = swiper.navigation;
	    toggleEl($prevEl, swiper.isBeginning && !swiper.params.rewind);
	    toggleEl($nextEl, swiper.isEnd && !swiper.params.rewind);
	  }

	  function onPrevClick(e) {
	    e.preventDefault();
	    if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind) return;
	    swiper.slidePrev();
	    emit('navigationPrev');
	  }

	  function onNextClick(e) {
	    e.preventDefault();
	    if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind) return;
	    swiper.slideNext();
	    emit('navigationNext');
	  }

	  function init() {
	    const params = swiper.params.navigation;
	    swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
	      nextEl: 'swiper-button-next',
	      prevEl: 'swiper-button-prev'
	    });
	    if (!(params.nextEl || params.prevEl)) return;
	    const $nextEl = getEl(params.nextEl);
	    const $prevEl = getEl(params.prevEl);

	    if ($nextEl && $nextEl.length > 0) {
	      $nextEl.on('click', onNextClick);
	    }

	    if ($prevEl && $prevEl.length > 0) {
	      $prevEl.on('click', onPrevClick);
	    }

	    Object.assign(swiper.navigation, {
	      $nextEl,
	      nextEl: $nextEl && $nextEl[0],
	      $prevEl,
	      prevEl: $prevEl && $prevEl[0]
	    });

	    if (!swiper.enabled) {
	      if ($nextEl) $nextEl.addClass(params.lockClass);
	      if ($prevEl) $prevEl.addClass(params.lockClass);
	    }
	  }

	  function destroy() {
	    const {
	      $nextEl,
	      $prevEl
	    } = swiper.navigation;

	    if ($nextEl && $nextEl.length) {
	      $nextEl.off('click', onNextClick);
	      $nextEl.removeClass(swiper.params.navigation.disabledClass);
	    }

	    if ($prevEl && $prevEl.length) {
	      $prevEl.off('click', onPrevClick);
	      $prevEl.removeClass(swiper.params.navigation.disabledClass);
	    }
	  }

	  on('init', () => {
	    if (swiper.params.navigation.enabled === false) {
	      // eslint-disable-next-line
	      disable();
	    } else {
	      init();
	      update();
	    }
	  });
	  on('toEdge fromEdge lock unlock', () => {
	    update();
	  });
	  on('destroy', () => {
	    destroy();
	  });
	  on('enable disable', () => {
	    const {
	      $nextEl,
	      $prevEl
	    } = swiper.navigation;

	    if ($nextEl) {
	      $nextEl[swiper.enabled ? 'removeClass' : 'addClass'](swiper.params.navigation.lockClass);
	    }

	    if ($prevEl) {
	      $prevEl[swiper.enabled ? 'removeClass' : 'addClass'](swiper.params.navigation.lockClass);
	    }
	  });
	  on('click', (_s, e) => {
	    const {
	      $nextEl,
	      $prevEl
	    } = swiper.navigation;
	    const targetEl = e.target;

	    if (swiper.params.navigation.hideOnClick && !$(targetEl).is($prevEl) && !$(targetEl).is($nextEl)) {
	      if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl))) return;
	      let isHidden;

	      if ($nextEl) {
	        isHidden = $nextEl.hasClass(swiper.params.navigation.hiddenClass);
	      } else if ($prevEl) {
	        isHidden = $prevEl.hasClass(swiper.params.navigation.hiddenClass);
	      }

	      if (isHidden === true) {
	        emit('navigationShow');
	      } else {
	        emit('navigationHide');
	      }

	      if ($nextEl) {
	        $nextEl.toggleClass(swiper.params.navigation.hiddenClass);
	      }

	      if ($prevEl) {
	        $prevEl.toggleClass(swiper.params.navigation.hiddenClass);
	      }
	    }
	  });

	  const enable = () => {
	    swiper.$el.removeClass(swiper.params.navigation.navigationDisabledClass);
	    init();
	    update();
	  };

	  const disable = () => {
	    swiper.$el.addClass(swiper.params.navigation.navigationDisabledClass);
	    destroy();
	  };

	  Object.assign(swiper.navigation, {
	    enable,
	    disable,
	    update,
	    init,
	    destroy
	  });
	}

	function classesToSelector(classes = '') {
	  return `.${classes.trim().replace(/([\.:!\/])/g, '\\$1') // eslint-disable-line
  .replace(/ /g, '.')}`;
	}

	function Pagination({
	  swiper,
	  extendParams,
	  on,
	  emit
	}) {
	  const pfx = 'swiper-pagination';
	  extendParams({
	    pagination: {
	      el: null,
	      bulletElement: 'span',
	      clickable: false,
	      hideOnClick: false,
	      renderBullet: null,
	      renderProgressbar: null,
	      renderFraction: null,
	      renderCustom: null,
	      progressbarOpposite: false,
	      type: 'bullets',
	      // 'bullets' or 'progressbar' or 'fraction' or 'custom'
	      dynamicBullets: false,
	      dynamicMainBullets: 1,
	      formatFractionCurrent: number => number,
	      formatFractionTotal: number => number,
	      bulletClass: `${pfx}-bullet`,
	      bulletActiveClass: `${pfx}-bullet-active`,
	      modifierClass: `${pfx}-`,
	      currentClass: `${pfx}-current`,
	      totalClass: `${pfx}-total`,
	      hiddenClass: `${pfx}-hidden`,
	      progressbarFillClass: `${pfx}-progressbar-fill`,
	      progressbarOppositeClass: `${pfx}-progressbar-opposite`,
	      clickableClass: `${pfx}-clickable`,
	      lockClass: `${pfx}-lock`,
	      horizontalClass: `${pfx}-horizontal`,
	      verticalClass: `${pfx}-vertical`,
	      paginationDisabledClass: `${pfx}-disabled`
	    }
	  });
	  swiper.pagination = {
	    el: null,
	    $el: null,
	    bullets: []
	  };
	  let bulletSize;
	  let dynamicBulletIndex = 0;

	  function isPaginationDisabled() {
	    return !swiper.params.pagination.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0;
	  }

	  function setSideBullets($bulletEl, position) {
	    const {
	      bulletActiveClass
	    } = swiper.params.pagination;
	    $bulletEl[position]().addClass(`${bulletActiveClass}-${position}`)[position]().addClass(`${bulletActiveClass}-${position}-${position}`);
	  }

	  function update() {
	    // Render || Update Pagination bullets/items
	    const rtl = swiper.rtl;
	    const params = swiper.params.pagination;
	    if (isPaginationDisabled()) return;
	    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
	    const $el = swiper.pagination.$el; // Current/Total

	    let current;
	    const total = swiper.params.loop ? Math.ceil((slidesLength - swiper.loopedSlides * 2) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;

	    if (swiper.params.loop) {
	      current = Math.ceil((swiper.activeIndex - swiper.loopedSlides) / swiper.params.slidesPerGroup);

	      if (current > slidesLength - 1 - swiper.loopedSlides * 2) {
	        current -= slidesLength - swiper.loopedSlides * 2;
	      }

	      if (current > total - 1) current -= total;
	      if (current < 0 && swiper.params.paginationType !== 'bullets') current = total + current;
	    } else if (typeof swiper.snapIndex !== 'undefined') {
	      current = swiper.snapIndex;
	    } else {
	      current = swiper.activeIndex || 0;
	    } // Types


	    if (params.type === 'bullets' && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
	      const bullets = swiper.pagination.bullets;
	      let firstIndex;
	      let lastIndex;
	      let midIndex;

	      if (params.dynamicBullets) {
	        bulletSize = bullets.eq(0)[swiper.isHorizontal() ? 'outerWidth' : 'outerHeight'](true);
	        $el.css(swiper.isHorizontal() ? 'width' : 'height', `${bulletSize * (params.dynamicMainBullets + 4)}px`);

	        if (params.dynamicMainBullets > 1 && swiper.previousIndex !== undefined) {
	          dynamicBulletIndex += current - (swiper.previousIndex - swiper.loopedSlides || 0);

	          if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
	            dynamicBulletIndex = params.dynamicMainBullets - 1;
	          } else if (dynamicBulletIndex < 0) {
	            dynamicBulletIndex = 0;
	          }
	        }

	        firstIndex = Math.max(current - dynamicBulletIndex, 0);
	        lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
	        midIndex = (lastIndex + firstIndex) / 2;
	      }

	      bullets.removeClass(['', '-next', '-next-next', '-prev', '-prev-prev', '-main'].map(suffix => `${params.bulletActiveClass}${suffix}`).join(' '));

	      if ($el.length > 1) {
	        bullets.each(bullet => {
	          const $bullet = $(bullet);
	          const bulletIndex = $bullet.index();

	          if (bulletIndex === current) {
	            $bullet.addClass(params.bulletActiveClass);
	          }

	          if (params.dynamicBullets) {
	            if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
	              $bullet.addClass(`${params.bulletActiveClass}-main`);
	            }

	            if (bulletIndex === firstIndex) {
	              setSideBullets($bullet, 'prev');
	            }

	            if (bulletIndex === lastIndex) {
	              setSideBullets($bullet, 'next');
	            }
	          }
	        });
	      } else {
	        const $bullet = bullets.eq(current);
	        const bulletIndex = $bullet.index();
	        $bullet.addClass(params.bulletActiveClass);

	        if (params.dynamicBullets) {
	          const $firstDisplayedBullet = bullets.eq(firstIndex);
	          const $lastDisplayedBullet = bullets.eq(lastIndex);

	          for (let i = firstIndex; i <= lastIndex; i += 1) {
	            bullets.eq(i).addClass(`${params.bulletActiveClass}-main`);
	          }

	          if (swiper.params.loop) {
	            if (bulletIndex >= bullets.length) {
	              for (let i = params.dynamicMainBullets; i >= 0; i -= 1) {
	                bullets.eq(bullets.length - i).addClass(`${params.bulletActiveClass}-main`);
	              }

	              bullets.eq(bullets.length - params.dynamicMainBullets - 1).addClass(`${params.bulletActiveClass}-prev`);
	            } else {
	              setSideBullets($firstDisplayedBullet, 'prev');
	              setSideBullets($lastDisplayedBullet, 'next');
	            }
	          } else {
	            setSideBullets($firstDisplayedBullet, 'prev');
	            setSideBullets($lastDisplayedBullet, 'next');
	          }
	        }
	      }

	      if (params.dynamicBullets) {
	        const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
	        const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
	        const offsetProp = rtl ? 'right' : 'left';
	        bullets.css(swiper.isHorizontal() ? offsetProp : 'top', `${bulletsOffset}px`);
	      }
	    }

	    if (params.type === 'fraction') {
	      $el.find(classesToSelector(params.currentClass)).text(params.formatFractionCurrent(current + 1));
	      $el.find(classesToSelector(params.totalClass)).text(params.formatFractionTotal(total));
	    }

	    if (params.type === 'progressbar') {
	      let progressbarDirection;

	      if (params.progressbarOpposite) {
	        progressbarDirection = swiper.isHorizontal() ? 'vertical' : 'horizontal';
	      } else {
	        progressbarDirection = swiper.isHorizontal() ? 'horizontal' : 'vertical';
	      }

	      const scale = (current + 1) / total;
	      let scaleX = 1;
	      let scaleY = 1;

	      if (progressbarDirection === 'horizontal') {
	        scaleX = scale;
	      } else {
	        scaleY = scale;
	      }

	      $el.find(classesToSelector(params.progressbarFillClass)).transform(`translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`).transition(swiper.params.speed);
	    }

	    if (params.type === 'custom' && params.renderCustom) {
	      $el.html(params.renderCustom(swiper, current + 1, total));
	      emit('paginationRender', $el[0]);
	    } else {
	      emit('paginationUpdate', $el[0]);
	    }

	    if (swiper.params.watchOverflow && swiper.enabled) {
	      $el[swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
	    }
	  }

	  function render() {
	    // Render Container
	    const params = swiper.params.pagination;
	    if (isPaginationDisabled()) return;
	    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
	    const $el = swiper.pagination.$el;
	    let paginationHTML = '';

	    if (params.type === 'bullets') {
	      let numberOfBullets = swiper.params.loop ? Math.ceil((slidesLength - swiper.loopedSlides * 2) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;

	      if (swiper.params.freeMode && swiper.params.freeMode.enabled && !swiper.params.loop && numberOfBullets > slidesLength) {
	        numberOfBullets = slidesLength;
	      }

	      for (let i = 0; i < numberOfBullets; i += 1) {
	        if (params.renderBullet) {
	          paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
	        } else {
	          paginationHTML += `<${params.bulletElement} class="${params.bulletClass}"></${params.bulletElement}>`;
	        }
	      }

	      $el.html(paginationHTML);
	      swiper.pagination.bullets = $el.find(classesToSelector(params.bulletClass));
	    }

	    if (params.type === 'fraction') {
	      if (params.renderFraction) {
	        paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
	      } else {
	        paginationHTML = `<span class="${params.currentClass}"></span>` + ' / ' + `<span class="${params.totalClass}"></span>`;
	      }

	      $el.html(paginationHTML);
	    }

	    if (params.type === 'progressbar') {
	      if (params.renderProgressbar) {
	        paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
	      } else {
	        paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
	      }

	      $el.html(paginationHTML);
	    }

	    if (params.type !== 'custom') {
	      emit('paginationRender', swiper.pagination.$el[0]);
	    }
	  }

	  function init() {
	    swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
	      el: 'swiper-pagination'
	    });
	    const params = swiper.params.pagination;
	    if (!params.el) return;
	    let $el = $(params.el);
	    if ($el.length === 0) return;

	    if (swiper.params.uniqueNavElements && typeof params.el === 'string' && $el.length > 1) {
	      $el = swiper.$el.find(params.el); // check if it belongs to another nested Swiper

	      if ($el.length > 1) {
	        $el = $el.filter(el => {
	          if ($(el).parents('.swiper')[0] !== swiper.el) return false;
	          return true;
	        });
	      }
	    }

	    if (params.type === 'bullets' && params.clickable) {
	      $el.addClass(params.clickableClass);
	    }

	    $el.addClass(params.modifierClass + params.type);
	    $el.addClass(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);

	    if (params.type === 'bullets' && params.dynamicBullets) {
	      $el.addClass(`${params.modifierClass}${params.type}-dynamic`);
	      dynamicBulletIndex = 0;

	      if (params.dynamicMainBullets < 1) {
	        params.dynamicMainBullets = 1;
	      }
	    }

	    if (params.type === 'progressbar' && params.progressbarOpposite) {
	      $el.addClass(params.progressbarOppositeClass);
	    }

	    if (params.clickable) {
	      $el.on('click', classesToSelector(params.bulletClass), function onClick(e) {
	        e.preventDefault();
	        let index = $(this).index() * swiper.params.slidesPerGroup;
	        if (swiper.params.loop) index += swiper.loopedSlides;
	        swiper.slideTo(index);
	      });
	    }

	    Object.assign(swiper.pagination, {
	      $el,
	      el: $el[0]
	    });

	    if (!swiper.enabled) {
	      $el.addClass(params.lockClass);
	    }
	  }

	  function destroy() {
	    const params = swiper.params.pagination;
	    if (isPaginationDisabled()) return;
	    const $el = swiper.pagination.$el;
	    $el.removeClass(params.hiddenClass);
	    $el.removeClass(params.modifierClass + params.type);
	    $el.removeClass(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
	    if (swiper.pagination.bullets && swiper.pagination.bullets.removeClass) swiper.pagination.bullets.removeClass(params.bulletActiveClass);

	    if (params.clickable) {
	      $el.off('click', classesToSelector(params.bulletClass));
	    }
	  }

	  on('init', () => {
	    if (swiper.params.pagination.enabled === false) {
	      // eslint-disable-next-line
	      disable();
	    } else {
	      init();
	      render();
	      update();
	    }
	  });
	  on('activeIndexChange', () => {
	    if (swiper.params.loop) {
	      update();
	    } else if (typeof swiper.snapIndex === 'undefined') {
	      update();
	    }
	  });
	  on('snapIndexChange', () => {
	    if (!swiper.params.loop) {
	      update();
	    }
	  });
	  on('slidesLengthChange', () => {
	    if (swiper.params.loop) {
	      render();
	      update();
	    }
	  });
	  on('snapGridLengthChange', () => {
	    if (!swiper.params.loop) {
	      render();
	      update();
	    }
	  });
	  on('destroy', () => {
	    destroy();
	  });
	  on('enable disable', () => {
	    const {
	      $el
	    } = swiper.pagination;

	    if ($el) {
	      $el[swiper.enabled ? 'removeClass' : 'addClass'](swiper.params.pagination.lockClass);
	    }
	  });
	  on('lock unlock', () => {
	    update();
	  });
	  on('click', (_s, e) => {
	    const targetEl = e.target;
	    const {
	      $el
	    } = swiper.pagination;

	    if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && $el && $el.length > 0 && !$(targetEl).hasClass(swiper.params.pagination.bulletClass)) {
	      if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl)) return;
	      const isHidden = $el.hasClass(swiper.params.pagination.hiddenClass);

	      if (isHidden === true) {
	        emit('paginationShow');
	      } else {
	        emit('paginationHide');
	      }

	      $el.toggleClass(swiper.params.pagination.hiddenClass);
	    }
	  });

	  const enable = () => {
	    swiper.$el.removeClass(swiper.params.pagination.paginationDisabledClass);

	    if (swiper.pagination.$el) {
	      swiper.pagination.$el.removeClass(swiper.params.pagination.paginationDisabledClass);
	    }

	    init();
	    render();
	    update();
	  };

	  const disable = () => {
	    swiper.$el.addClass(swiper.params.pagination.paginationDisabledClass);

	    if (swiper.pagination.$el) {
	      swiper.pagination.$el.addClass(swiper.params.pagination.paginationDisabledClass);
	    }

	    destroy();
	  };

	  Object.assign(swiper.pagination, {
	    enable,
	    disable,
	    render,
	    update,
	    init,
	    destroy
	  });
	}

	function Zoom({
	  swiper,
	  extendParams,
	  on,
	  emit
	}) {
	  const window = getWindow();
	  extendParams({
	    zoom: {
	      enabled: false,
	      maxRatio: 3,
	      minRatio: 1,
	      toggle: true,
	      containerClass: 'swiper-zoom-container',
	      zoomedSlideClass: 'swiper-slide-zoomed'
	    }
	  });
	  swiper.zoom = {
	    enabled: false
	  };
	  let currentScale = 1;
	  let isScaling = false;
	  let gesturesEnabled;
	  let fakeGestureTouched;
	  let fakeGestureMoved;
	  const gesture = {
	    $slideEl: undefined,
	    slideWidth: undefined,
	    slideHeight: undefined,
	    $imageEl: undefined,
	    $imageWrapEl: undefined,
	    maxRatio: 3
	  };
	  const image = {
	    isTouched: undefined,
	    isMoved: undefined,
	    currentX: undefined,
	    currentY: undefined,
	    minX: undefined,
	    minY: undefined,
	    maxX: undefined,
	    maxY: undefined,
	    width: undefined,
	    height: undefined,
	    startX: undefined,
	    startY: undefined,
	    touchesStart: {},
	    touchesCurrent: {}
	  };
	  const velocity = {
	    x: undefined,
	    y: undefined,
	    prevPositionX: undefined,
	    prevPositionY: undefined,
	    prevTime: undefined
	  };
	  let scale = 1;
	  Object.defineProperty(swiper.zoom, 'scale', {
	    get() {
	      return scale;
	    },

	    set(value) {
	      if (scale !== value) {
	        const imageEl = gesture.$imageEl ? gesture.$imageEl[0] : undefined;
	        const slideEl = gesture.$slideEl ? gesture.$slideEl[0] : undefined;
	        emit('zoomChange', value, imageEl, slideEl);
	      }

	      scale = value;
	    }

	  });

	  function getDistanceBetweenTouches(e) {
	    if (e.targetTouches.length < 2) return 1;
	    const x1 = e.targetTouches[0].pageX;
	    const y1 = e.targetTouches[0].pageY;
	    const x2 = e.targetTouches[1].pageX;
	    const y2 = e.targetTouches[1].pageY;
	    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	    return distance;
	  } // Events


	  function onGestureStart(e) {
	    const support = swiper.support;
	    const params = swiper.params.zoom;
	    fakeGestureTouched = false;
	    fakeGestureMoved = false;

	    if (!support.gestures) {
	      if (e.type !== 'touchstart' || e.type === 'touchstart' && e.targetTouches.length < 2) {
	        return;
	      }

	      fakeGestureTouched = true;
	      gesture.scaleStart = getDistanceBetweenTouches(e);
	    }

	    if (!gesture.$slideEl || !gesture.$slideEl.length) {
	      gesture.$slideEl = $(e.target).closest(`.${swiper.params.slideClass}`);
	      if (gesture.$slideEl.length === 0) gesture.$slideEl = swiper.slides.eq(swiper.activeIndex);
	      gesture.$imageEl = gesture.$slideEl.find(`.${params.containerClass}`).eq(0).find('picture, img, svg, canvas, .swiper-zoom-target').eq(0);
	      gesture.$imageWrapEl = gesture.$imageEl.parent(`.${params.containerClass}`);
	      gesture.maxRatio = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;

	      if (gesture.$imageWrapEl.length === 0) {
	        gesture.$imageEl = undefined;
	        return;
	      }
	    }

	    if (gesture.$imageEl) {
	      gesture.$imageEl.transition(0);
	    }

	    isScaling = true;
	  }

	  function onGestureChange(e) {
	    const support = swiper.support;
	    const params = swiper.params.zoom;
	    const zoom = swiper.zoom;

	    if (!support.gestures) {
	      if (e.type !== 'touchmove' || e.type === 'touchmove' && e.targetTouches.length < 2) {
	        return;
	      }

	      fakeGestureMoved = true;
	      gesture.scaleMove = getDistanceBetweenTouches(e);
	    }

	    if (!gesture.$imageEl || gesture.$imageEl.length === 0) {
	      if (e.type === 'gesturechange') onGestureStart(e);
	      return;
	    }

	    if (support.gestures) {
	      zoom.scale = e.scale * currentScale;
	    } else {
	      zoom.scale = gesture.scaleMove / gesture.scaleStart * currentScale;
	    }

	    if (zoom.scale > gesture.maxRatio) {
	      zoom.scale = gesture.maxRatio - 1 + (zoom.scale - gesture.maxRatio + 1) ** 0.5;
	    }

	    if (zoom.scale < params.minRatio) {
	      zoom.scale = params.minRatio + 1 - (params.minRatio - zoom.scale + 1) ** 0.5;
	    }

	    gesture.$imageEl.transform(`translate3d(0,0,0) scale(${zoom.scale})`);
	  }

	  function onGestureEnd(e) {
	    const device = swiper.device;
	    const support = swiper.support;
	    const params = swiper.params.zoom;
	    const zoom = swiper.zoom;

	    if (!support.gestures) {
	      if (!fakeGestureTouched || !fakeGestureMoved) {
	        return;
	      }

	      if (e.type !== 'touchend' || e.type === 'touchend' && e.changedTouches.length < 2 && !device.android) {
	        return;
	      }

	      fakeGestureTouched = false;
	      fakeGestureMoved = false;
	    }

	    if (!gesture.$imageEl || gesture.$imageEl.length === 0) return;
	    zoom.scale = Math.max(Math.min(zoom.scale, gesture.maxRatio), params.minRatio);
	    gesture.$imageEl.transition(swiper.params.speed).transform(`translate3d(0,0,0) scale(${zoom.scale})`);
	    currentScale = zoom.scale;
	    isScaling = false;
	    if (zoom.scale === 1) gesture.$slideEl = undefined;
	  }

	  function onTouchStart(e) {
	    const device = swiper.device;
	    if (!gesture.$imageEl || gesture.$imageEl.length === 0) return;
	    if (image.isTouched) return;
	    if (device.android && e.cancelable) e.preventDefault();
	    image.isTouched = true;
	    image.touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
	    image.touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
	  }

	  function onTouchMove(e) {
	    const zoom = swiper.zoom;
	    if (!gesture.$imageEl || gesture.$imageEl.length === 0) return;
	    swiper.allowClick = false;
	    if (!image.isTouched || !gesture.$slideEl) return;

	    if (!image.isMoved) {
	      image.width = gesture.$imageEl[0].offsetWidth;
	      image.height = gesture.$imageEl[0].offsetHeight;
	      image.startX = getTranslate(gesture.$imageWrapEl[0], 'x') || 0;
	      image.startY = getTranslate(gesture.$imageWrapEl[0], 'y') || 0;
	      gesture.slideWidth = gesture.$slideEl[0].offsetWidth;
	      gesture.slideHeight = gesture.$slideEl[0].offsetHeight;
	      gesture.$imageWrapEl.transition(0);
	    } // Define if we need image drag


	    const scaledWidth = image.width * zoom.scale;
	    const scaledHeight = image.height * zoom.scale;
	    if (scaledWidth < gesture.slideWidth && scaledHeight < gesture.slideHeight) return;
	    image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
	    image.maxX = -image.minX;
	    image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
	    image.maxY = -image.minY;
	    image.touchesCurrent.x = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
	    image.touchesCurrent.y = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

	    if (!image.isMoved && !isScaling) {
	      if (swiper.isHorizontal() && (Math.floor(image.minX) === Math.floor(image.startX) && image.touchesCurrent.x < image.touchesStart.x || Math.floor(image.maxX) === Math.floor(image.startX) && image.touchesCurrent.x > image.touchesStart.x)) {
	        image.isTouched = false;
	        return;
	      }

	      if (!swiper.isHorizontal() && (Math.floor(image.minY) === Math.floor(image.startY) && image.touchesCurrent.y < image.touchesStart.y || Math.floor(image.maxY) === Math.floor(image.startY) && image.touchesCurrent.y > image.touchesStart.y)) {
	        image.isTouched = false;
	        return;
	      }
	    }

	    if (e.cancelable) {
	      e.preventDefault();
	    }

	    e.stopPropagation();
	    image.isMoved = true;
	    image.currentX = image.touchesCurrent.x - image.touchesStart.x + image.startX;
	    image.currentY = image.touchesCurrent.y - image.touchesStart.y + image.startY;

	    if (image.currentX < image.minX) {
	      image.currentX = image.minX + 1 - (image.minX - image.currentX + 1) ** 0.8;
	    }

	    if (image.currentX > image.maxX) {
	      image.currentX = image.maxX - 1 + (image.currentX - image.maxX + 1) ** 0.8;
	    }

	    if (image.currentY < image.minY) {
	      image.currentY = image.minY + 1 - (image.minY - image.currentY + 1) ** 0.8;
	    }

	    if (image.currentY > image.maxY) {
	      image.currentY = image.maxY - 1 + (image.currentY - image.maxY + 1) ** 0.8;
	    } // Velocity


	    if (!velocity.prevPositionX) velocity.prevPositionX = image.touchesCurrent.x;
	    if (!velocity.prevPositionY) velocity.prevPositionY = image.touchesCurrent.y;
	    if (!velocity.prevTime) velocity.prevTime = Date.now();
	    velocity.x = (image.touchesCurrent.x - velocity.prevPositionX) / (Date.now() - velocity.prevTime) / 2;
	    velocity.y = (image.touchesCurrent.y - velocity.prevPositionY) / (Date.now() - velocity.prevTime) / 2;
	    if (Math.abs(image.touchesCurrent.x - velocity.prevPositionX) < 2) velocity.x = 0;
	    if (Math.abs(image.touchesCurrent.y - velocity.prevPositionY) < 2) velocity.y = 0;
	    velocity.prevPositionX = image.touchesCurrent.x;
	    velocity.prevPositionY = image.touchesCurrent.y;
	    velocity.prevTime = Date.now();
	    gesture.$imageWrapEl.transform(`translate3d(${image.currentX}px, ${image.currentY}px,0)`);
	  }

	  function onTouchEnd() {
	    const zoom = swiper.zoom;
	    if (!gesture.$imageEl || gesture.$imageEl.length === 0) return;

	    if (!image.isTouched || !image.isMoved) {
	      image.isTouched = false;
	      image.isMoved = false;
	      return;
	    }

	    image.isTouched = false;
	    image.isMoved = false;
	    let momentumDurationX = 300;
	    let momentumDurationY = 300;
	    const momentumDistanceX = velocity.x * momentumDurationX;
	    const newPositionX = image.currentX + momentumDistanceX;
	    const momentumDistanceY = velocity.y * momentumDurationY;
	    const newPositionY = image.currentY + momentumDistanceY; // Fix duration

	    if (velocity.x !== 0) momentumDurationX = Math.abs((newPositionX - image.currentX) / velocity.x);
	    if (velocity.y !== 0) momentumDurationY = Math.abs((newPositionY - image.currentY) / velocity.y);
	    const momentumDuration = Math.max(momentumDurationX, momentumDurationY);
	    image.currentX = newPositionX;
	    image.currentY = newPositionY; // Define if we need image drag

	    const scaledWidth = image.width * zoom.scale;
	    const scaledHeight = image.height * zoom.scale;
	    image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
	    image.maxX = -image.minX;
	    image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
	    image.maxY = -image.minY;
	    image.currentX = Math.max(Math.min(image.currentX, image.maxX), image.minX);
	    image.currentY = Math.max(Math.min(image.currentY, image.maxY), image.minY);
	    gesture.$imageWrapEl.transition(momentumDuration).transform(`translate3d(${image.currentX}px, ${image.currentY}px,0)`);
	  }

	  function onTransitionEnd() {
	    const zoom = swiper.zoom;

	    if (gesture.$slideEl && swiper.previousIndex !== swiper.activeIndex) {
	      if (gesture.$imageEl) {
	        gesture.$imageEl.transform('translate3d(0,0,0) scale(1)');
	      }

	      if (gesture.$imageWrapEl) {
	        gesture.$imageWrapEl.transform('translate3d(0,0,0)');
	      }

	      zoom.scale = 1;
	      currentScale = 1;
	      gesture.$slideEl = undefined;
	      gesture.$imageEl = undefined;
	      gesture.$imageWrapEl = undefined;
	    }
	  }

	  function zoomIn(e) {
	    const zoom = swiper.zoom;
	    const params = swiper.params.zoom;

	    if (!gesture.$slideEl) {
	      if (e && e.target) {
	        gesture.$slideEl = $(e.target).closest(`.${swiper.params.slideClass}`);
	      }

	      if (!gesture.$slideEl) {
	        if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
	          gesture.$slideEl = swiper.$wrapperEl.children(`.${swiper.params.slideActiveClass}`);
	        } else {
	          gesture.$slideEl = swiper.slides.eq(swiper.activeIndex);
	        }
	      }

	      gesture.$imageEl = gesture.$slideEl.find(`.${params.containerClass}`).eq(0).find('picture, img, svg, canvas, .swiper-zoom-target').eq(0);
	      gesture.$imageWrapEl = gesture.$imageEl.parent(`.${params.containerClass}`);
	    }

	    if (!gesture.$imageEl || gesture.$imageEl.length === 0 || !gesture.$imageWrapEl || gesture.$imageWrapEl.length === 0) return;

	    if (swiper.params.cssMode) {
	      swiper.wrapperEl.style.overflow = 'hidden';
	      swiper.wrapperEl.style.touchAction = 'none';
	    }

	    gesture.$slideEl.addClass(`${params.zoomedSlideClass}`);
	    let touchX;
	    let touchY;
	    let offsetX;
	    let offsetY;
	    let diffX;
	    let diffY;
	    let translateX;
	    let translateY;
	    let imageWidth;
	    let imageHeight;
	    let scaledWidth;
	    let scaledHeight;
	    let translateMinX;
	    let translateMinY;
	    let translateMaxX;
	    let translateMaxY;
	    let slideWidth;
	    let slideHeight;

	    if (typeof image.touchesStart.x === 'undefined' && e) {
	      touchX = e.type === 'touchend' ? e.changedTouches[0].pageX : e.pageX;
	      touchY = e.type === 'touchend' ? e.changedTouches[0].pageY : e.pageY;
	    } else {
	      touchX = image.touchesStart.x;
	      touchY = image.touchesStart.y;
	    }

	    zoom.scale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
	    currentScale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;

	    if (e) {
	      slideWidth = gesture.$slideEl[0].offsetWidth;
	      slideHeight = gesture.$slideEl[0].offsetHeight;
	      offsetX = gesture.$slideEl.offset().left + window.scrollX;
	      offsetY = gesture.$slideEl.offset().top + window.scrollY;
	      diffX = offsetX + slideWidth / 2 - touchX;
	      diffY = offsetY + slideHeight / 2 - touchY;
	      imageWidth = gesture.$imageEl[0].offsetWidth;
	      imageHeight = gesture.$imageEl[0].offsetHeight;
	      scaledWidth = imageWidth * zoom.scale;
	      scaledHeight = imageHeight * zoom.scale;
	      translateMinX = Math.min(slideWidth / 2 - scaledWidth / 2, 0);
	      translateMinY = Math.min(slideHeight / 2 - scaledHeight / 2, 0);
	      translateMaxX = -translateMinX;
	      translateMaxY = -translateMinY;
	      translateX = diffX * zoom.scale;
	      translateY = diffY * zoom.scale;

	      if (translateX < translateMinX) {
	        translateX = translateMinX;
	      }

	      if (translateX > translateMaxX) {
	        translateX = translateMaxX;
	      }

	      if (translateY < translateMinY) {
	        translateY = translateMinY;
	      }

	      if (translateY > translateMaxY) {
	        translateY = translateMaxY;
	      }
	    } else {
	      translateX = 0;
	      translateY = 0;
	    }

	    gesture.$imageWrapEl.transition(300).transform(`translate3d(${translateX}px, ${translateY}px,0)`);
	    gesture.$imageEl.transition(300).transform(`translate3d(0,0,0) scale(${zoom.scale})`);
	  }

	  function zoomOut() {
	    const zoom = swiper.zoom;
	    const params = swiper.params.zoom;

	    if (!gesture.$slideEl) {
	      if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
	        gesture.$slideEl = swiper.$wrapperEl.children(`.${swiper.params.slideActiveClass}`);
	      } else {
	        gesture.$slideEl = swiper.slides.eq(swiper.activeIndex);
	      }

	      gesture.$imageEl = gesture.$slideEl.find(`.${params.containerClass}`).eq(0).find('picture, img, svg, canvas, .swiper-zoom-target').eq(0);
	      gesture.$imageWrapEl = gesture.$imageEl.parent(`.${params.containerClass}`);
	    }

	    if (!gesture.$imageEl || gesture.$imageEl.length === 0 || !gesture.$imageWrapEl || gesture.$imageWrapEl.length === 0) return;

	    if (swiper.params.cssMode) {
	      swiper.wrapperEl.style.overflow = '';
	      swiper.wrapperEl.style.touchAction = '';
	    }

	    zoom.scale = 1;
	    currentScale = 1;
	    gesture.$imageWrapEl.transition(300).transform('translate3d(0,0,0)');
	    gesture.$imageEl.transition(300).transform('translate3d(0,0,0) scale(1)');
	    gesture.$slideEl.removeClass(`${params.zoomedSlideClass}`);
	    gesture.$slideEl = undefined;
	  } // Toggle Zoom


	  function zoomToggle(e) {
	    const zoom = swiper.zoom;

	    if (zoom.scale && zoom.scale !== 1) {
	      // Zoom Out
	      zoomOut();
	    } else {
	      // Zoom In
	      zoomIn(e);
	    }
	  }

	  function getListeners() {
	    const support = swiper.support;
	    const passiveListener = swiper.touchEvents.start === 'touchstart' && support.passiveListener && swiper.params.passiveListeners ? {
	      passive: true,
	      capture: false
	    } : false;
	    const activeListenerWithCapture = support.passiveListener ? {
	      passive: false,
	      capture: true
	    } : true;
	    return {
	      passiveListener,
	      activeListenerWithCapture
	    };
	  }

	  function getSlideSelector() {
	    return `.${swiper.params.slideClass}`;
	  }

	  function toggleGestures(method) {
	    const {
	      passiveListener
	    } = getListeners();
	    const slideSelector = getSlideSelector();
	    swiper.$wrapperEl[method]('gesturestart', slideSelector, onGestureStart, passiveListener);
	    swiper.$wrapperEl[method]('gesturechange', slideSelector, onGestureChange, passiveListener);
	    swiper.$wrapperEl[method]('gestureend', slideSelector, onGestureEnd, passiveListener);
	  }

	  function enableGestures() {
	    if (gesturesEnabled) return;
	    gesturesEnabled = true;
	    toggleGestures('on');
	  }

	  function disableGestures() {
	    if (!gesturesEnabled) return;
	    gesturesEnabled = false;
	    toggleGestures('off');
	  } // Attach/Detach Events


	  function enable() {
	    const zoom = swiper.zoom;
	    if (zoom.enabled) return;
	    zoom.enabled = true;
	    const support = swiper.support;
	    const {
	      passiveListener,
	      activeListenerWithCapture
	    } = getListeners();
	    const slideSelector = getSlideSelector(); // Scale image

	    if (support.gestures) {
	      swiper.$wrapperEl.on(swiper.touchEvents.start, enableGestures, passiveListener);
	      swiper.$wrapperEl.on(swiper.touchEvents.end, disableGestures, passiveListener);
	    } else if (swiper.touchEvents.start === 'touchstart') {
	      swiper.$wrapperEl.on(swiper.touchEvents.start, slideSelector, onGestureStart, passiveListener);
	      swiper.$wrapperEl.on(swiper.touchEvents.move, slideSelector, onGestureChange, activeListenerWithCapture);
	      swiper.$wrapperEl.on(swiper.touchEvents.end, slideSelector, onGestureEnd, passiveListener);

	      if (swiper.touchEvents.cancel) {
	        swiper.$wrapperEl.on(swiper.touchEvents.cancel, slideSelector, onGestureEnd, passiveListener);
	      }
	    } // Move image


	    swiper.$wrapperEl.on(swiper.touchEvents.move, `.${swiper.params.zoom.containerClass}`, onTouchMove, activeListenerWithCapture);
	  }

	  function disable() {
	    const zoom = swiper.zoom;
	    if (!zoom.enabled) return;
	    const support = swiper.support;
	    zoom.enabled = false;
	    const {
	      passiveListener,
	      activeListenerWithCapture
	    } = getListeners();
	    const slideSelector = getSlideSelector(); // Scale image

	    if (support.gestures) {
	      swiper.$wrapperEl.off(swiper.touchEvents.start, enableGestures, passiveListener);
	      swiper.$wrapperEl.off(swiper.touchEvents.end, disableGestures, passiveListener);
	    } else if (swiper.touchEvents.start === 'touchstart') {
	      swiper.$wrapperEl.off(swiper.touchEvents.start, slideSelector, onGestureStart, passiveListener);
	      swiper.$wrapperEl.off(swiper.touchEvents.move, slideSelector, onGestureChange, activeListenerWithCapture);
	      swiper.$wrapperEl.off(swiper.touchEvents.end, slideSelector, onGestureEnd, passiveListener);

	      if (swiper.touchEvents.cancel) {
	        swiper.$wrapperEl.off(swiper.touchEvents.cancel, slideSelector, onGestureEnd, passiveListener);
	      }
	    } // Move image


	    swiper.$wrapperEl.off(swiper.touchEvents.move, `.${swiper.params.zoom.containerClass}`, onTouchMove, activeListenerWithCapture);
	  }

	  on('init', () => {
	    if (swiper.params.zoom.enabled) {
	      enable();
	    }
	  });
	  on('destroy', () => {
	    disable();
	  });
	  on('touchStart', (_s, e) => {
	    if (!swiper.zoom.enabled) return;
	    onTouchStart(e);
	  });
	  on('touchEnd', (_s, e) => {
	    if (!swiper.zoom.enabled) return;
	    onTouchEnd();
	  });
	  on('doubleTap', (_s, e) => {
	    if (!swiper.animating && swiper.params.zoom.enabled && swiper.zoom.enabled && swiper.params.zoom.toggle) {
	      zoomToggle(e);
	    }
	  });
	  on('transitionEnd', () => {
	    if (swiper.zoom.enabled && swiper.params.zoom.enabled) {
	      onTransitionEnd();
	    }
	  });
	  on('slideChange', () => {
	    if (swiper.zoom.enabled && swiper.params.zoom.enabled && swiper.params.cssMode) {
	      onTransitionEnd();
	    }
	  });
	  Object.assign(swiper.zoom, {
	    enable,
	    disable,
	    in: zoomIn,
	    out: zoomOut,
	    toggle: zoomToggle
	  });
	}

	function A11y({
	  swiper,
	  extendParams,
	  on
	}) {
	  extendParams({
	    a11y: {
	      enabled: true,
	      notificationClass: 'swiper-notification',
	      prevSlideMessage: 'Previous slide',
	      nextSlideMessage: 'Next slide',
	      firstSlideMessage: 'This is the first slide',
	      lastSlideMessage: 'This is the last slide',
	      paginationBulletMessage: 'Go to slide {{index}}',
	      slideLabelMessage: '{{index}} / {{slidesLength}}',
	      containerMessage: null,
	      containerRoleDescriptionMessage: null,
	      itemRoleDescriptionMessage: null,
	      slideRole: 'group',
	      id: null
	    }
	  });
	  swiper.a11y = {
	    clicked: false
	  };
	  let liveRegion = null;

	  function notify(message) {
	    const notification = liveRegion;
	    if (notification.length === 0) return;
	    notification.html('');
	    notification.html(message);
	  }

	  function getRandomNumber(size = 16) {
	    const randomChar = () => Math.round(16 * Math.random()).toString(16);

	    return 'x'.repeat(size).replace(/x/g, randomChar);
	  }

	  function makeElFocusable($el) {
	    $el.attr('tabIndex', '0');
	  }

	  function makeElNotFocusable($el) {
	    $el.attr('tabIndex', '-1');
	  }

	  function addElRole($el, role) {
	    $el.attr('role', role);
	  }

	  function addElRoleDescription($el, description) {
	    $el.attr('aria-roledescription', description);
	  }

	  function addElControls($el, controls) {
	    $el.attr('aria-controls', controls);
	  }

	  function addElLabel($el, label) {
	    $el.attr('aria-label', label);
	  }

	  function addElId($el, id) {
	    $el.attr('id', id);
	  }

	  function addElLive($el, live) {
	    $el.attr('aria-live', live);
	  }

	  function disableEl($el) {
	    $el.attr('aria-disabled', true);
	  }

	  function enableEl($el) {
	    $el.attr('aria-disabled', false);
	  }

	  function onEnterOrSpaceKey(e) {
	    if (e.keyCode !== 13 && e.keyCode !== 32) return;
	    const params = swiper.params.a11y;
	    const $targetEl = $(e.target);

	    if (swiper.navigation && swiper.navigation.$nextEl && $targetEl.is(swiper.navigation.$nextEl)) {
	      if (!(swiper.isEnd && !swiper.params.loop)) {
	        swiper.slideNext();
	      }

	      if (swiper.isEnd) {
	        notify(params.lastSlideMessage);
	      } else {
	        notify(params.nextSlideMessage);
	      }
	    }

	    if (swiper.navigation && swiper.navigation.$prevEl && $targetEl.is(swiper.navigation.$prevEl)) {
	      if (!(swiper.isBeginning && !swiper.params.loop)) {
	        swiper.slidePrev();
	      }

	      if (swiper.isBeginning) {
	        notify(params.firstSlideMessage);
	      } else {
	        notify(params.prevSlideMessage);
	      }
	    }

	    if (swiper.pagination && $targetEl.is(classesToSelector(swiper.params.pagination.bulletClass))) {
	      $targetEl[0].click();
	    }
	  }

	  function updateNavigation() {
	    if (swiper.params.loop || swiper.params.rewind || !swiper.navigation) return;
	    const {
	      $nextEl,
	      $prevEl
	    } = swiper.navigation;

	    if ($prevEl && $prevEl.length > 0) {
	      if (swiper.isBeginning) {
	        disableEl($prevEl);
	        makeElNotFocusable($prevEl);
	      } else {
	        enableEl($prevEl);
	        makeElFocusable($prevEl);
	      }
	    }

	    if ($nextEl && $nextEl.length > 0) {
	      if (swiper.isEnd) {
	        disableEl($nextEl);
	        makeElNotFocusable($nextEl);
	      } else {
	        enableEl($nextEl);
	        makeElFocusable($nextEl);
	      }
	    }
	  }

	  function hasPagination() {
	    return swiper.pagination && swiper.pagination.bullets && swiper.pagination.bullets.length;
	  }

	  function hasClickablePagination() {
	    return hasPagination() && swiper.params.pagination.clickable;
	  }

	  function updatePagination() {
	    const params = swiper.params.a11y;
	    if (!hasPagination()) return;
	    swiper.pagination.bullets.each(bulletEl => {
	      const $bulletEl = $(bulletEl);

	      if (swiper.params.pagination.clickable) {
	        makeElFocusable($bulletEl);

	        if (!swiper.params.pagination.renderBullet) {
	          addElRole($bulletEl, 'button');
	          addElLabel($bulletEl, params.paginationBulletMessage.replace(/\{\{index\}\}/, $bulletEl.index() + 1));
	        }
	      }

	      if ($bulletEl.is(`.${swiper.params.pagination.bulletActiveClass}`)) {
	        $bulletEl.attr('aria-current', 'true');
	      } else {
	        $bulletEl.removeAttr('aria-current');
	      }
	    });
	  }

	  const initNavEl = ($el, wrapperId, message) => {
	    makeElFocusable($el);

	    if ($el[0].tagName !== 'BUTTON') {
	      addElRole($el, 'button');
	      $el.on('keydown', onEnterOrSpaceKey);
	    }

	    addElLabel($el, message);
	    addElControls($el, wrapperId);
	  };

	  const handlePointerDown = () => {
	    swiper.a11y.clicked = true;
	  };

	  const handlePointerUp = () => {
	    requestAnimationFrame(() => {
	      requestAnimationFrame(() => {
	        if (!swiper.destroyed) {
	          swiper.a11y.clicked = false;
	        }
	      });
	    });
	  };

	  const handleFocus = e => {
	    if (swiper.a11y.clicked) return;
	    const slideEl = e.target.closest(`.${swiper.params.slideClass}`);
	    if (!slideEl || !swiper.slides.includes(slideEl)) return;
	    const isActive = swiper.slides.indexOf(slideEl) === swiper.activeIndex;
	    const isVisible = swiper.params.watchSlidesProgress && swiper.visibleSlides && swiper.visibleSlides.includes(slideEl);
	    if (isActive || isVisible) return;
	    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;

	    if (swiper.isHorizontal()) {
	      swiper.el.scrollLeft = 0;
	    } else {
	      swiper.el.scrollTop = 0;
	    }

	    swiper.slideTo(swiper.slides.indexOf(slideEl), 0);
	  };

	  const initSlides = () => {
	    const params = swiper.params.a11y;

	    if (params.itemRoleDescriptionMessage) {
	      addElRoleDescription($(swiper.slides), params.itemRoleDescriptionMessage);
	    }

	    if (params.slideRole) {
	      addElRole($(swiper.slides), params.slideRole);
	    }

	    const slidesLength = swiper.params.loop ? swiper.slides.filter(el => !el.classList.contains(swiper.params.slideDuplicateClass)).length : swiper.slides.length;

	    if (params.slideLabelMessage) {
	      swiper.slides.each((slideEl, index) => {
	        const $slideEl = $(slideEl);
	        const slideIndex = swiper.params.loop ? parseInt($slideEl.attr('data-swiper-slide-index'), 10) : index;
	        const ariaLabelMessage = params.slideLabelMessage.replace(/\{\{index\}\}/, slideIndex + 1).replace(/\{\{slidesLength\}\}/, slidesLength);
	        addElLabel($slideEl, ariaLabelMessage);
	      });
	    }
	  };

	  const init = () => {
	    const params = swiper.params.a11y;
	    swiper.$el.append(liveRegion); // Container

	    const $containerEl = swiper.$el;

	    if (params.containerRoleDescriptionMessage) {
	      addElRoleDescription($containerEl, params.containerRoleDescriptionMessage);
	    }

	    if (params.containerMessage) {
	      addElLabel($containerEl, params.containerMessage);
	    } // Wrapper


	    const $wrapperEl = swiper.$wrapperEl;
	    const wrapperId = params.id || $wrapperEl.attr('id') || `swiper-wrapper-${getRandomNumber(16)}`;
	    const live = swiper.params.autoplay && swiper.params.autoplay.enabled ? 'off' : 'polite';
	    addElId($wrapperEl, wrapperId);
	    addElLive($wrapperEl, live); // Slide

	    initSlides(); // Navigation

	    let $nextEl;
	    let $prevEl;

	    if (swiper.navigation && swiper.navigation.$nextEl) {
	      $nextEl = swiper.navigation.$nextEl;
	    }

	    if (swiper.navigation && swiper.navigation.$prevEl) {
	      $prevEl = swiper.navigation.$prevEl;
	    }

	    if ($nextEl && $nextEl.length) {
	      initNavEl($nextEl, wrapperId, params.nextSlideMessage);
	    }

	    if ($prevEl && $prevEl.length) {
	      initNavEl($prevEl, wrapperId, params.prevSlideMessage);
	    } // Pagination


	    if (hasClickablePagination()) {
	      swiper.pagination.$el.on('keydown', classesToSelector(swiper.params.pagination.bulletClass), onEnterOrSpaceKey);
	    } // Tab focus


	    swiper.$el.on('focus', handleFocus, true);
	    swiper.$el.on('pointerdown', handlePointerDown, true);
	    swiper.$el.on('pointerup', handlePointerUp, true);
	  };

	  function destroy() {
	    if (liveRegion && liveRegion.length > 0) liveRegion.remove();
	    let $nextEl;
	    let $prevEl;

	    if (swiper.navigation && swiper.navigation.$nextEl) {
	      $nextEl = swiper.navigation.$nextEl;
	    }

	    if (swiper.navigation && swiper.navigation.$prevEl) {
	      $prevEl = swiper.navigation.$prevEl;
	    }

	    if ($nextEl) {
	      $nextEl.off('keydown', onEnterOrSpaceKey);
	    }

	    if ($prevEl) {
	      $prevEl.off('keydown', onEnterOrSpaceKey);
	    } // Pagination


	    if (hasClickablePagination()) {
	      swiper.pagination.$el.off('keydown', classesToSelector(swiper.params.pagination.bulletClass), onEnterOrSpaceKey);
	    } // Tab focus


	    swiper.$el.off('focus', handleFocus, true);
	    swiper.$el.off('pointerdown', handlePointerDown, true);
	    swiper.$el.off('pointerup', handlePointerUp, true);
	  }

	  on('beforeInit', () => {
	    liveRegion = $(`<span class="${swiper.params.a11y.notificationClass}" aria-live="assertive" aria-atomic="true"></span>`);
	  });
	  on('afterInit', () => {
	    if (!swiper.params.a11y.enabled) return;
	    init();
	  });
	  on('slidesLengthChange snapGridLengthChange slidesGridLengthChange', () => {
	    if (!swiper.params.a11y.enabled) return;
	    initSlides();
	  });
	  on('fromEdge toEdge afterInit lock unlock', () => {
	    if (!swiper.params.a11y.enabled) return;
	    updateNavigation();
	  });
	  on('paginationUpdate', () => {
	    if (!swiper.params.a11y.enabled) return;
	    updatePagination();
	  });
	  on('destroy', () => {
	    if (!swiper.params.a11y.enabled) return;
	    destroy();
	  });
	}

	function Thumb({
	  swiper,
	  extendParams,
	  on
	}) {
	  extendParams({
	    thumbs: {
	      swiper: null,
	      multipleActiveThumbs: true,
	      autoScrollOffset: 0,
	      slideThumbActiveClass: 'swiper-slide-thumb-active',
	      thumbsContainerClass: 'swiper-thumbs'
	    }
	  });
	  let initialized = false;
	  let swiperCreated = false;
	  swiper.thumbs = {
	    swiper: null
	  };

	  function onThumbClick() {
	    const thumbsSwiper = swiper.thumbs.swiper;
	    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
	    const clickedIndex = thumbsSwiper.clickedIndex;
	    const clickedSlide = thumbsSwiper.clickedSlide;
	    if (clickedSlide && $(clickedSlide).hasClass(swiper.params.thumbs.slideThumbActiveClass)) return;
	    if (typeof clickedIndex === 'undefined' || clickedIndex === null) return;
	    let slideToIndex;

	    if (thumbsSwiper.params.loop) {
	      slideToIndex = parseInt($(thumbsSwiper.clickedSlide).attr('data-swiper-slide-index'), 10);
	    } else {
	      slideToIndex = clickedIndex;
	    }

	    if (swiper.params.loop) {
	      let currentIndex = swiper.activeIndex;

	      if (swiper.slides.eq(currentIndex).hasClass(swiper.params.slideDuplicateClass)) {
	        swiper.loopFix(); // eslint-disable-next-line

	        swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
	        currentIndex = swiper.activeIndex;
	      }

	      const prevIndex = swiper.slides.eq(currentIndex).prevAll(`[data-swiper-slide-index="${slideToIndex}"]`).eq(0).index();
	      const nextIndex = swiper.slides.eq(currentIndex).nextAll(`[data-swiper-slide-index="${slideToIndex}"]`).eq(0).index();
	      if (typeof prevIndex === 'undefined') slideToIndex = nextIndex;else if (typeof nextIndex === 'undefined') slideToIndex = prevIndex;else if (nextIndex - currentIndex < currentIndex - prevIndex) slideToIndex = nextIndex;else slideToIndex = prevIndex;
	    }

	    swiper.slideTo(slideToIndex);
	  }

	  function init() {
	    const {
	      thumbs: thumbsParams
	    } = swiper.params;
	    if (initialized) return false;
	    initialized = true;
	    const SwiperClass = swiper.constructor;

	    if (thumbsParams.swiper instanceof SwiperClass) {
	      swiper.thumbs.swiper = thumbsParams.swiper;
	      Object.assign(swiper.thumbs.swiper.originalParams, {
	        watchSlidesProgress: true,
	        slideToClickedSlide: false
	      });
	      Object.assign(swiper.thumbs.swiper.params, {
	        watchSlidesProgress: true,
	        slideToClickedSlide: false
	      });
	    } else if (isObject(thumbsParams.swiper)) {
	      const thumbsSwiperParams = Object.assign({}, thumbsParams.swiper);
	      Object.assign(thumbsSwiperParams, {
	        watchSlidesProgress: true,
	        slideToClickedSlide: false
	      });
	      swiper.thumbs.swiper = new SwiperClass(thumbsSwiperParams);
	      swiperCreated = true;
	    }

	    swiper.thumbs.swiper.$el.addClass(swiper.params.thumbs.thumbsContainerClass);
	    swiper.thumbs.swiper.on('tap', onThumbClick);
	    return true;
	  }

	  function update(initial) {
	    const thumbsSwiper = swiper.thumbs.swiper;
	    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
	    const slidesPerView = thumbsSwiper.params.slidesPerView === 'auto' ? thumbsSwiper.slidesPerViewDynamic() : thumbsSwiper.params.slidesPerView; // Activate thumbs

	    let thumbsToActivate = 1;
	    const thumbActiveClass = swiper.params.thumbs.slideThumbActiveClass;

	    if (swiper.params.slidesPerView > 1 && !swiper.params.centeredSlides) {
	      thumbsToActivate = swiper.params.slidesPerView;
	    }

	    if (!swiper.params.thumbs.multipleActiveThumbs) {
	      thumbsToActivate = 1;
	    }

	    thumbsToActivate = Math.floor(thumbsToActivate);
	    thumbsSwiper.slides.removeClass(thumbActiveClass);

	    if (thumbsSwiper.params.loop || thumbsSwiper.params.virtual && thumbsSwiper.params.virtual.enabled) {
	      for (let i = 0; i < thumbsToActivate; i += 1) {
	        thumbsSwiper.$wrapperEl.children(`[data-swiper-slide-index="${swiper.realIndex + i}"]`).addClass(thumbActiveClass);
	      }
	    } else {
	      for (let i = 0; i < thumbsToActivate; i += 1) {
	        thumbsSwiper.slides.eq(swiper.realIndex + i).addClass(thumbActiveClass);
	      }
	    }

	    const autoScrollOffset = swiper.params.thumbs.autoScrollOffset;
	    const useOffset = autoScrollOffset && !thumbsSwiper.params.loop;

	    if (swiper.realIndex !== thumbsSwiper.realIndex || useOffset) {
	      let currentThumbsIndex = thumbsSwiper.activeIndex;
	      let newThumbsIndex;
	      let direction;

	      if (thumbsSwiper.params.loop) {
	        if (thumbsSwiper.slides.eq(currentThumbsIndex).hasClass(thumbsSwiper.params.slideDuplicateClass)) {
	          thumbsSwiper.loopFix(); // eslint-disable-next-line

	          thumbsSwiper._clientLeft = thumbsSwiper.$wrapperEl[0].clientLeft;
	          currentThumbsIndex = thumbsSwiper.activeIndex;
	        } // Find actual thumbs index to slide to


	        const prevThumbsIndex = thumbsSwiper.slides.eq(currentThumbsIndex).prevAll(`[data-swiper-slide-index="${swiper.realIndex}"]`).eq(0).index();
	        const nextThumbsIndex = thumbsSwiper.slides.eq(currentThumbsIndex).nextAll(`[data-swiper-slide-index="${swiper.realIndex}"]`).eq(0).index();

	        if (typeof prevThumbsIndex === 'undefined') {
	          newThumbsIndex = nextThumbsIndex;
	        } else if (typeof nextThumbsIndex === 'undefined') {
	          newThumbsIndex = prevThumbsIndex;
	        } else if (nextThumbsIndex - currentThumbsIndex === currentThumbsIndex - prevThumbsIndex) {
	          newThumbsIndex = thumbsSwiper.params.slidesPerGroup > 1 ? nextThumbsIndex : currentThumbsIndex;
	        } else if (nextThumbsIndex - currentThumbsIndex < currentThumbsIndex - prevThumbsIndex) {
	          newThumbsIndex = nextThumbsIndex;
	        } else {
	          newThumbsIndex = prevThumbsIndex;
	        }

	        direction = swiper.activeIndex > swiper.previousIndex ? 'next' : 'prev';
	      } else {
	        newThumbsIndex = swiper.realIndex;
	        direction = newThumbsIndex > swiper.previousIndex ? 'next' : 'prev';
	      }

	      if (useOffset) {
	        newThumbsIndex += direction === 'next' ? autoScrollOffset : -1 * autoScrollOffset;
	      }

	      if (thumbsSwiper.visibleSlidesIndexes && thumbsSwiper.visibleSlidesIndexes.indexOf(newThumbsIndex) < 0) {
	        if (thumbsSwiper.params.centeredSlides) {
	          if (newThumbsIndex > currentThumbsIndex) {
	            newThumbsIndex = newThumbsIndex - Math.floor(slidesPerView / 2) + 1;
	          } else {
	            newThumbsIndex = newThumbsIndex + Math.floor(slidesPerView / 2) - 1;
	          }
	        } else if (newThumbsIndex > currentThumbsIndex && thumbsSwiper.params.slidesPerGroup === 1) ;

	        thumbsSwiper.slideTo(newThumbsIndex, initial ? 0 : undefined);
	      }
	    }
	  }

	  on('beforeInit', () => {
	    const {
	      thumbs
	    } = swiper.params;
	    if (!thumbs || !thumbs.swiper) return;
	    init();
	    update(true);
	  });
	  on('slideChange update resize observerUpdate', () => {
	    update();
	  });
	  on('setTransition', (_s, duration) => {
	    const thumbsSwiper = swiper.thumbs.swiper;
	    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
	    thumbsSwiper.setTransition(duration);
	  });
	  on('beforeDestroy', () => {
	    const thumbsSwiper = swiper.thumbs.swiper;
	    if (!thumbsSwiper || thumbsSwiper.destroyed) return;

	    if (swiperCreated) {
	      thumbsSwiper.destroy();
	    }
	  });
	  Object.assign(swiper.thumbs, {
	    init,
	    update
	  });
	}

	/**
	 * Mixin: Bind
	 * -----------------------------------------------------------------------------
	 * Mixin to set, remove and detect a class from a defined target.
	 * - Useful to avoid multiple event binds when initialising components.
	 *
	 */

	/**
	 * Create a new bind object.
	 * @param {HTMLElement} element - HTML element to bind with a class.
	 * @param {Object} config - Configuration.
	 */
	var bind = (element, config) => {
		/**
		 * Instance defaults settings.
		 */
		const defaults = {
			className: "post-init"
		};

		/**
		 * Instance settings.
		 */
		const settings = extendDefaults(defaults, config);

		/**
		 * Set bind class on target.
		 */
		function set() {
			if (!element.length) {
				element.classList.add(settings.className);
				return;
			}

			[...element].forEach((item) => {
				item.classList.add(settings.className);
			});
		}

		/**
		 * Remove bind class on target.
		 */
		function remove() {
			if (!element.length) {
				element.classList.remove(settings.className);
				return;
			}

			[...element].forEach((item) => {
				item.classList.remove(settings.className);
			});
		}

		/**
		 * Check if element has already been initialised.
		 */
		function isSet() {
			if (!element.length) {
				return element.classList.contains(settings.className);
			}

			return [...element].every((item) => {
				return item.classList.contains(settings.className);
			});
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			isSet,
			remove,
			set
		});
	};

	/**
	 * Currency Helpers
	 * -----------------------------------------------------------------------------
	 * A collection of useful functions that help with currency formatting
	 *
	 * Current contents
	 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
	 *
	 */

	const moneyFormat = '${{amount}}';

	/**
	 * Format money values based on your shop currency settings
	 * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
	 * or 3.00 dollars
	 * @param  {String} format - shop money_format setting
	 * @return {String} value - formatted value
	 */
	function formatMoney(cents, format) {
	  if (typeof cents === 'string') {
	    cents = cents.replace('.', '');
	  }
	  let value = '';
	  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
	  const formatString = format || moneyFormat;

	  function formatWithDelimiters(
	    number,
	    precision = 2,
	    thousands = ',',
	    decimal = '.'
	  ) {
	    if (isNaN(number) || number == null) {
	      return 0;
	    }

	    number = (number / 100.0).toFixed(precision);

	    const parts = number.split('.');
	    const dollarsAmount = parts[0].replace(
	      /(\d)(?=(\d\d\d)+(?!\d))/g,
	      `$1${thousands}`
	    );
	    const centsAmount = parts[1] ? decimal + parts[1] : '';

	    return dollarsAmount + centsAmount;
	  }

	  switch (formatString.match(placeholderRegex)[1]) {
	    case 'amount':
	      value = formatWithDelimiters(cents, 2);
	      break;
	    case 'amount_no_decimals':
	      value = formatWithDelimiters(cents, 0);
	      break;
	    case 'amount_with_comma_separator':
	      value = formatWithDelimiters(cents, 2, '.', ',');
	      break;
	    case 'amount_no_decimals_with_comma_separator':
	      value = formatWithDelimiters(cents, 0, '.', ',');
	      break;
	  }

	  return formatString.replace(placeholderRegex, value);
	}

	function getCookie(name) {
		/* eslint-disable */
		let matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
		/* eslint-enable */

		return matches ? decodeURIComponent(matches[1]) : undefined;
	}

	function setCookie(name, value, options = {}) {
		options = {
			path: "/",
			...options
		};

		if (options.expires instanceof Date) {
			options.expires = options.expires.toUTCString();
		}

		let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

		for (let optionKey in options) {
			updatedCookie += "; " + optionKey;
			let optionValue = options[optionKey];
			if (optionValue !== true) {
				updatedCookie += "=" + optionValue;
			}
		}

		document.cookie = updatedCookie;
	}

	function deleteCookie(name) {
		setCookie(name, "", {
			"max-age": -1
		});
	}

	var CartApi = () => {
		const actions = {
			GET_CART: "getCart",
			ADD_TO_CART: "addItem",
			ADD_TO_CART_MANY: "addItems",
			UPDATE_CART: "update",
			CHANGE_CART_ITEM: "changeItem",
			CHANGE_CART_ITEM_QUANTITY: "changeQuantity",
			REMOVE_CART_ITEM: "removeItem",
			CLEAR_CART: "clear"
		};

		const api = {
			/**
			 * Use the GET /{locale}/cart.js endpoint to get the cart as JSON.
			 * @return {Object} - Cart object
			 * */
			[actions.GET_CART]: async function () {
				return await fetch("/cart.js")
					.then((response) => {
						if (response.ok) {
							return response.json();
						}

						return Promise.reject(response);
					})
					.then((response) => ({
						data: response
					}));
			},

			/**
			 * Use the POST /{locale}/cart/add.js endpoint to add one variant to the cart.
			 * @param {Object} item - Item {variant, quantity}
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The response for a successful POST request is a JSON object of the line item associated with the added item.
			 * @throws {Error}
			 * */
			[actions.ADD_TO_CART]: function (item, sections = "") {
				if (!item) {
					throw new Error(`Cart API::ERROR::'${actions.ADD_TO_CART}' - param 'item' is required!`);
				}

				return this[actions.ADD_TO_CART_MANY]([item], sections);
			},

			/**
			 * Use the POST /{locale}/cart/add.js endpoint to add one or multiple variants to the cart.
			 * @param {Array} items - Array of items. eg:
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The response for a successful POST request is a JSON object of the line items associated with the added items.
			 * @throws {Error}
			 * */
			[actions.ADD_TO_CART_MANY]: function (items = [], sections = "") {
				if (!items || !Array.isArray(items)) {
					throw new Error(`Cart API::ERROR::'${actions.ADD_TO_CART_MANY}' - param 'items' must be an array, current value is ${items}!`);
				}

				return fetch("/cart/add.js", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						items: items.map((item) => transformLineItemProps(item)),
						sections: sections
					})
				})
					.then((response) => {
						if (response.ok) {
							return response.json();
						}

						return Promise.reject(response);
					})
					.then((response) => ({
						data: response
					}));
			},

			/**
			 * Use the POST /{locale}/cart/update.js endpoint to update the cart's line item quantities, note, or attributes.
			 * @param {Object} updates - Updates for cart.
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The JSON of the cart.
			 * @throws {Error}
			 * */
			[actions.UPDATE_CART]: function (updates = {}, sections = "") {
				if (!updates) {
					throw new Error(`Cart API::ERROR::'${actions.UPDATE_CART}' - param 'newItem' is required!`);
				}

				return fetch("/cart/update.js", {
					method: "POST",
					headers: {
						Accept: "*/*",
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ ...updates, sections: sections })
				})
					.then((response) => {
						if (response.ok) {
							return response.json();
						}

						return Promise.reject(response);
					})
					.then((response) => ({
						data: response
					}));
			},

			/**
			 * Use the /{locale}/cart/change.js endpoint to change the quantity, properties, and selling_plan properties of a cart line item.
			 * @param {Object} newItem - Updates for line item.
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The JSON of the cart.
			 * @throws {Error}
			 * */
			[actions.CHANGE_CART_ITEM]: function (newItem, sections) {
				if (!newItem) {
					throw new Error(`Cart API::ERROR::'${actions.CHANGE_CART_ITEM}' - param 'newItem' is required!`);
				}

				return fetch("/cart/change.js", {
					method: "POST",
					headers: {
						Accept: "*/*",
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ ...newItem, sections: sections })
				})
					.then((response) => {
						if (response.ok) {
							return response.json();
						}

						return Promise.reject(response);
					})
					.then((response) => ({
						data: response
					}));
			},

			/**
			 * Change cart item quantity
			 * @param {String} key - Line item key
			 * @param {Number} quantity - New line item quantity
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The JSON of the cart.
			 * @throws {Error}
			 * */
			[actions.CHANGE_CART_ITEM_QUANTITY]: function (key, quantity, sections = "") {
				if (!key || !Number.isInteger(quantity)) {
					throw new Error(`Cart API::ERROR::'${actions.CHANGE_CART_ITEM_QUANTITY}' - required param is missing!`);
				}

				return this[actions.CHANGE_CART_ITEM](
					{
						id: key,
						quantity
					},
					sections
				);
			},

			/**
			 * Remove line item from cart
			 * @param {String} key - Line item key
			 * @param {String} sections - Sections ids
			 * @return {Promise} - The JSON of the cart.
			 * @throws {Error}
			 * */
			[actions.REMOVE_CART_ITEM]: function (key, sections = "") {
				if (!key) {
					throw new Error(`Cart API::ERROR::'${actions.REMOVE_CART_ITEM}' - param 'key' is required!`);
				}

				return this[actions.CHANGE_CART_ITEM_QUANTITY](key, 0, sections);
			},

			/**
			 * Use the POST /{locale}/cart/clear.js endpoint to set all quantities of all line items in the cart to zero.
			 * @return {Promise} - The JSON of an empty cart. This does not remove cart attributes or the cart note.
			 * */
			[actions.CLEAR_CART]: function (sections = "") {
				return fetch("/cart/clear.js", {
					method: "POST",
					headers: {
						Accept: "*/*",
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ sections })
				})
					.then((response) => {
						if (response.ok) {
							return response.json();
						}

						return Promise.reject(response);
					})
					.then((response) => ({
						data: response
					}));
			}
		};

		/**
		 * Make request for Cart API
		 * @param {String} action - Action type
		 * @param {Array} params - Params for query
		 * @return {Promise} - Response from api call
		 * @throws {Error} - Invalid action type error
		 * **/
		function makeRequest(action, ...params) {
			if (!Object.keys(api).includes(action)) {
				throw new Error(`Cart API::ERROR::makeQuery - unavailable action type - ${action}`);
			}

			return api[action](...params)
				.then((response) => {
					const data = response.data;

					setTimeout(() => {
						window.themeCore.cartObject = data;

						window.themeCore.EventBus.emit("cart:updated", {
							...data,
							action: action,
							params: [...params]
						});
					}, 0);

					return data;
				})
				.catch(async (error) => {
					await error.json().then((data) => {
						throw data;
					});
				});
		}

		return Object.freeze({
			actions,
			makeRequest
		});
	};

	const VIDEO_TYPES = {
		html: "html",
		youtube: "youtube",
		vimeo: "vimeo"
	};

	function Listeners() {
	  this.entries = [];
	}

	Listeners.prototype.add = function(element, event, fn) {
	  this.entries.push({ element: element, event: event, fn: fn });
	  element.addEventListener(event, fn);
	};

	Listeners.prototype.removeAll = function() {
	  this.entries = this.entries.filter(function(listener) {
	    listener.element.removeEventListener(listener.event, listener.fn);
	    return false;
	  });
	};

	/**
	 * Returns a product JSON object when passed a product URL
	 * @param {*} url
	 */

	/**
	 * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
	 * @param {Object} product Product JSON object
	 * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
	 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
	 */
	function getVariantFromSerializedArray(product, collection) {
	  _validateProductStructure(product);

	  // If value is an array of options
	  var optionArray = _createOptionArrayFromOptionCollection(product, collection);
	  return getVariantFromOptionArray(product, optionArray);
	}

	/**
	 * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
	 * @param {Object} product Product JSON object
	 * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
	 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
	 */
	function getVariantFromOptionArray(product, options) {
	  _validateProductStructure(product);
	  _validateOptionsArray(options);

	  var result = product.variants.filter(function(variant) {
	    return options.every(function(option, index) {
	      return variant.options[index] === option;
	    });
	  });

	  return result[0] || null;
	}

	/**
	 * Creates an array of selected options from the object
	 * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
	 * @param {Object} product Product JSON object
	 * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
	 * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
	 */
	function _createOptionArrayFromOptionCollection(product, collection) {
	  _validateProductStructure(product);
	  _validateSerializedArray(collection);

	  var optionArray = [];

	  collection.forEach(function(option) {
	    for (var i = 0; i < product.options.length; i++) {
	      if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
	        optionArray[i] = option.value;
	        break;
	      }
	    }
	  });

	  return optionArray;
	}

	/**
	 * Check if the product data is a valid JS object
	 * Error will be thrown if type is invalid
	 * @param {object} product Product JSON object
	 */
	function _validateProductStructure(product) {
	  if (typeof product !== 'object') {
	    throw new TypeError(product + ' is not an object.');
	  }

	  if (Object.keys(product).length === 0 && product.constructor === Object) {
	    throw new Error(product + ' is empty.');
	  }
	}

	/**
	 * Validate the structure of the array
	 * It must be formatted like jQuery's serializeArray()
	 * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
	 */
	function _validateSerializedArray(collection) {
	  if (!Array.isArray(collection)) {
	    throw new TypeError(collection + ' is not an array.');
	  }

	  if (collection.length === 0) {
	    return [];
	  }

	  if (collection[0].hasOwnProperty('name')) {
	    if (typeof collection[0].name !== 'string') {
	      throw new TypeError(
	        'Invalid value type passed for name of option ' +
	          collection[0].name +
	          '. Value should be string.'
	      );
	    }
	  } else {
	    throw new Error(collection[0] + 'does not contain name key.');
	  }
	}

	/**
	 * Validate the structure of the array
	 * It must be formatted as list of values
	 * @param {Array} collection Array of object (e.g. ['36', 'Black'])
	 */
	function _validateOptionsArray(options) {
	  if (Array.isArray(options) && typeof options[0] === 'object') {
	    throw new Error(options + 'is not a valid array of options.');
	  }
	}

	var selectors = {
	  idInput: '[name="id"]',
	  optionInput: '[name^="options"]',
	  quantityInput: '[name="quantity"]',
	  propertyInput: '[name^="properties"]'
	};

	// Public Methods
	// -----------------------------------------------------------------------------

	/**
	 * Returns a URL with a variant ID query parameter. Useful for updating window.history
	 * with a new URL based on the currently select product variant.
	 * @param {string} url - The URL you wish to append the variant ID to
	 * @param {number} id  - The variant ID you wish to append to the URL
	 * @returns {string} - The new url which includes the variant ID query parameter
	 */

	function getUrlWithVariant(url, id) {
	  if (/variant=/.test(url)) {
	    return url.replace(/(variant=)[^&]+/, '$1' + id);
	  } else if (/\?/.test(url)) {
	    return url.concat('&variant=').concat(id);
	  }

	  return url.concat('?variant=').concat(id);
	}

	/**
	 * Constructor class that creates a new instance of a product form controller.
	 *
	 * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
	 * @param {Object} product - A product object
	 * @param {Object} options - Optional options object
	 * @param {Function} options.onOptionChange - Callback for whenever an option input changes
	 * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
	 * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
	 * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
	 */
	function ProductForm(element, product, options) {
	  this.element = element;
	  this.product = _validateProductObject(product);

	  options = options || {};

	  this._listeners = new Listeners();
	  this._listeners.add(
	    this.element,
	    'submit',
	    this._onSubmit.bind(this, options)
	  );

	  this.optionInputs = this._initInputs(
	    selectors.optionInput,
	    options.onOptionChange
	  );

	  this.quantityInputs = this._initInputs(
	    selectors.quantityInput,
	    options.onQuantityChange
	  );

	  this.propertyInputs = this._initInputs(
	    selectors.propertyInput,
	    options.onPropertyChange
	  );
	}

	/**
	 * Cleans up all event handlers that were assigned when the Product Form was constructed.
	 * Useful for use when a section needs to be reloaded in the theme editor.
	 */
	ProductForm.prototype.destroy = function() {
	  this._listeners.removeAll();
	};

	/**
	 * Getter method which returns the array of currently selected option values
	 *
	 * @returns {Array} An array of option values
	 */
	ProductForm.prototype.options = function() {
	  return _serializeOptionValues(this.optionInputs, function(item) {
	    var regex = /(?:^(options\[))(.*?)(?:\])/;
	    item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
	    return item;
	  });
	};

	/**
	 * Getter method which returns the currently selected variant, or `null` if variant
	 * doesn't exist.
	 *
	 * @returns {Object|null} Variant object
	 */
	ProductForm.prototype.variant = function() {
	  return getVariantFromSerializedArray(this.product, this.options());
	};

	/**
	 * Getter method which returns a collection of objects containing name and values
	 * of property inputs
	 *
	 * @returns {Array} Collection of objects with name and value keys
	 */
	ProductForm.prototype.properties = function() {
	  var properties = _serializePropertyValues(this.propertyInputs, function(
	    propertyName
	  ) {
	    var regex = /(?:^(properties\[))(.*?)(?:\])/;
	    var name = regex.exec(propertyName)[2]; // Use just the value between 'properties[' and ']'
	    return name;
	  });

	  return Object.entries(properties).length === 0 ? null : properties;
	};

	/**
	 * Getter method which returns the current quantity or 1 if no quantity input is
	 * included in the form
	 *
	 * @returns {Array} Collection of objects with name and value keys
	 */
	ProductForm.prototype.quantity = function() {
	  return this.quantityInputs[0]
	    ? Number.parseInt(this.quantityInputs[0].value, 10)
	    : 1;
	};

	// Private Methods
	// -----------------------------------------------------------------------------
	ProductForm.prototype._setIdInputValue = function(value) {
	  var idInputElement = this.element.querySelector(selectors.idInput);

	  if (!idInputElement) {
	    idInputElement = document.createElement('input');
	    idInputElement.type = 'hidden';
	    idInputElement.name = 'id';
	    this.element.appendChild(idInputElement);
	  }

	  idInputElement.value = value.toString();
	};

	ProductForm.prototype._onSubmit = function(options, event) {
	  event.dataset = this._getProductFormEventData();

	  if (event.dataset.variant) {
	    this._setIdInputValue(event.dataset.variant.id);
	  }

	  if (options.onFormSubmit) {
	    options.onFormSubmit(event);
	  }
	};

	ProductForm.prototype._onFormEvent = function(cb) {
	  if (typeof cb === 'undefined') {
	    return Function.prototype;
	  }

	  return function(event) {
	    event.dataset = this._getProductFormEventData();
	    cb(event);
	  }.bind(this);
	};

	ProductForm.prototype._initInputs = function(selector, cb) {
	  var elements = Array.prototype.slice.call(
	    this.element.querySelectorAll(selector)
	  );

	  return elements.map(
	    function(element) {
	      this._listeners.add(element, 'change', this._onFormEvent(cb));
	      return element;
	    }.bind(this)
	  );
	};

	ProductForm.prototype._getProductFormEventData = function() {
	  return {
	    options: this.options(),
	    variant: this.variant(),
	    properties: this.properties(),
	    quantity: this.quantity()
	  };
	};

	function _serializeOptionValues(inputs, transform) {
	  return inputs.reduce(function(options, input) {
	    if (
	      input.checked || // If input is a checked (means type radio or checkbox)
	      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
	    ) {
	      options.push(transform({ name: input.name, value: input.value }));
	    }

	    return options;
	  }, []);
	}

	function _serializePropertyValues(inputs, transform) {
	  return inputs.reduce(function(properties, input) {
	    if (
	      input.checked || // If input is a checked (means type radio or checkbox)
	      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
	    ) {
	      properties[transform(input.name)] = input.value;
	    }

	    return properties;
	  }, {});
	}

	function _validateProductObject(product) {
	  if (typeof product !== 'object') {
	    throw new TypeError(product + ' is not an object.');
	  }

	  if (typeof product.variants[0].options === 'undefined') {
	    throw new TypeError(
	      'Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route'
	    );
	  }

	  return product;
	}

	var register = (component, type) => {
		if (!component || !type) {
			return;
		}

		const setup = (event) => {
			if (window.themeCore.sections[type]) {
				return;
			}

			const detail = event && event.detail;
			const sectionId = detail && detail.sectionId;
			const eventType = detail && detail.type;

			const addDetail = eventType === type && sectionId;

			const componentDetail = addDetail ? sectionId : undefined;

			component.init(componentDetail);
			window.themeCore.EventBus.emit(`${type}:loaded`);
			window.themeCore.sections[type] = true;
		};

		setup();

		document.addEventListener("theme:customizer:loaded", setup);
	};

	var registerExternalUtil = (component, type) => {
		if (!component || !type) {
			return;
		}

		const setup = () => {
			if (window.themeCore.externalUtils[type]) {
				return;
			}

			window.themeCore.utils[type] = component;
			window.themeCore.externalUtils[type] = true;
			window.themeCore.EventBus.emit(`${type}:loaded`);
		};

		setup();

		document.addEventListener("shopify:section:load", setup);
	};

	var getExternalUtil = (type) => {
		return new Promise((resolve) => {
			if (window.themeCore.utils[type]) {
				resolve(window.themeCore.utils[type]);
				return;
			}

			window.themeCore.EventBus.listen(`${type}:loaded`, () => {
				window.themeCore.utils[type] && resolve(window.themeCore.utils[type]);
			});
		});
	};

	var BackToTop = () => {
		const selectors = {
			button: ".js-back-to-top-button"
		};

		function init() {
			document.addEventListener("click", (event) => {
				const target = event && event.target;

				if (!target) {
					return;
				}

				const button = target.closest(selectors.button);

				if (!button) {
					return;
				}

				scrollToTop();
			});
		}

		function scrollToTop() {
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});

			setTimeout(() => {
				document.body.setAttribute("tabindex", "-1");
				document.body.focus();
			}, 1000);
		}

		return Object.freeze({
			init
		});
	};

	var AddToCart = () => {
		let initiatedState = false;

		const selectors = {
			addToCart: ".js-add-to-cart"
		};

		function init() {
			if (initiatedState) {
				return;
			}

			document.addEventListener("click", async (event) => {
				const target = event.target;

				if (!target) {
					return;
				}

				const button = target.closest(selectors.addToCart);

				if (!button) {
					return;
				}

				const productHandle = button.getAttribute("data-product-handle");
				const productVariant = button.getAttribute("data-variant-id");
				const productQuantity = button.getAttribute("data-min-quantity");

				if (productVariant) {
					try {
						const params = {
							id: productVariant,
							quantity: Number(productQuantity)
						};

						if (button && button.hasAttribute("data-preorder")) {
							params.properties = params.properties || {};
							params.properties["_Pre-order"] = "true";
						}

						await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, params);
						await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART);
					} catch (error) {
						const CartNotificationError = window.themeCore.CartNotificationError;

						CartNotificationError.addNotification(error.description);
						CartNotificationError.open();
					}
				} else {
					window.themeCore.EventBus.emit("product-card:quick-view:clicked", {
						productHandle: productHandle,
						variant: productVariant
					});
				}
			});

			initiatedState = true;
		}

		return Object.freeze({
			init
		});
	};

	const DOMContentLoadedPromise = new Promise((resolve) => {
		document.addEventListener("DOMContentLoaded", async () => {
			/**
			 * Global themeCore utils.
			 */
			window.theme = window.theme || {};
			window.themeCore = window.themeCore || {};
			window.themeCore.libs = window.themeCore.libs || {};
			window.themeCore.utils = window.themeCore.utils || {};

			window.themeCore.sections = {};
			window.themeCore.externalUtils = {};

			window.themeCore.translations = translations;

			window.themeCore.utils.bodyScrollLock = bodyScrollLock;
			Swiper.use([A11y, Pagination, Navigation, Thumb, Zoom]);
			window.themeCore.utils.Swiper = Swiper;
			window.themeCore.utils.swiperA11y = A11y;
			window.themeCore.utils.swiperPagination = Pagination;
			window.themeCore.utils.swiperZoom = Zoom;
			window.themeCore.utils.ProductForm = ProductForm;
			window.themeCore.utils.getUrlWithVariant = getUrlWithVariant;

			window.themeCore.utils.overlay = overlay;
			window.themeCore.utils.images = images$1();
			window.themeCore.utils.cssClasses = cssClasses;
			window.themeCore.utils.extendDefaults = extendDefaults;
			window.themeCore.utils.on = on$1;
			window.themeCore.utils.off = off$1;
			window.themeCore.utils.isElementInViewport = isElementInViewport;
			window.themeCore.utils.formToJSON = formToJSON;
			window.themeCore.utils.arrayIncludes = arrayIncludes;
			window.themeCore.utils.convertFormData = convertFormData;
			window.themeCore.utils.throttle = throttle;
			window.themeCore.utils.debounce = debounce;
			window.themeCore.utils.icons = icons;
			window.themeCore.utils.isElement = isElement;
			window.themeCore.utils.focusable = focusable;
			window.themeCore.utils.updateTabindexOnElement = updateTabindexOnElement;
			window.themeCore.utils.removeTrapFocus = removeTrapFocus;
			window.themeCore.utils.handleTabulationOnSlides = handleTabulationOnSlides;
			window.themeCore.utils.parseJSONfromMarkup = parseJSONfromMarkup;
			window.themeCore.utils.trapFocus = trapFocus;
			window.themeCore.utils.bind = bind;
			window.themeCore.utils.formatMoney = formatMoney;
			window.themeCore.utils.setCookie = setCookie;
			window.themeCore.utils.getCookie = getCookie;
			window.themeCore.utils.deleteCookie = deleteCookie;
			window.themeCore.utils.VIDEO_TYPES = VIDEO_TYPES;
			window.themeCore.utils.register = register;
			window.themeCore.utils.registerExternalUtil = registerExternalUtil;
			window.themeCore.utils.getExternalUtil = getExternalUtil;
			window.themeCore.utils.QuantityWidget = QuantityWidget;
			window.themeCore.utils.UpsellSlider = UpsellSlider;
			window.themeCore.utils.Preloder = Preloder;
			window.themeCore.utils.Toggle = Toggle;
			window.themeCore.utils.Timer = Timer;

			window.themeCore.ProductCountDownTimer = window.themeCore.ProductCountDownTimer || ProductCountDownTimer();
			window.themeCore.EventBus = window.themeCore.EventBus || EventBus();
			window.themeCore.Accordion = window.themeCore.Accordion || Accordion();
			window.themeCore.Popover = window.themeCore.Popover || Popover();
			window.themeCore.BackToTop = window.themeCore.BackToTop || BackToTop();
			window.themeCore.Tabs = window.themeCore.Tabs || Tabs();
			window.themeCore.ProductCard = window.themeCore.ProductCard || ProductCard();
			window.themeCore.QuickView = window.themeCore.QuickView || QuickView();
			window.themeCore.LazyLoadImages = window.themeCore.LazyLoadImages || LazyLoadImages();
			window.themeCore.ScrollDirection = window.themeCore.ScrollDirection || ScrollDirection();
			window.themeCore.LocalizationForm = window.themeCore.LocalizationForm || localizationForm;
			window.themeCore.CartApi = window.themeCore.CartApi || CartApi();
			window.themeCore.Challenge = window.themeCore.Challenge || Challenge();
			window.themeCore.AddToCart = window.themeCore.AddToCart || AddToCart();
			window.themeCore.ShareButton = window.themeCore.ShareButton || ShareButton();

			/**
			 * Global components init
			 */
			window.themeCore.Challenge.init();
			window.themeCore.ProductCard.init();
			window.themeCore.QuickView.init();
			window.themeCore.Tabs.init();
			window.themeCore.LazyLoadImages.init();
			window.themeCore.Accordion.init();
			window.themeCore.Popover.init();
			window.themeCore.ScrollDirection.init();
			window.themeCore.LocalizationForm.init;
			window.themeCore.AddToCart.init();
			window.themeCore.ProductCountDownTimer.init();
			window.themeCore.ShareButton.init();
			window.themeCore.BackToTop.init();

			resolve();
		});
	});

	(async () => {
		const selectors = {
			script: "script[src]",
			appBlock: ".shopify-app-block",
			section: (id) => `#shopify-section-${id}`,
			shopifySection: ".shopify-section"
		};

		const attributes = {
			sectionData: "data-shopify-editor-section"
		};

		/* Sections to rerender by type.
		In most cases these sections can't exist more than once on page: e.g: age popup, blog template, etc.
		These sections need a lot of work to render by id and it has no sense.
	 */
		const sectionsToRerenderByType = [
			"age-check-popup",
			"announcement-bar",
			"cookie-bar",
			"header",
			"image-compare",
			"newsletter-popup",
			"product-template",
			"product-promo",
			"promotion-banner",
			"addresses-template",
			"login-template",
			"blog-template",
			"cart-template",
			"collection-template",
			"our-team",
			"password",
			"search-template"
		];

		try {
			if (window.location.pathname !== "/password") {
				await Promise.all([translations.load(), DOMContentLoadedPromise]);
			} else {
				await Promise.resolve(DOMContentLoadedPromise);
			}

			const getLoadedScripts = () => {
				return [...document.querySelectorAll(selectors.script)].map((script) => script.getAttribute("src"));
			};

			let loadedScripts = getLoadedScripts();

			const getNewLoadedScripts = () => {
				return getLoadedScripts().filter((script) => !loadedScripts.includes(script));
			};

			const addScripts = (scripts) => {
				scripts.forEach((script) => {
					const element = document.createElement("script");
					element.setAttribute("src", script);
					document.body.append(element);
				});

				loadedScripts = [...loadedScripts, ...scripts];
			};

			const rewriteElementsExcept = (parent, exceptSelector) => {
				const hasAppBlock = `:has(${exceptSelector})`;
				const appBlockOrParent = `${hasAppBlock}, ${exceptSelector}`;

				Array.from(parent.children).forEach((element) => {
					if (!element.matches(appBlockOrParent)) {
						const newElement = element.cloneNode(true);
						element.parentNode.replaceChild(newElement, element);
					}
				});

				const elementsWithAppBlocks = Array.from(parent.children).filter((element) => element.matches(hasAppBlock));
				elementsWithAppBlocks.forEach((element) => rewriteElementsExcept(element, exceptSelector));
			};

			const removePageBlur = (type) => {
				const blurTargets = {
					"age-check-popup": ["AgeCheckPopupToggle"],
					"newsletter-popup": ["NewsletterPopupToggle"],
					"cart-drawer": ["CartDrawer"],
					header: ["headerToggleMenuDrawer"],
					"pickup-availability": ["productAvailability-"],
					"promotion-banner": ["promotion-products-popup-toggle"],
					"password-header": ["password-popup"],
					"predictive-search": ["searchToggleDrawer"],
					"product-template": ["product-ask-question-popup-", "ProductNotifyMePopup", "productSizeGuideDrawer"],
					"featured-product": ["product-ask-question-popup-", "ProductNotifyMePopup", "productSizeGuideDrawer"],
					"collection-template": ["filterMenuDrawer", "filterMenuToggler"],
					"search-template": ["filterMenuDrawer", "filterMenuToggler"]
				};
				const createSelector = (array) => array.map((item) => `[data-js-overlay^="${item}"]`).join(", ");

				const overlays = blurTargets[type];

				if (overlays) {
					const popupOverlays = [...document.querySelectorAll(createSelector(overlays))];

					if (!popupOverlays.length) {
						return;
					}

					document.body.classList.remove("blur-content");
					document.body.style.overflow = "";

					popupOverlays.forEach((overlay) => overlay.remove());
				}
			};

			const getSectionData = (element) => {
				try {
					return JSON.parse(element.getAttribute(attributes.sectionData));
				} catch (error) {
					console.log("Error trying to parse section data: ", error, " element: ", element);
					return null;
				}
			};

			const getSectionTypeFromId = (sectionId) => {
				const section = document.querySelector(selectors.section(sectionId));

				if (!section) {
					return null;
				}

				const sectionData = getSectionData(section);

				if (!sectionData) {
					return null;
				}

				return sectionData.type || null;
			};

			const rewriteSections = ({ method, type, sectionId }) => {
				// Don't need this in preview
				if (window.Shopify.visualPreviewMode) {
					return;
				}

				const selector = method === "type" ? selectors.shopifySection : selectors.section(sectionId);

				const sections = [...document.querySelectorAll(selector)];
				const appropriateSections =
					method === "type"
						? sections.filter((section) => {
								try {
									const sectionData = JSON.parse(section.getAttribute(attributes.sectionData));

									return sectionData.type === type;
								} catch {
									return false;
								}
						  })
						: sections;

				appropriateSections.forEach((section) => rewriteElementsExcept(section, selectors.appBlock));
			};

			const reinitGlobalComponents = () => {
				window.themeCore.LazyLoadImages.init();
				window.themeCore.initAnimateObserver();
				window.themeCore.Accordion.init();
				window.themeCore.EventBus.emit(`product:count-down-timer-reinit`);
			};

			const customizerChangesHandler = (e) => {
				addScripts(getNewLoadedScripts());

				const sectionId = e.detail && e.detail.sectionId;

				if (!sectionId) {
					return;
				}

				const type = getSectionTypeFromId(sectionId);

				if (!type) {
					return;
				}

				removePageBlur(type);

				let eventOptions = {};

				if (sectionsToRerenderByType.includes(type)) {
					rewriteSections({ method: "type", type });
					rewriteSections({ method: "type", type: `${type}-new` });
				} else {
					rewriteSections({ method: "id", sectionId });
					eventOptions = { detail: { sectionId, type } };
				}

				delete window.themeCore.sections[type];
				delete window.themeCore.sections[`${type}-new`];

				reinitGlobalComponents();
				document.dispatchEvent(new CustomEvent("theme:customizer:loaded", eventOptions));
			};

			// Fired when new section added and existing section changes
			document.addEventListener("shopify:section:load", customizerChangesHandler);

			// Fired only when existing section changes
			document.addEventListener("shopify:section:unload", (e) => {
				addScripts(getNewLoadedScripts());

				const sectionId = e.detail && e.detail.sectionId;

				if (!sectionId) {
					return;
				}

				const type = getSectionTypeFromId(sectionId);

				if (!type) {
					return;
				}

				removePageBlur(sectionId);
			});

			document.dispatchEvent(new CustomEvent("theme:all:loaded"));
			window.themeCore.loaded = true;

			let resizeTimer;

			window.addEventListener(
				"resize",
				function () {
					document.body.classList.add("no-transition");
					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(() => {
						document.body.classList.remove("no-transition");
					}, 300);
				},
				{
					passive: true
				}
			);
		} catch (error) {
			console.error(error);
		}
	})();

})();
