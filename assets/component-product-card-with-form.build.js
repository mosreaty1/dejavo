(function () {
	'use strict';

	const selectors = {
		card: ".js-product-card",
		form: ".js-product-card-form",
		imageWrapper: ".js-product-card-form-images-wrapper",
		price: ".js-price",
		button: ".js-product-card-button",
		product: ".js-product-card-product",
		variantElemJSON: "[data-selected-variant]",
		option: "select[data-option], [data-option]:checked",
		hiddenInput: ".js-product-card-variant-input",
		swatches: "[data-option-index]",
		formError: ".js-product-card-error",
		checkmark: ".js-product-card-checkmark",
		minQuantity: ".js-product-card-min-value"
	};

	var ProductCardWithForm = () => {
		const cssClasses = window.themeCore.utils.cssClasses;
		function init() {
			addListeners();
		}

		function addListeners() {
			document.addEventListener("change", changeHandler);
			document.addEventListener("submit", submitHandler);
		}

		async function changeHandler(event) {
			const form = event.target.closest(selectors.form);

			if (!form) {
				return;
			}

			const card = form.closest(selectors.card);

			if (!card) {
				return;
			}
			const sectionId = card.dataset.section;
			const imageWrappers = [...card.querySelectorAll(selectors.imageWrapper)];
			const swatches = form.querySelector(selectors.swatches);
			const swatchesIndex = swatches && swatches.dataset.optionIndex;
			let options = [...form.querySelectorAll(selectors.option)];
			const price = card.querySelector(selectors.price);
			let button = form.querySelector(selectors.button);
			button && button.classList.contains(cssClasses.hidden) && (button = null);
			const product = getSettings(form.querySelector(selectors.product));
			const checkmarks = card.querySelectorAll(selectors.checkmark);
			const formError = form.querySelector(selectors.formError);

			if (!product) {
				return;
			}

			if (event.target.tagName === "SELECT" && event.target.selectedOptions.length) {
				Array.from(event.target.options)
					.find((option) => option.getAttribute("selected"))
					.removeAttribute("selected");
				event.target.selectedOptions[0].setAttribute("selected", "selected");
			}

			const allOptionsChecked = (!swatchesIndex || options.some((option) => option.name === swatchesIndex)) && options.every((option) => option.value);

			if (!allOptionsChecked) {
				return;
			}

			card && card.classList.add(cssClasses.active);
			checkmarks.length && checkmarks.forEach((checkmark) => checkmark.classList.add(cssClasses.active));

			const hiddenInput = form.querySelector(selectors.hiddenInput);
			const productUrl = card.getAttribute("data-product-url");

			await updateVariantJSON(form, productUrl);

			const variant = getVariant(form);

			if (variant) {
				setCurrentVariant(variant.id, hiddenInput);
				updateImages(variant.featured_image, imageWrappers);
				await updatePrice(product.handle, variant.id, price);
			} else {
				setCurrentVariant("", hiddenInput);
				hidePrice(price);
			}

			updateButton(variant, button || formError);
			window.themeCore.EventBus.emit(`product-card:change-variant`, {
				sectionId: sectionId
			});
		}

		function getSettings(element) {
			try {
				return JSON.parse(element.textContent);
			} catch {
				return null;
			}
		}

		async function updateVariantJSON(form, productUrl) {
			if (!form || !productUrl) {
				return;
			}

			const selectedOptionValues = Array.from(form.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")).map(
				({ dataset }) => dataset.optionValueId
			);

			const params = selectedOptionValues.length > 0 ? `&option_values=${selectedOptionValues.join(",")}` : "";
			const productCardUrl = `${productUrl}?section_id=product-bundle-card${params}`;

			const fetchVariantJSONElement = await getHTML(productCardUrl, selectors.variantElemJSON);
			const formVariantJSONElement = form.querySelector(selectors.variantElemJSON);

			if (formVariantJSONElement) {
				formVariantJSONElement.innerHTML = fetchVariantJSONElement.innerHTML;
			}
		}

		function getVariant(container) {
			if (!container) {
				return;
			}

			const variantJSONElement = container.querySelector(selectors.variantElemJSON);
			const currentVariant = variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;

			return currentVariant;
		}

		function setCurrentVariant(variantId, hiddenInput) {
			if (!hiddenInput) {
				return;
			}

			hiddenInput.value = variantId;
		}

		function updateImages(featuredImage, imageWrappers) {
			if (!featuredImage) {
				return;
			}

			const hasVariantImage = imageWrappers.some((image) => image.dataset.imageId.includes(String(featuredImage.id)));

			if (hasVariantImage) {
				imageWrappers.forEach((imageWrapper) => {
					if (imageWrapper.dataset.imageId.includes(String(featuredImage.id))) {
						imageWrapper.classList.add(cssClasses.active);
					} else {
						imageWrapper.classList.remove(cssClasses.active);
					}
				});
			}
		}

		async function updatePrice(productHandle, variantId, price) {
			if (!price) {
				return;
			}

			const url = getProductUrl(productHandle, variantId, "price").toString();

			if (!url) {
				return;
			}

			const fetchPrice = await getHTML(url, selectors.fetchPrice);
			price.innerHTML = fetchPrice.querySelector(selectors.price) && fetchPrice.querySelector(selectors.price).outerHTML;
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

		function updateButton(variant, button) {
			if (!button) {
				return;
			}

			const isFormError = !button.matches(selectors.button);

			if (!variant) {
				button.innerHTML = window.themeCore.translations.get("products.product.unavailable");
			} else if (!variant.available) {
				button.innerHTML = window.themeCore.translations.get("products.product.sold_out");
			} else if (!isFormError) {
				button.innerHTML = window.themeCore.translations.get("products.product.add_to_cart");
			} else {
				button.innerHTML = "";
			}

			if (isFormError) {
				return;
			}

			button.disabled = !variant || !variant.available;
		}

		function getProductUrl(productHandle, variant, templateSuffix) {
			if (!productHandle) {
				return;
			}

			const locale = window.Shopify.routes.root;
			const url = new URL(`${window.location.origin}${locale}products/${productHandle}`);
			url.searchParams.set("view", templateSuffix);
			if (variant) {
				url.searchParams.set("variant", variant);
			}

			return url;
		}

		function hidePrice(price) {
			if (!price) {
				return;
			}

			price.innerHTML = "";
		}

		async function submitHandler(event) {
			const form = event.target.closest(selectors.form);
			const formData = form && new FormData(form);
			const variant = form && form.querySelector(selectors.hiddenInput);
			const minQuantityEl = form && form.querySelector(selectors.minQuantity);
			const variantId = variant && variant.value;
			const minQuantity = minQuantityEl ? Number(minQuantityEl.value) : 1;

			if (!formData || !variantId) {
				return;
			}

			event.preventDefault();
			const errorMessage = await addToCart(variantId, minQuantity);
			changeErrorMessage(form, errorMessage);

			if (!errorMessage) {
				return;
			}

			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART);
		}

		async function addToCart(variantId, quantity) {
			try {
				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, {
					id: variantId,
					quantity
				});
			} catch (error) {
				return error.description;
			}
		}

		function changeErrorMessage(form, message = "") {
			const formError = form && form.querySelector(selectors.formError);

			if (!formError) {
				return;
			}

			formError.innerText = message;
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.ProductCardWithForm = window.themeCore.ProductCardWithForm || ProductCardWithForm();

		window.themeCore.utils.register(window.themeCore.ProductCardWithForm, "product-card-with-banner");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
