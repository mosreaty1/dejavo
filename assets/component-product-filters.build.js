(function () {
	'use strict';

	var ProductFilters = (section) => {
		const cssClasses = window.themeCore.utils.cssClasses;
		const Toggle = window.themeCore.utils.Toggle;
		const overlay = window.themeCore.utils.overlay;
		const debounce = window.themeCore.utils.debounce;

		const CHANGEABLE_ELEMENTS_SELECTORS = {
			form: ".js-form",
			emptyTitle: ".js-template-empty-title",
			searchResultCounter: ".js-search-result-counter",
			gridWrapper: ".js-grid-wrapper",
			filterMenuOpenerWrapper: ".js-filter-menu-opener-wrapper",
			filterMenuOpener: ".js-filter-menu-opener",
			activeFiltersCounter: ".js-active-filters-counter",
			selectedFiltersWrapper: ".js-selected-filters-wrapper",
			filtersContainer: ".js-filters-container",
			filterAccordionItem: ".js-accordion-filter-item",
			filterLists: ".js-filter-list",
			filterPrice: ".js-filter-price",
			pagination: ".js-pagination",
			loadMoreButton: ".js-lazy-load",
			infiniteScroll: ".js-infinite-scroll",
			filterMenuTitle: ".js-filter-menu-title"
		};

		const FILTER_PRICE_SELECTORS = {
			maxInput: ".js-price-input-max",
			minInput: ".js-price-input-min",
			rangeInputs: ".js-range-inputs",
			minRange: ".js-price-range-min",
			maxRange: ".js-price-range-max",
			priceProgress: ".js-price-progress"
		};

		const selectors = {
			collectionHeader: ".js-collection-header",
			filterMenuToggler: "filterMenuToggler",
			paginationLink: ".js-pagination-link",
			priceNumberInput: ".js-price-input",
			priceRangeInput: ".js-price-range",
			removeFilterLink: ".js-remove-filter",
			resetFilters: ".js-reset-filters",
			cssRoot: ":root",
			header: "[data-header-container]",
			pageLoader: ".js-page-preloader",
			...CHANGEABLE_ELEMENTS_SELECTORS,
			...FILTER_PRICE_SELECTORS
		};

		const classes = {
			fixed: "is-fixed",
			noEvents: "no-events",
			error: "is-error",
			withMargin: "with-margin",
			...cssClasses
		};

		const FILTER_FORM_KEYS = {
			priceFrom: "filter.v.price.gte",
			priceTo: "filter.v.price.lte"
		};

		const URL_KEYS_TO_SAVE = {
			query: "q",
			type: "type",
			optionsPrefix: "options[prefix]"
		};

		const URL_KEYS = {
			page: "page",
			sort: "sort_by",
			...URL_KEYS_TO_SAVE
		};

		const cssVariables = {
			rangeMin: "--range-min",
			rangeMax: "--range-max",
			headerHeight: "--header-height",
			headerOffsetTop: "--header-offset-top"
		};

		const breakpoints = {
			extraSmall: "(max-width: 767px)"
		};

		const globals = {
			extraSmallScreen: window.matchMedia(breakpoints.extraSmall),
			openMenuButtonObserver: null,
			infiniteScrollObserver: null,
			cssRoot: document.querySelector(selectors.cssRoot)
		};

		const drawer = Toggle({
			toggleSelector: selectors.filterMenuToggler,
			closeAccordionsOnHide: false,
			toggleTabIndex: false
		});

		const currentNodes = getNodes(section, CHANGEABLE_ELEMENTS_SELECTORS);

		const pageLoader = document.querySelector(selectors.pageLoader);

		let currentBaseUrl = window.location.href.split("#")[0];

		function getNodes(container, selectors) {
			const nodes = {};

			Object.entries(selectors).forEach(([elementName, selector]) => {
				const elements = [...container.querySelectorAll(selector)];

				if (!elements.length) {
					nodes[elementName] = null;
					return;
				}

				if (elements.length > 1) {
					nodes[elementName] = elements;
					return;
				}

				nodes[elementName] = elements[0];
			});

			return nodes;
		}

		function extraSmallScreenHandler(media) {
			if (media.matches) {
				globals.openMenuButtonObserver.unobserve(currentNodes.filterMenuOpenerWrapper);
				unFixMenuOpener();
				return;
			}

			setMenuButtonObserver();
		}

		function setMenuButtonObserver() {
			if (!globals.extraSmallScreen.matches) {
				const headerHeight = getHeaderHeightWithOffsetTop();
				const intersectionOptions = {
					rootMargin: `-${headerHeight}px 0px 0px 0px`
				};

				globals.openMenuButtonObserver = initIntersectionObserver(currentNodes.filterMenuOpenerWrapper, unFixMenuOpener, fixMenuOpener, intersectionOptions);
			}
		}

		function getHeaderHeightWithOffsetTop() {
			const headerHeight = globals.cssRoot.style.getPropertyValue(cssVariables.headerHeight);
			const headerOffsetTop = globals.cssRoot.style.getPropertyValue(cssVariables.headerOffsetTop);

			return parseInt(headerHeight) + parseInt(headerOffsetTop);
		}

		function setInfiniteScrollObserver() {
			globals.infiniteScrollObserver = initIntersectionObserver(currentNodes.infiniteScroll, () =>
				unobserveAndUpdateTemplate(globals.infiniteScrollObserver, currentNodes.infiniteScroll)
			);
		}

		function initIntersectionObserver(observerNode, intersectCallback, noIntersectCallback, options = {}) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						typeof intersectCallback === "function" && intersectCallback();
					} else {
						typeof noIntersectCallback === "function" && noIntersectCallback();
					}
				});
			}, options);

			observer.observe(observerNode);

			return observer;
		}

		function unFixMenuOpener() {
			if (!currentNodes.filterMenuOpener) {
				return;
			}

			currentNodes.filterMenuOpener.classList.remove(classes.fixed);
			currentNodes.filterMenuTitle.classList.remove(classes.withMargin);
		}

		function fixMenuOpener() {
			if (!currentNodes.filterMenuOpener || isViewPortAboveElement(currentNodes.filterMenuOpenerWrapper)) {
				return;
			}

			currentNodes.filterMenuOpener.classList.add(classes.fixed);
			currentNodes.filterMenuTitle.classList.add(classes.withMargin);
		}

		function isViewPortAboveElement(opener) {
			const headerHeight = getHeaderHeightWithOffsetTop();
			const bounding = opener.getBoundingClientRect();
			return headerHeight && bounding.bottom >= headerHeight;
		}

		async function formChangeHandler(event) {
			const form = event.target.closest(selectors.form);

			if (!form || isPriceInputsWithErrors()) {
				return;
			}

			const formData = new FormData(form);
			const formKeys = [...formData.keys()];

			const { minInput, maxInput } = getNodes(section, FILTER_PRICE_SELECTORS);

			formKeys.forEach((key) => {
				if (key === FILTER_FORM_KEYS.priceFrom || key === FILTER_FORM_KEYS.priceTo) {
					if (
						(key === FILTER_FORM_KEYS.priceFrom && Number(minInput.value) === Number(minInput.min)) ||
						(key === FILTER_FORM_KEYS.priceTo && Number(maxInput.value) === Number(maxInput.max))
					) {
						formData.delete(key);
					}
				}
			});

			const url = createFetchingURL(formData);
			form.classList.add(classes.loading);
			await rerenderTemplate(url);
			window.parent === window.top && window.history.pushState({}, null, url);
			form.classList.remove(classes.loading);

			window.themeCore.Accordion.setTabIndex(".product-filters__form-accordion", "hidden");
		}

		function createFetchingURL(formData) {
			const queryString = new URLSearchParams(formData).toString();
			const initialUrl = new URL(window.location.href);
			const url = new URL(`${window.location.origin}${window.location.pathname}?${queryString}`);

			for (const key in URL_KEYS_TO_SAVE) {
				const value = initialUrl.searchParams.get(URL_KEYS_TO_SAVE[key]);
				value && url.searchParams.set(URL_KEYS_TO_SAVE[key], value);
			}

			return url;
		}

		function isPriceInputsWithErrors() {
			if (!currentNodes.filterPrice) {
				return false;
			}

			const priceNumberInputs = [...currentNodes.filterPrice.querySelectorAll(selectors.priceNumberInput)];

			return priceNumberInputs.some((input) => input.classList.contains(classes.error));
		}

		async function rerenderTemplate(url) {
			currentNodes.gridWrapper.ariaBusy = "true";
			const requestURL = getSectionIdRequestURL(url, section.id);
			const newHTML = await getHTML(requestURL);
			const newNodes = getNodes(newHTML, CHANGEABLE_ELEMENTS_SELECTORS);
			setHTML(newNodes);

			window.themeCore.LazyLoadImages.init();
			currentNodes.gridWrapper.ariaBusy = "false";
			window.themeCore.EventBus.emit("compare-products:init");
			currentBaseUrl = window.location.href.split("#")[0];
		}

		function getSectionIdRequestURL(url, sectionId = section.id) {
			const requestURL = new URL(url);
			requestURL.searchParams.set("section_id", sectionId);
			return requestURL.toString();
		}

		async function getHTML(url) {
			const response = await fetch(url);
			const resText = await response.text();
			return new DOMParser().parseFromString(resText, "text/html");
		}

		function setHTML(newNodes) {
			if (!newNodes || !Object.keys(newNodes).length) {
				return;
			}

			const {
				selectedFiltersWrapper,
				gridWrapper,
				filterMenuOpener,
				activeFiltersCounter,
				filterAccordionItem,
				filterPrice,
				pagination,
				loadMoreButton,
				infiniteScroll,
				searchResultCounter
			} = newNodes;

			currentNodes.gridWrapper.innerHTML = gridWrapper.innerHTML;

			if (gridWrapper.innerHTML) {
				currentNodes.emptyTitle.classList.add(classes.hidden);
				currentNodes.emptyTitle.ariaHidden = "true";
			} else {
				currentNodes.emptyTitle.classList.remove(classes.hidden);
				currentNodes.emptyTitle.ariaHidden = "false";
			}

			// Remove facets that are no longer returned from the server
			if (currentNodes.filtersContainer) {
				const filterItemsInDOM = currentNodes.filtersContainer.querySelectorAll(selectors.filterAccordionItem);

				Array.from(filterItemsInDOM).forEach((currentElement) => {
					if (filterAccordionItem && Array.from(filterAccordionItem).length === 0) {
						if (currentElement.id !== filterAccordionItem.id) {
							currentElement.remove();
						}
					} else {
						if (!Array.from(filterAccordionItem).some(({ id }) => currentElement.id === id)) {
							currentElement.remove();
						}
					}
				});
			}

			if (filterAccordionItem && filterAccordionItem.length) {
				filterAccordionItem.forEach((filterItem, index) => {
					const currentElementOnPage = document.getElementById(filterItem.id);

					if (currentElementOnPage) {
						const currentFilterList = currentElementOnPage.querySelector(selectors.filterLists);
						const newFilterList = filterItem.querySelector(selectors.filterLists);

						if (!currentFilterList || !newFilterList) {
							return;
						}

						currentFilterList.innerHTML = newFilterList.innerHTML;
					} else {
						if (index > 0) {
							const previousElement = filterAccordionItem[index - 1];
							const previousElementId = previousElement.id;
							document.getElementById(previousElementId).after(filterItem);

							return;
						}

						if (filterItem.parentElement) {
							const firstFilterItem = currentNodes.filtersContainer.querySelector(selectors.filterAccordionItem);

							firstFilterItem.before(filterItem);
						}
					}
				});
			}

			window.themeCore.Accordion.init(".product-filters__form-accordion");

			currentNodes.filterMenuOpener.dataset.count = filterMenuOpener ? filterMenuOpener.dataset.count : 0;

			replaceNodes({
				activeFiltersCounter,
				filterPrice,
				pagination,
				selectedFiltersWrapper,
				infiniteScroll,
				loadMoreButton,
				searchResultCounter
			});
			infiniteScroll && setInfiniteScrollObserver();
			filterPrice && drawPriceRange();
		}

		function drawPriceRange() {
			const { minInput, maxInput, rangeInputs } = getNodes(section, FILTER_PRICE_SELECTORS);

			const { thumbOffset } = rangeInputs.dataset;
			const rangeMinStyle = `calc(${(Number(minInput.value) / Number(minInput.max)) * 100}% - ${thumbOffset}px)`;
			const rangeMaxStyle = `calc(${(Number(maxInput.value) / Number(maxInput.max)) * 100}% + ${thumbOffset}px)`;

			rangeInputs.style.setProperty(cssVariables.rangeMin, rangeMinStyle);
			rangeInputs.style.setProperty(cssVariables.rangeMax, rangeMaxStyle);
		}

		function replaceNodes(newNodes) {
			if (!newNodes || !Object.keys(newNodes).length) {
				return;
			}

			for (const newNodeName in newNodes) {
				if (currentNodes[newNodeName]) {
					currentNodes[newNodeName].replaceWith(newNodes[newNodeName]);
					currentNodes[newNodeName] = newNodes[newNodeName];
				}
			}
		}

		async function paginationClickHandler(event) {
			const paginationLink = event.target.closest(selectors.paginationLink);

			if (!paginationLink) {
				return;
			}

			event.preventDefault();
			pageLoader.classList.add(classes.active);
			paginationLink.classList.add(classes.noEvents);
			unFixMenuOpener();

			let scrollPos = calcScrollTopPos();

			window.scrollTo(0, scrollPos);
			window.parent === window.top && window.history.pushState({}, null, paginationLink.href);
			await rerenderTemplate(paginationLink.href);
			pageLoader.classList.remove(classes.active);
		}

		async function popStateHandler() {
			const newBaseUrl = window.location.href.split("#")[0];

			if (newBaseUrl === currentBaseUrl) {
				return;
			}

			currentBaseUrl = newBaseUrl;
			overlay({ namespace: "filters-template" }).open();
			await rerenderTemplate(window.location.href);
			overlay({ namespace: "filters-template" }).close();
		}

		function calcScrollTopPos() {
			const isHeaderSticky = document.querySelector(selectors.header).hasAttribute("data-header-sticky");
			const headerHeight = isHeaderSticky ? getHeaderHeightWithOffsetTop() : 0;
			const elToScroll = document.querySelector(selectors.collectionHeader);

			if (!elToScroll) {
				return 0;
			}

			const collectionSectionPos = window.pageYOffset + elToScroll.getBoundingClientRect().top;
			const scrollOffset = headerHeight + 10;

			return collectionSectionPos - scrollOffset;
		}

		function priceInputHandler(event) {
			const currentInput = event.target.closest(selectors.priceNumberInput);

			if (!currentInput) {
				return;
			}

			const { minInput, maxInput, minRange, maxRange } = getNodes(section, FILTER_PRICE_SELECTORS);

			const isInputsValuesValid = maxInput.value && minInput.value && Number(maxInput.value) <= Number(maxInput.max) && Number(minInput.value) >= Number(minInput.min);

			if (Number(maxInput.value) - Number(minInput.value) >= 0 && isInputsValuesValid) {
				currentInput.dataset.type === "min" ? (minRange.value = minInput.value) : (maxRange.value = maxInput.value);
				drawPriceRange();
				removePriceErrorState(minInput, maxInput);
				return;
			}

			currentInput.dataset.type === "min" ? minInput.classList.add(classes.error) : maxInput.classList.add(classes.error);
		}

		function priceRangeInputHandler(event) {
			const currentRange = event.target.closest(selectors.priceRangeInput);

			if (!currentRange) {
				return;
			}

			const { minInput, maxInput, minRange, maxRange } = getNodes(section, FILTER_PRICE_SELECTORS);

			if (maxRange.value - minRange.value < 0) {
				currentRange.dataset.type === "min" ? (minRange.value = minInput.value) : (maxRange.value = maxInput.value);
			}

			minInput.value = minRange.value;
			maxInput.value = maxRange.value;
			removePriceErrorState(minInput, maxInput);
			drawPriceRange();
		}

		function removePriceErrorState(...inputs) {
			inputs.forEach((input) => input.classList.remove(classes.error));
		}

		async function removeFilterClickHandler(event) {
			const removeFilterLink = event.target.closest(selectors.removeFilterLink);

			if (!removeFilterLink) {
				return;
			}

			event.preventDefault();
			currentNodes.form.classList.add(classes.loading);
			await rerenderTemplate(removeFilterLink.href);
			window.parent === window.top && window.history.pushState({}, null, removeFilterLink.href);
			currentNodes.form.classList.remove(classes.loading);

			window.themeCore.Accordion.setTabIndex(".product-filters__form-accordion", "hidden");
		}

		async function resetFiltersClickHandler(event) {
			const resetFilters = event.target.closest(selectors.resetFilters);

			if (!resetFilters) {
				return;
			}

			const url = new URL(window.location.href);
			const urlKeys = [...url.searchParams.keys()];

			urlKeys.filter((key) => key !== URL_KEYS.sort && key !== URL_KEYS.query).forEach((key) => url.searchParams.delete(key));

			currentNodes.form.classList.add(classes.loading);
			await rerenderTemplate(url);
			window.parent === window.top && window.history.pushState({}, null, url);
			currentNodes.form.classList.remove(classes.loading);

			window.themeCore.Accordion.setTabIndex(".product-filters__form-accordion", "hidden");
		}

		async function unobserveAndUpdateTemplate(observer, infiniteScroll) {
			observer.unobserve(infiniteScroll);
			const link = window.location.origin + infiniteScroll.dataset.nextUrl;
			pageLoader.classList.add(classes.active);
			await updateTemplate(link);
			pageLoader.classList.remove(classes.active);
		}

		async function updateTemplate(url) {
			const requestURL = getSectionIdRequestURL(url, section.id);
			const newHTML = await getHTML(requestURL);
			const { gridWrapper, infiniteScroll, loadMoreButton } = getNodes(newHTML, CHANGEABLE_ELEMENTS_SELECTORS);
			currentNodes.gridWrapper.insertAdjacentHTML("beforeend", gridWrapper.innerHTML);
			replaceNodes({ infiniteScroll, loadMoreButton });
			infiniteScroll && setInfiniteScrollObserver();
			window.themeCore.LazyLoadImages.init();
			window.themeCore.EventBus.emit("compare-products:init");
		}

		async function loadMoreClickHandler(event) {
			const loadMoreButton = event.target.closest(selectors.loadMoreButton);

			if (!loadMoreButton) {
				return;
			}

			pageLoader.classList.add(classes.active);
			loadMoreButton.classList.add(classes.noEvents);
			const nextUrl = window.location.origin + loadMoreButton.dataset.nextUrl;
			await updateTemplate(nextUrl);
			pageLoader.classList.remove(classes.active);
		}

		function setListeners(nodes) {
			const { filterMenuOpenerWrapper, loadMoreButton, infiniteScroll, filterLists, filterPrice, pagination, form } = nodes;

			if (filterMenuOpenerWrapper) {
				globals.extraSmallScreen.addEventListener("change", extraSmallScreenHandler);
				drawer.init();
				setMenuButtonObserver();
				window.addEventListener("resize", debounce(setMenuButtonObserver, 100, false));
			}

			if (filterLists || filterPrice) {
				section.addEventListener("click", removeFilterClickHandler);
			}

			if (filterPrice) {
				drawPriceRange();
				section.addEventListener("input", priceInputHandler);
				section.addEventListener("input", priceRangeInputHandler);
			}

			if (pagination || form) {
				window.addEventListener("popstate", popStateHandler);
			}

			form && section.addEventListener("change", formChangeHandler);
			filterLists && section.addEventListener("click", resetFiltersClickHandler);
			pagination && section.addEventListener("click", paginationClickHandler);
			loadMoreButton && section.addEventListener("click", loadMoreClickHandler);
			infiniteScroll && setInfiniteScrollObserver();
		}

		function init() {
			if (!section || !Object.keys(currentNodes).length) {
				return;
			}

			setListeners(currentNodes);
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.utils.registerExternalUtil(ProductFilters, "ProductFilters");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
