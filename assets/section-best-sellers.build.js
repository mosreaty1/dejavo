(function () {
	'use strict';

	const selectors = {
		section: ".js-best-sellers",
		collection: ".js-best-sellers-collection",
		product: ".js-best-sellers-product"
	};

	/**
	 * Initializes the bestsellers section.
	 * @module BestSellers
	 */
	var BestSellers = () => {
		const cssClasses = window.themeCore.utils.cssClasses;
		let sections = [];

		/**
		 * Initializes the sections and sets event listeners.
		 */
		function init(sectionId) {
			sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));

			sections.forEach((section) => {
				setMinHeight(section);
				setEventListeners(section);
			});
		}

		/**
		 * Sets event listeners for collections and resize event.
		 * @param {HTMLElement} section - The section element containing products and collections.
		 */
		function setEventListeners(section) {
			let collections = [...section.querySelectorAll(selectors.collection)];
			collections.forEach((collection) => collection.addEventListener("mouseenter", () => showTargetItem(section, collection)));

			// Adds resize event listener to recalculate height on window resize
			window.addEventListener("resize", () => sections.forEach((section) => setMinHeight(section)));
		}

		/**
		 * Sets the minimum height of the section based on the tallest product.
		 * @param {HTMLElement} section - The section element to set the minimum height for.
		 */
		function setMinHeight(section) {
			if (section.dataset.styleType !== "alternate") {
				return;
			}

			const products = [...section.querySelectorAll(selectors.product)];
			let maxHeight = 0;

			products.forEach((product) => {
				const wasActive = product.classList.contains(cssClasses.active);

				// Temporarily add the active class for height measurement
				product.classList.add(cssClasses.active);

				const productHeight = product.offsetHeight;
				if (productHeight > maxHeight) {
					maxHeight = productHeight;
				}

				// Restore the active state if it was not active before
				if (!wasActive) {
					product.classList.remove(cssClasses.active);
				}
			});

			// Set the CSS variable for minimum height
			section.style.setProperty("--best-sellers-new-min-height", `${maxHeight}px`);
		}

		/**
		 * Changes the visible product based on the hovered collection.
		 * @param {HTMLElement} section - The section element containing products.
		 * @param {HTMLElement} collection - The collection that was hovered over.
		 */
		function showTargetItem(section, collection) {
			const products = [...section.querySelectorAll(selectors.product)];

			// Toggle the active class based on the hovered collection
			products.forEach((product) => {
				product.classList.toggle(cssClasses.active, product.dataset.index === collection.dataset.index);
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.BestSellers = window.themeCore.BestSellers || BestSellers();
		window.themeCore.utils.register(window.themeCore.BestSellers, "best-sellers");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
