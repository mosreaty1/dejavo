(function () {
	'use strict';

	/**
	 * Component: Product form
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ProductForm
	 */

	/**
	 * DOM selectors.
	 */
	const selectors$2 = {
		container: "[data-js-product-form]",
		product: "[data-js-product-json]",
		skuWrapper: ".js-product-sku-wrapper",
		sku: ".js-product-sku",
		price: ".js-price",
		productPrice: "[data-product-price]",
		productPriceOld: "[data-price-old]",
		priceUnit: "[data-js-unit-price]",
		variantId: '[name="id"]',
		submit: '[type="submit"]',
		quantityError: ".js-product-quantity-error",
		mobileHeader: ".js-product-form-mobile",
		variants: "[data-js-product-variant]",
		variantElemJSON: "[data-selected-variant]",
		isPreset: "[data-is-preset]",
		productInventoryWrapper: ".js-product-inventory-wrapper",
		lowStockText: ".js-product-low-stock-msg",
		highStockText: ".js-product-high-stock-msg",
		additionalQuantityInput: "[data-quantity-input-additional]",
		stickyBar: ".js-sticky-add-to-cart",
		stickyBarButton: ".js-sticky-add-to-cart-button",
		recipientCheckbox: ".js-recipient-form-checkbox",
		recipientFieldsContainer: ".js-recipient-form-fields",
		recipientField: ".js-recipient-form-field",
		recipientTimeZoneOffset: ".js-recipient-form-timezone-offset",
		recipientNoJsControl: ".js-recipient-form-no-js-control",
		customFieldGroup: ".js-custom-field-block",
		customFieldInput: ".js-custom-field-input",
		customFieldCheckbox: ".js-custom-field-checkbox",
		animate: ".js-animate",
		breaksVal: ".js-price-breaks-val",
		volumePricing: ".js-product-volume-pricing",
		quantityRuleMin: ".js-product-quantity-rule-min",
		quantityRuleMax: ".js-product-quantity-rule-max",
		quantityRuleIncrement: ".js-product-quantity-rule-increment",
		quantityRuleMinVal: ".js-product-quantity-rule-min-val",
		quantityRuleMaxVal: ".js-product-quantity-rule-max-val",
		quantityRuleIncrementVal: ".js-product-quantity-rule-increment-val",
		volumePricingList: ".js-product-volume-pricing-list",
		volumePricingJSON: "[data-product-qty-breaks-json]",
		volumePricingShowMore: ".js-product-volume-pricing-show-more",
		priceVolume: ".js-price-volume",
		formError: ".js-form-error",
		swatchLabelName: ".js-swatch-label-name",
		quantityRules: ".js-product-quantity-rules",
		inventoryStatusQuantity: ".js-product-inventory-status-quantity"
	};
	let classes = {};
	const attributes = {
		id: "id",
		isCurrencyEnabled: "data-currency-code-enabled"
	};

	const cachedOptions = new Map();

	let fetchController = new AbortController();
	let prefetchController = new AbortController();

	/**
	 * Export a new product form interface.
	 */
	var ProductForm = () => {
		let convertFormData;
		let QuantityWidget;
		let cssClasses;
		let formatMoney;
		let getUrlWithVariant;

		/**
		 * Local variables
		 */
		let containers = [];
		let mobileHeaders = [];
		let forms = [];

		/**
		 * Initialise component.
		 */
		function init() {
			convertFormData = window.themeCore.utils.convertFormData;
			QuantityWidget = window.themeCore.utils.QuantityWidget;
			cssClasses = window.themeCore.utils.cssClasses;
			formatMoney = window.themeCore.utils.formatMoney;
			getUrlWithVariant = window.themeCore.utils.getUrlWithVariant;

			classes = {
				...cssClasses,
				onSale: "price--on-sale",
				hidePrice: "price--hide",
				animate: "js-animate",
				animated: "animated"
			};

			containers = findForms();
			mobileHeaders = findHeaders();
			forms = setForms();

			setEventListeners();
			setEventBusListeners();
			initFirstState();
			showOptions();
			initStickyBar();
			initRecipientForm();
		}

		/**
		 * Set click events on items.
		 */
		function setEventListeners() {
			forms.forEach(({ container: form }) => {
				form.addEventListener("change", onChangeForm);
				form.addEventListener("submit", onFormSubmit);
			});

			window.themeCore.EventBus.listen("cart:updated", function (cartData) {
				if (!cartData) {
					return;
				}

				if (!cartData.items) {
					return;
				}

				containers.forEach(function (container) {
					const currentVariant = findCurrentVariant(container);
					const quantityVariantInCart = getVariantCountInCart(currentVariant);

					updateVolumePricing(container, currentVariant, quantityVariantInCart, false);
					updateQuantityRules(container, currentVariant);
					updateQuantityLabelCartCount(container, quantityVariantInCart);
				});
			});
		}

		/**
		 * Set EventBus listeners.
		 */
		function setEventBusListeners() {
			if (forms.length) {
				forms.forEach(({ container: form }) => {
					const productSection = form.closest("[data-section-type=product]");
					const sectionId = productSection.getAttribute("data-section-id");

					window.themeCore.EventBus.listen(`form:${sectionId}:change-variant`, updateForm);
				});
			}
		}

		function updateForm({ currentVariant, elements, form, isTrusted }) {
			const quantityVariantInCart = getVariantCountInCart(currentVariant);

			if (isTrusted) {
				updateSwatchLabelName(currentVariant, form);
				updateSku(elements, currentVariant);
				updateSku({ skuContainer: elements.mobileSkuContainer }, currentVariant);
				updatePrice(elements, currentVariant);
				updateVariantId(elements, currentVariant);
				updateErrorMessages(elements);
				updateAddToCart(elements, currentVariant);
				updatePickupAvailability(currentVariant, form);
			}

			updateVolumePricing(form, currentVariant, quantityVariantInCart, isTrusted);
			updateQuantityRules(form, currentVariant);
			updateQuantityLabelCartCount(form, quantityVariantInCart);
		}

		function updatePickupAvailability(variant, form) {
			const pickUpAvailability = form.querySelector("pickup-availability");

			if (!pickUpAvailability) {
				return;
			}

			if (variant && variant.available) {
				pickUpAvailability.fetchAvailability(variant.id);
			} else {
				pickUpAvailability.removeAttribute("available");
				pickUpAvailability.innerHTML = "";
			}
		}

		function updateSwatchLabelName(variant, container) {
			const swatchNameEl = container.querySelector(selectors$2.swatchLabelName);

			if (!swatchNameEl) {
				return;
			}

			if (!variant) {
				const swatchName = swatchNameEl.getAttribute("data-swatch-name");
				const swatchOptionSelected = container.querySelector(`[data-option='${swatchName}']:checked`);

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

		function updatePrice({ priceContainers }, variant) {
			if (!variant) {
				priceContainers.forEach((priceContainer) => priceContainer.classList.add(classes.hidePrice));
				updateUnitPrice(priceContainers, {});
				return;
			} else if (!priceContainers.length) {
				return;
			}

			priceContainers.forEach((priceContainer) => {
				const isCurrencyEnabled = priceContainer.hasAttribute(attributes.isCurrencyEnabled);
				const format = isCurrencyEnabled ? window.themeCore.objects.shop.money_with_currency_format : window.themeCore.objects.shop.money_format;

				const { price, compare_at_price } = variant;
				const onSale = compare_at_price > price;
				const moneyPrice = formatMoney(price, format);
				const moneyPriceOld = formatMoney(compare_at_price, format);

				priceContainer.classList.remove(classes.hidePrice);

				if (onSale) {
					priceContainer.classList.add(classes.onSale);
				} else {
					priceContainer.classList.remove(classes.onSale);
				}

				const productPrice = priceContainer.querySelectorAll(selectors$2.productPrice);
				const productPriceOld = priceContainer.querySelectorAll(selectors$2.productPriceOld);

				productPrice.forEach((element) => (element.innerHTML = moneyPrice));
				productPriceOld.forEach((element) => (element.innerHTML = moneyPriceOld));
			});

			updateUnitPrice(priceContainers, variant);
		}

		function updateUnitPrice(priceContainers, variant) {
			priceContainers.forEach((priceContainer) => {
				const unitPrice = [...priceContainer.querySelectorAll(selectors$2.priceUnit)];

				if (!unitPrice.length) {
					return;
				}

				const unitPriceContainerEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "container");
				const unitPriceMoneyEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "money");
				const unitPriceReferenceEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "reference");
				const variantUnitPrice = variant.unit_price;
				const variantUnitPriceMeasurement = variant.unit_price_measurement;

				if (unitPriceMoneyEl) {
					if (variantUnitPrice) {
						const format = window.themeCore.objects.shop.money_format;
						unitPriceMoneyEl.innerHTML = formatMoney(variantUnitPrice, format);
					} else {
						unitPriceMoneyEl.innerHTML = "";
					}
				}

				if (unitPriceReferenceEl) {
					if (variantUnitPriceMeasurement) {
						const referenceValue = variantUnitPriceMeasurement.reference_value;
						const referenceUnit = variantUnitPriceMeasurement.reference_unit;
						unitPriceReferenceEl.innerHTML = referenceValue !== 1 ? referenceValue + referenceUnit : referenceUnit;
					} else {
						unitPriceReferenceEl.innerHTML = "";
					}
				}

				if (unitPriceContainerEl && (variantUnitPrice || variantUnitPriceMeasurement)) {
					unitPriceContainerEl.classList.remove(window.themeCore.utils.cssClasses.hidden);
				} else {
					unitPriceContainerEl.classList.add(window.themeCore.utils.cssClasses.hidden);
				}
			});
		}

		function updateSku({ skuContainer }, variant) {
			if (!skuContainer) {
				return;
			}

			let sku = null;

			if (variant) {
				sku = variant.sku;
			}

			const skuWrapper = skuContainer.closest(selectors$2.skuWrapper);

			if (!sku) {
				const isPreset = skuContainer.closest(selectors$2.isPreset);
				if (isPreset && isPreset.dataset.isPreset === "true") {
					skuWrapper && skuWrapper.classList.remove(classes.hidden);
					return;
				}

				skuContainer.innerHTML = "";
				skuWrapper && skuWrapper.classList.add(classes.hidden);
				return;
			}

			const skuText = skuContainer.dataset.skuText;

			skuContainer.innerHTML = skuText ? skuText.replaceAll("%SKU%", sku).replaceAll("%sku%", sku) : sku;
			skuWrapper && skuWrapper.classList.remove(classes.hidden);
		}

		function updateVariantId({ variantIdContainer }, variant) {
			if (!variantIdContainer || !variant) {
				return;
			}
			const { id } = variant;
			variantIdContainer.value = id;
		}

		function updateErrorMessages({ quantityError }) {
			if (!quantityError) {
				return;
			}

			quantityError.innerHTML = "";
		}

		function updateAddToCart({ submit }, currentVariant) {
			const removeDisabled = () => submit.forEach((button) => button.removeAttribute("disabled"));
			const setDisabled = () => submit.forEach((button) => button.setAttribute("disabled", "disabled"));
			const setSubmitText = (text) => submit.forEach((button) => (button.innerText = text));
			const isPreorderTemplate = submit.some((button) => button.hasAttribute("data-preorder"));
			const soldOut = window.themeCore.translations.get("products.product.sold_out");
			const unavailable = window.themeCore.translations.get("products.product.unavailable");
			const preOrder = window.themeCore.translations.get("products.product.pre_order");
			const addToCart = isPreorderTemplate ? preOrder : window.themeCore.translations.get("products.product.add_to_cart");

			if (currentVariant && currentVariant.available) {
				removeDisabled();
				setSubmitText(addToCart);
			} else if (currentVariant && !currentVariant.available) {
				setDisabled();
				setSubmitText(soldOut);
			} else {
				setDisabled();
				setSubmitText(unavailable);
			}
		}

		function updateQuantityRules(container, variant) {
			const currentContainerData = forms.find((form) => form.container.getAttribute("id") === container.getAttribute("id"));
			const quantityWidgetEl = currentContainerData.elements.quantityWidgetEl;
			const quantityRules = container.querySelector(selectors$2.quantityRules);

			if (!quantityRules) {
				return;
			}

			if (!variant || (variant && !variant.quantity_rule)) {
				quantityRules.classList.add(cssClasses.hidden);
				return;
			} else {
				quantityRules.classList.remove(cssClasses.hidden);
			}

			const variantQuantityRules = variant.quantity_rule;
			const quantityRuleIncrement = quantityRules.querySelector(selectors$2.quantityRuleIncrement);
			const quantityRuleMin = quantityRules.querySelector(selectors$2.quantityRuleMin);
			const quantityRuleMax = quantityRules.querySelector(selectors$2.quantityRuleMax);
			const quantityRuleIncrementVal = quantityRules.querySelector(selectors$2.quantityRuleIncrementVal);
			const quantityRuleMinVal = quantityRules.querySelector(selectors$2.quantityRuleMinVal);
			const quantityRuleMaxVal = quantityRules.querySelector(selectors$2.quantityRuleMaxVal);

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

		function updateVolumePricing(container, variant, quantity, isTrusted) {
			const currentContainerData = forms.find((form) => form.container.getAttribute("id") === container.getAttribute("id"));
			const quantityWidgetEl = currentContainerData.elements.quantityWidgetEl;
			const currentVariantEl = container.querySelector("[name=id]");

			if (!currentVariantEl) {
				return;
			}

			const volumePricing = container.querySelector(selectors$2.volumePricing);
			const volumePricingList = container.querySelector(selectors$2.volumePricingList);
			const volumePricingJSONEl = container.querySelector(selectors$2.volumePricingJSON);

			let quantityBreaks = null;

			if (!volumePricingJSONEl || !volumePricing) {
				return;
			}

			if (variant) {
				const volumePricingJSON = JSON.parse(volumePricingJSONEl.innerHTML);

				quantityBreaks = volumePricingJSON[variant.id].quantity_price_breaks;

				updateVariantVolumePrice(quantityBreaks);

				if (!isTrusted) {
					return;
				}

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
				const showMoreBtn = container.querySelector(selectors$2.volumePricingShowMore);
				const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
				const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.each", {
					price: formatMoney(variant.price, moneyFormat)
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
					<span>${variant.quantity_rule.min}<span aria-hidden>+</span></span>
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
				const priceEls = container.querySelectorAll(selectors$2.priceVolume);
				const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
				const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.price_at_each", {
					price: formatMoney(variant.price, moneyFormat)
				});

				if (!priceEls.length) {
					return;
				}

				if (!variant) {
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

		function getVariantCountInCart(variant) {
			const cartData = window.themeCore.cartObject;

			if (!cartData || !variant) {
				return;
			}

			if (!cartData.items.length) {
				return 0;
			}

			const currentVariant = cartData.items.find(function (item) {
				return item.variant_id === variant.id;
			});

			if (!currentVariant) {
				return 0;
			}

			return currentVariant.quantity;
		}

		function updateQuantityLabelCartCount(container, quantity) {
			if (!container) {
				return;
			}

			const priceBreaksEl = container.querySelector(selectors$2.breaksVal);

			if (!priceBreaksEl) {
				return;
			}

			priceBreaksEl.classList.toggle(cssClasses.hidden, !quantity);

			if (!quantity) {
				priceBreaksEl.innerHTML = "";
			}

			priceBreaksEl.innerHTML = window.themeCore.translations.get("products.product.quantity_in_cart", { quantity });
		}

		async function onChangeForm({ currentTarget: form, target, isTrusted }) {
			/* eslint-disable */
			const currentFormEntity = forms.find(({ container, elements: { optionElements } }) => form === container);
			/* eslint-enable */

			if (!currentFormEntity) {
				return;
			}

			if (target.hasAttribute("data-quantity-input")) {
				let currentVariant = findCurrentVariant(form);
				let quantityVariantInCart = getVariantCountInCart(currentVariant);

				updateVolumePricing(form, currentVariant, quantityVariantInCart, false);
				updateQuantityRules(form, currentVariant);
				updateQuantityLabelCartCount(form, quantityVariantInCart);
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

			const productSection = form.closest("[data-section-type=product]");
			const sectionId = productSection.getAttribute("data-section-id");
			const productUrl = productSection.getAttribute("data-url");

			// Get the selected option value IDs and format as query param
			const productOptionsContainer = form.querySelector(".js-product-options");

			if (!productOptionsContainer) {
				return;
			}

			const selectedOptionValues = Array.from(productOptionsContainer.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")).map(
				({ dataset }) => dataset.optionValueId
			);

			const params = selectedOptionValues.length > 0 ? `&option_values=${selectedOptionValues.join(",")}` : "";
			const url = `${productUrl}?section_id=${sectionId}${params}`;

			let responseText;

			const cachedResult = cachedOptions.get(url);

			if (cachedResult) {
				responseText = cachedResult;
			} else {
				try {
					fetchController.abort();
					fetchController = new AbortController();
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

			prefetchOptions(form);

			const html = new DOMParser().parseFromString(responseText, "text/html");

			productOptionsContainer.innerHTML = html.querySelector(".js-product-options").innerHTML;

			let currentVariant = findCurrentVariant(productOptionsContainer);
			let elements = currentFormEntity.elements;
			let product = currentFormEntity.product;

			/* update "volumePricingJSON" */
			let volumePricingJSONEl = form.querySelector(selectors$2.volumePricingJSON);

			if (volumePricingJSONEl && html.querySelector(selectors$2.volumePricingJSON)) {
				volumePricingJSONEl.innerHTML = html.querySelector(selectors$2.volumePricingJSON).innerHTML;
			}
			/* update "volumePricingJSON" end */

			// need to set focus to last clicked option value
			if (document.querySelector(`#${target.id}`)) {
				document.querySelector(`#${target.id}`).focus();
			}

			window.themeCore.EventBus.emit(`form:${sectionId}:change-variant`, {
				form,
				product,
				currentVariant,
				elements,
				isTrusted
			});

			if (currentVariant) {
				window.themeCore.EventBus.emit(`pdp:section-${sectionId}:change-variant`, {
					variantId: currentVariant.id,
					variant: currentVariant,
					product: product,
					firstInitialization: false
				});
			}

			let productInventoryWrapper = form.querySelector(selectors$2.productInventoryWrapper);

			if (productInventoryWrapper && html.querySelector(selectors$2.productInventoryWrapper)) {
				productInventoryWrapper.outerHTML = html.querySelector(selectors$2.productInventoryWrapper).outerHTML;
			}

			if (isEnableHistoryState(form)) {
				updateHistoryState(currentVariant);
			}
		}

		function validateCustomFields(arr) {
			let error = false;

			arr.forEach(function (obj) {
				const inputValue = obj.input.value.trim();

				if (obj.checkbox) {
					if (obj.checkbox.checked && !inputValue.length) {
						obj.input.classList.add("error");
						obj.checkbox.classList.remove("error");

						error = true;
					} else if (!obj.checkbox.checked && inputValue.length) {
						obj.input.classList.remove("error");
						obj.checkbox.classList.add("error");

						error = true;
					} else {
						obj.input.classList.remove("error");
						obj.checkbox.classList.remove("error");
					}
				}
			});

			return error;
		}

		function onFormSubmit(event) {
			const target = event.target;

			event.preventDefault();

			const form = forms.find((f) => f.id === target.getAttribute(attributes.id));

			const customFieldElementsArr = form.elements.customFieldElements;

			if (customFieldElementsArr) {
				let isError = validateCustomFields(customFieldElementsArr);

				if (isError) {
					return;
				}
			}

			if (form) {
				const { submit } = form.elements;
				submit.forEach((button) => button.classList.add(classes.loading));
			}

			const formData = new FormData(target);
			const serialized = convertFormData(formData);

			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, serialized)
				.then((response) => {
					onFormSubmitSuccess(response, form);
				})
				.catch((error) => {
					onFormSubmitError(error, form);
				});
		}

		function onFormSubmitSuccess(success, form) {
			if (!form) {
				return;
			}

			const formElement = form.container;
			const { quantityWidget, submit } = form.elements;
			quantityWidget && quantityWidget.setValue(0);
			submit.forEach((button) => button.classList.remove(classes.loading));

			resetRecipientForm(formElement);

			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART);
		}

		function onFormSubmitError(error, form) {
			if (!form) {
				return;
			}

			const formElement = form.container;
			const hasRecipientForm = formElement.querySelector(selectors$2.recipientCheckbox);
			let { description } = error;
			const { quantityError, submit } = form.elements;

			if (typeof description === "object" && hasRecipientForm) {
				const sectionID = form.container.dataset.sectionId;
				let errors = error.errors;

				const errorMessages = formElement.querySelectorAll(selectors$2.formError);
				const recipientFormFields = formElement.querySelectorAll(selectors$2.recipientField);

				if (errorMessages.length && recipientFormFields.length) {
					errorMessages.forEach(function (messageEl) {
						messageEl.classList.add(classes.hidden);
						messageEl.innerText = "";
					});

					recipientFormFields.forEach(function (field) {
						field.setAttribute("aria-invalid", false);
						field.removeAttribute("aria-describedby");
					});
				}

				return Object.entries(errors).forEach(([key, value]) => {
					const errorMessageId = `RecipientForm-${key}-error-${sectionID}`;
					const errorMessageElement = formElement.querySelector(`#${errorMessageId}`);
					const inputId = `Recipient-${key}-${sectionID}`;
					const inputElement = formElement.querySelector(`#${inputId}`);
					let message = `${value.join(", ")}`;

					if (key === "send_on") {
						message = `${value.join(", ")}`;
					}

					if (errorMessageElement) {
						errorMessageElement.innerText = message;
						errorMessageElement.classList.remove(classes.hidden);
					}

					if (inputElement) {
						inputElement.setAttribute("aria-invalid", true);
						inputElement.setAttribute("aria-describedby", errorMessageId);
					}

					submit.forEach((button) => button.classList.remove(classes.loading));
				});
			}

			quantityError && (quantityError.innerHTML = description);
			submit.forEach((button) => button.classList.remove(classes.loading));
		}

		function findCurrentVariant(container) {
			if (!container) {
				return;
			}

			const variantJSONElement = container.querySelector(selectors$2.variantElemJSON);
			const currentVariant = variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;

			return currentVariant;
		}

		function updateHistoryState(variant) {
			if (!variant) {
				return null;
			}

			const url = getUrlWithVariant(window.location.href, variant.id);

			window.history.replaceState({ path: url }, "", url);
		}

		function isEnableHistoryState(form) {
			return form.dataset.enableHistoryState || false;
		}

		function initFirstState() {
			forms.forEach(async (form) => {
				let currentVariant = findCurrentVariant(form.container);

				updateForm({ currentVariant, elements: form.elements, form: form.container, product: form.product, isTrusted: true });

				if (currentVariant) {
					const productSection = form.container.closest("[data-section-type=product]");
					const sectionId = productSection.getAttribute("data-section-id");

					window.themeCore.EventBus.emit(`pdp:section-${sectionId}:change-variant`, {
						variantId: currentVariant.id,
						variant: currentVariant,
						product: form.product,
						firstInitialization: true
					});
				}

				if (isEnableHistoryState(form.container)) {
					updateHistoryState(currentVariant);
				}

				await prefetchOptions(form.container);
			});
		}

		/**
		 * Find all form containers
		 * @returns {Array} containers
		 */
		function findForms() {
			return [...document.querySelectorAll(selectors$2.container)];
		}

		function findHeaders() {
			return [...document.querySelectorAll(selectors$2.mobileHeader)];
		}

		/**
		 * Parse containers and set forms
		 * @returns {Array} forms
		 */
		function setForms() {
			return containers.reduce((acc, container) => {
				const productJsonTag = container.querySelector(selectors$2.product);
				let product = {};

				try {
					product = JSON.parse(productJsonTag.innerHTML);
				} catch (e) {
					return acc;
				}

				const id = container.getAttribute(attributes.id);
				const submit = [...container.querySelectorAll(selectors$2.submit)];
				const skuContainer = container.querySelector(selectors$2.sku);
				const priceContainers = [...container.querySelectorAll(selectors$2.price)];
				const quantityError = container.querySelector(selectors$2.quantityError);
				const variantIdContainer = container.querySelector(selectors$2.variantId);
				let optionElements = [...container.querySelectorAll("[data-option]")];

				let mobileSkuContainer = null;
				const additionalQuantityInput = container.querySelector(selectors$2.additionalQuantityInput);

				const quantityWidgetEl = QuantityWidget(container, {
					onQuantityChange: (widget) => {
						updateErrorMessages({ quantityError });

						additionalQuantityInput && (additionalQuantityInput.value = widget.quantity.value);
					}
				}).init();

				additionalQuantityInput &&
					additionalQuantityInput.addEventListener("input", () => {
						if (additionalQuantityInput.value !== quantityWidgetEl.value) {
							quantityWidgetEl.setValue(additionalQuantityInput.value);
							quantityWidgetEl.dispatch();
						}
					});

				const currentMobileHeader = mobileHeaders.find((mobileHeader) => mobileHeader.dataset.formId === id);

				if (currentMobileHeader) {
					mobileSkuContainer = currentMobileHeader.querySelector(selectors$2.sku);
				}

				const customFieldBlocks = [...container.querySelectorAll(selectors$2.customFieldGroup)];

				const customFieldElements = customFieldBlocks.map(function (customFieldBlock) {
					let input = customFieldBlock.querySelector(selectors$2.customFieldInput);
					let checkbox = customFieldBlock.querySelector(selectors$2.customFieldCheckbox);

					return {
						input,
						checkbox
					};
				});

				return [
					...acc,
					{
						id,
						container,
						product,
						elements: {
							skuContainer,
							priceContainers,
							quantityWidgetEl,
							quantityError,
							variantIdContainer,
							submit,
							mobileSkuContainer,
							optionElements,
							customFieldElements
						}
					}
				];
			}, []);
		}

		function initStickyBar() {
			containers.forEach((form) => {
				const stickyBar = form.querySelector(selectors$2.stickyBar);
				const mainButton = form.querySelector(selectors$2.submit);

				if (!stickyBar || !mainButton) {
					return;
				}

				const observer = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						const rect = mainButton.getBoundingClientRect();
						stickyBar.classList.toggle(window.themeCore.utils.cssClasses.active, !entry.isIntersecting && rect.bottom < 0);

						if (!entry.isIntersecting) {
							const animate = stickyBar.closest(selectors$2.animate);
							animate && animate.classList.remove(classes.animate);
							animate && animate.classList.add(classes.animated);
						}
					});
				}, {});
				observer.observe(mainButton);

				stickyBar.addEventListener("click", (event) => {
					const stickyBarButton = event.target.closest(selectors$2.stickyBarButton);

					if (!stickyBarButton) {
						return;
					}

					mainButton.focus();
				});
			});
		}

		function initRecipientForm() {
			containers.forEach((form) => {
				const recipientCheckbox = form.querySelector(selectors$2.recipientCheckbox);
				const recipientFormFieldsContainer = form.querySelector(selectors$2.recipientFieldsContainer);
				const recipientFormFields = form.querySelectorAll(selectors$2.recipientField);
				const recipientTimeZoneOffset = form.querySelector(selectors$2.recipientTimeZoneOffset);
				const recipientControlNoJsCheckbox = form.querySelector(selectors$2.recipientNoJsControl);

				if (!recipientCheckbox || !recipientFormFieldsContainer || !recipientFormFields || !recipientTimeZoneOffset) {
					return;
				}

				recipientTimeZoneOffset.value = new Date().getTimezoneOffset().toString();
				recipientControlNoJsCheckbox.disabled = true;
				recipientCheckbox.disabled = false;

				disableInputFields();

				recipientCheckbox.addEventListener("change", function () {
					if (recipientCheckbox.checked) {
						recipientFormFieldsContainer.classList.remove(classes.hidden);
						enableInputFields();
					} else {
						recipientFormFieldsContainer.classList.add(classes.hidden);
						disableInputFields();
					}
				});

				function disableInputFields() {
					recipientFormFields.forEach(function (field) {
						field.disabled = true;
					});

					recipientTimeZoneOffset.disabled = true;
				}

				function enableInputFields() {
					recipientFormFields.forEach(function (field) {
						field.disabled = false;
					});

					recipientTimeZoneOffset.disabled = false;
				}
			});
		}

		function recipientFormClearErrors(form) {
			const recipientCheckbox = form.querySelector(selectors$2.recipientCheckbox);

			if (!recipientCheckbox) {
				return;
			}

			const recipientFormFieldsContainer = form.querySelector(selectors$2.recipientFieldsContainer);
			const errorMessages = recipientFormFieldsContainer.querySelectorAll(selectors$2.formError);
			const recipientFormFields = form.querySelectorAll(selectors$2.recipientField);

			if (!errorMessages || !recipientFormFields) {
				return;
			}

			errorMessages.forEach(function (messageEl) {
				messageEl.classList.add(classes.hidden);
				messageEl.innerText = "";
			});

			recipientFormFields.forEach(function (field) {
				field.setAttribute("aria-invalid", false);
				field.removeAttribute("aria-describedby");
			});
		}

		function recipientFormClearInputs(form) {
			const recipientCheckbox = form.querySelector(selectors$2.recipientCheckbox);

			if (!recipientCheckbox) {
				return;
			}

			const recipientFormFields = form.querySelectorAll(selectors$2.recipientField);

			if (!recipientFormFields) {
				return;
			}

			recipientFormFields.forEach(function (field) {
				field.value = "";
			});
		}

		function resetRecipientForm(form) {
			const recipientCheckbox = form.querySelector(selectors$2.recipientCheckbox);

			if (!recipientCheckbox) {
				return;
			}

			if (recipientCheckbox.checked) {
				recipientCheckbox.checked = false;
				recipientCheckbox.dispatchEvent(new Event("change"));
				recipientFormClearErrors(form);
				recipientFormClearInputs(form);
			}
		}

		function showOptions() {
			containers.forEach((form) => {
				const variants = form.querySelector(selectors$2.variants);

				if (variants && variants.dataset.jsProductVariant !== "no-hidden") {
					variants.classList.add(cssClasses.hidden);
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
			const productOptionsContainer = form.querySelector(".js-product-options");

			if (!productOptionsContainer) {
				return;
			}

			const productSection = form.closest("[data-section-type=product]");
			const sectionId = productSection.getAttribute("data-section-id");
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
			const urlsToFetch = variantsToFetch.map(({ option_values }) => `${productUrl}?section_id=${sectionId}&option_values=${option_values}`);
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

		/**
		 * Return all forms
		 * @returns {Array} forms
		 */
		function allForms() {
			return forms;
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init,
			allForms
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

	/**
	 * Component: Zoom
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace Zoom
	 */

	/**
	 * DOM selectors.
	 */
	const selectors$1 = {
		container: "[data-zoom-container]",
		media: "[data-zoom-media]",
		modal: "[data-zoom-modal]",
		toggle: "[data-zoom-modal-toggle]",
		content: "[data-zoom-content]",
		slider: "[data-zoom-slider]",
		slide: "[data-zoom-slide]",
		modalMedia: ".js-zoom-slider-modal-media",
		prevSlide: ".swiper-button-prev",
		nextSlide: ".swiper-button-next",
		button: "[data-js-zoom-button]",
		productSlider: "[data-js-product-media-slider]",
		productSliderWrapper: ".swiper-wrapper",
		notInitedIframe: ".js-video.js-video-youtube, .js-video:empty"
	};

	const breakpoints = {
		afterMedium: 1200
	};

	let Video$1;

	var Zoom = (context = document) => {
		/**
		 * Local variables
		 */
		const Swiper = window.themeCore.utils.Swiper;
		const off = window.themeCore.utils.off;
		const on = window.themeCore.utils.on;
		const Toggle = window.themeCore.utils.Toggle;
		const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
		const globalClasses = window.themeCore.utils.cssClasses;

		let containers = null;
		let isDrag = false;

		/**
		 * Initialise component.
		 */
		async function init() {
			Video$1 = await window.themeCore.utils.getExternalUtil("Video");

			containers = getContainers();

			containers.forEach((container) => {
				if (!container.media.length) {
					return;
				}

				container.modal.init();

				initVideos(container);

				container.slider = initMediaSlider(container);

				const observer = new MutationObserver(() => {
					if (container.el.querySelector(selectors$1.notInitedIframe)) {
						return;
					}

					disableTabulationOnNotActiveSlidesWithModel(container.slider);
					observer.disconnect();
				});

				const observerOptions = {
					attributes: true,
					childList: true,
					subtree: true
				};

				observer.observe(container.el, observerOptions);

				zoomMove(container);
			});

			setEventListeners();
		}

		function zoomMove(container) {
			let pos = { top: 0, left: 0, x: 0, y: 0 };

			const mouseDownHandler = function (e) {
				if (window.innerWidth < breakpoints.afterMedium) {
					return;
				}

				pos = {
					x: e.clientX,
					y: e.clientY
				};

				on("mousemove", document, mouseMoveHandler);
				on("mouseup", document, mouseUpHandler);
			};

			const mouseMoveHandler = function (e) {
				const dx = e.clientX - pos.x;
				const dy = e.clientY - pos.y;

				isDrag = Boolean(dx + dy);
			};

			const mouseUpHandler = function () {
				off("mousemove", document, mouseMoveHandler);
				off("mouseup", document, mouseUpHandler);
			};

			on("mousedown", container.el, mouseDownHandler);
		}

		/**
		 * Setup global event listeners for zoom containers.
		 */
		function setEventListeners() {
			containers.forEach((container) => {
				on("click", container.el, (e) => onTriggerClick(e, container));
				on("click", container.el, (e) => onSlideClick(e, container));
				on("click", container.el, (e) => onButtonClick(e, container));

				window.themeCore.EventBus.listen(`Toggle:${container.modalEl.id}:close`, (e) => onZoomModalClose(e, container));
			});
		}

		/**
		 * Find all zoom containers
		 * @returns {Array} containers
		 */
		function getContainers() {
			return [...context.querySelectorAll(selectors$1.container)].map((container) => {
				const media = [...container.querySelectorAll(selectors$1.media)];
				const slides = [...container.querySelectorAll(selectors$1.slide)];
				const content = container.querySelector(selectors$1.content);
				const modalEl = container.querySelector(selectors$1.modal);
				const sliderEl = container.querySelector(selectors$1.slider);
				const button = container.querySelector(selectors$1.button);

				const modal = Toggle({
					toggleSelector: modalEl.id
				});

				return {
					el: container,
					sliderEl,
					slides,
					modalEl,
					modal,
					media,
					content,
					button
				};
			});
		}

		/**
		 * Init video players in zoom modal
		 * @param {Array} slides
		 */
		function initVideos({ slides }) {
			slides.forEach((slide) => {
				const [video] = Video$1({
					videoContainer: slide,
					options: {
						youtube: {
							controls: 1,
							showinfo: 1
						}
					}
				}).init();

				if (video) {
					slide.video = video;
				}
			});
		}

		/**
		 * Init slider in zoom modal
		 * @param {Element} sliderEl,
		 * @param {Array} slides
		 */
		function initMediaSlider({ sliderEl, slides }) {
			return new Swiper(sliderEl, {
				slidesPerView: 1,
				allowTouchMove: false,
				zoom: {
					maxRatio: 3,
					minRatio: 1
				},
				navigation: {
					prevEl: selectors$1.prevSlide,
					nextEl: selectors$1.nextSlide
				},
				on: {
					beforeSlideChangeStart: function (slider) {
						if (slider && slider.zoom && typeof slider.zoom.out === "function") {
							slider.zoom.out();
						}
					},
					slideChange: function (swiper) {
						pauseAllVideos(slides);
						disableTabulationOnNotActiveSlidesWithModel(swiper);
					}
				}
			});
		}

		/**
		 * Pause videos in zoom slider
		 * @param {Array} slides,
		 */
		function pauseAllVideos(slides) {
			const videoSlides = slides.filter((slide) => slide.video);
			if (!videoSlides.length) {
				return;
			}

			videoSlides.forEach(({ video }) => {
				if (VIDEO_TYPES.youtube === video.type) {
					video.player.pauseVideo();
				} else {
					video.player.pause();
				}
			});
		}

		/**
		 * Zoom modal trigger click handler.
		 * @param {Event} event,
		 * @param {Object} container
		 */
		function onTriggerClick(event, container) {
			const media = event.target.closest(selectors$1.media);
			if (!media || !container.media.length) {
				return;
			}

			removeLoaded(container.modalEl);

			const mediaId = media.dataset.zoomMedia;
			const index = container.slides.findIndex((slide) => slide.dataset.zoomSlide === mediaId);

			container.slider.slideTo(index, 0);
			document.querySelector(":root").style.setProperty("--page-height", ` ${window.innerHeight}px`);
			container.modal.open(container.modalEl);
			disableTabulationOnNotActiveSlidesWithModel(container.slider);
			window.themeCore.EventBus.emit("product:zoom:open");
		}

		/**
		 * Zoom modal slide click handler.
		 * @param {Event} event,
		 * @param {Object} container
		 */
		function onSlideClick(event, container) {
			const slide = event.target.closest(selectors$1.slide);
			if (!slide || isDrag) {
				isDrag = false;
				return;
			}

			container.slider.zoom.toggle();
		}

		/**
		 * Zoom button click.
		 * @param {Event} event,
		 * @param {Object} container
		 */
		function onButtonClick(event, container) {
			const button = event.target.closest(selectors$1.button);

			if (!button) {
				return;
			}

			removeLoaded(container.modalEl);

			const galleryLayout = container.el.dataset.mediaLayout;
			const productSlider = container.el.querySelector(selectors$1.productSlider);

			if (!productSlider) {
				return;
			}

			let media = null;

			switch (galleryLayout) {
				case "carousel":
					media = productSlider.querySelector(".swiper-slide-active");
					break;
				case "stacked":
					media = [...productSlider.querySelectorAll(".swiper-slide")][0];
					break;
				case "stacked_2_col":
					media = [...productSlider.querySelectorAll(".swiper-slide")][0];
					break;
				default:
					return;
			}

			if (!media || !container.media.length) {
				return;
			}

			const mediaId = media.dataset.zoomMedia || media.dataset.zoomMediaHtmlVideo;
			const index = container.slides.findIndex((slide) => slide.dataset.zoomSlide === mediaId);

			container.slider.slideTo(index, 0);
			document.querySelector(":root").style.setProperty("--page-height", ` ${window.innerHeight}px`);
			container.modal.open(container.modalEl);
			disableTabulationOnNotActiveSlidesWithModel(container.slider);
			window.themeCore.EventBus.emit("product:zoom:open");
		}

		/**
		 * After loading the media, remove icon loaded.
		 * @param {Event} event,
		 * @param {Object} container
		 */
		function removeLoaded(modal) {
			const modalMedias = modal.querySelectorAll(selectors$1.modalMedia);

			if (modalMedias.length < 1) {
				return;
			}

			modalMedias.forEach((modalMedia) => {
				if (modalMedia.classList.contains(globalClasses.loading)) {
					if (!modalMedia.complete) {
						modalMedia.addEventListener("load", () => {
							modalMedia.classList.remove(globalClasses.loading);
						});
					} else {
						modalMedia.classList.remove(globalClasses.loading);
					}
				}
			});
		}

		/**
		 * Zoom modal close handler.
		 * @param {Object} event,
		 * @param {Object} container
		 */
		function onZoomModalClose(event, container) {
			if (!event) {
				return;
			}

			container.slider.zoom.out();
			pauseAllVideos(container.slides);
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Component: Product carousel
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ProductCarousel
	 */

	var ProductCarousel = ({ config, selectors, sectionId }) => {
		const Swiper = window.themeCore.utils.Swiper;
		const extendDefaults = window.themeCore.utils.extendDefaults;

		const defaultSelectors = {
			slider: ".js-product-media-slider",
			sliderNavigationNext: ".js-product-media-slider-next",
			sliderNavigationPrev: ".js-product-media-slider-prev",
			thumbNavigationNext: ".js-product-media-thumb-next",
			thumbNavigationPrev: ".js-product-media-thumb-prev",
			sliderSlideVariantId: ".js-product-gallery-slide-variant",
			sliderThumbnails: ".js-product-media-slider-thumbnails",
			sliderPagination: ".product-media__slider-pagination",
			activeClass: ".swiper-slide-active",
			modelPoster: ".js-product-media-model-poster",
			notInitedIframe: ".js-video.js-video-youtube, .js-video:empty"
		};

		selectors = extendDefaults(defaultSelectors, selectors);

		let Slider = null;
		let Thumbnails = null;
		let initiated = false;

		function init() {
			if (initiated) {
				return Slider;
			}

			const mainSlider = document.querySelector(selectors.slider);
			const sliderThumbnails = document.querySelector(selectors.sliderThumbnails);
			let sliderAutoHeight = mainSlider.dataset.autoHeight;
			const thumbnailsPosition = sliderThumbnails.dataset.thumbnailsPosition;
			let thumbnailsDirections = "horizontal";

			if (thumbnailsPosition === "left") {
				thumbnailsDirections = "vertical";
			}

			if (thumbnailsDirections === "horizontal") {
				const designLayout = sliderThumbnails.getAttribute("data-design");

				Thumbnails = new Swiper(selectors.sliderThumbnails, {
					direction: thumbnailsDirections,
					spaceBetween: 4,
					slidesPerView: 4,
					freeMode: true,
					watchSlidesProgress: true,
					a11y: {
						slideRole: ""
					},
					threshold: 10,
					breakpoints: {
						414: {
							slidesPerView: designLayout === "alternate" ? 4 : 4,
							spaceBetween: 4
						},
						480: {
							slidesPerView: designLayout === "alternate" ? 4 : 5,
							spaceBetween: 6
						},
						575: {
							slidesPerView: designLayout === "alternate" ? 4 : 6,
							spaceBetween: 6
						},
						768: {
							slidesPerView: designLayout === "alternate" ? 4 : 8,
							spaceBetween: 10
						},
						992: {
							slidesPerView: designLayout === "alternate" ? 4 : 5,
							spaceBetween: 10
						},
						1024: {
							slidesPerView: designLayout === "alternate" ? 4 : 5,
							spaceBetween: 10
						},
						1200: {
							slidesPerView: designLayout === "alternate" ? 4 : 6,
							spaceBetween: 10
						},
						1440: {
							slidesPerView: designLayout === "alternate" ? 4 : 7,
							spaceBetween: designLayout === "alternate" ? 10 : 12
						}
					}
				});
			} else {
				Thumbnails = new Swiper(selectors.sliderThumbnails, {
					direction: "horizontal",
					slidesPerView: 4,
					spaceBetween: 4,
					freeMode: true,
					watchSlidesProgress: true,
					threshold: 10,
					breakpoints: {
						1200: {
							direction: thumbnailsDirections,
							spaceBetween: 10
						}
					}
				});
			}

			Thumbnails.$el.on("keydown", (e) => {
				if (e.keyCode !== 13 && e.keyCode !== 32) {
					return;
				}

				const slideIndex = e.target.dataset.slideIndex;

				if (!slideIndex) return;

				Thumbnails.slideTo(slideIndex);
				Slider.slideTo(slideIndex);
			});

			let prevArrow = document.querySelector(selectors.sliderNavigationPrev);
			let nextArrow = document.querySelector(selectors.sliderNavigationNext);
			let dynamicPagination = document.querySelector(selectors.slider).getAttribute("data-dynamic-pagination");

			dynamicPagination = dynamicPagination === "true";
			sliderAutoHeight = sliderAutoHeight === "true";

			Slider = new Swiper(selectors.slider, {
				...config,
				autoHeight: sliderAutoHeight,
				navigation: {
					nextEl: nextArrow,
					prevEl: prevArrow
				},
				pagination: {
					el: selectors.sliderPagination,
					clickable: true,
					dynamicBullets: dynamicPagination
				},
				thumbs: {
					swiper: Thumbnails
				}
			});

			let thumbPrevButton = document.querySelector(selectors.thumbNavigationPrev);
			let thumbNextButton = document.querySelector(selectors.thumbNavigationNext);

			if (thumbnailsDirections === "vertical" && thumbPrevButton && thumbNextButton) {
				Slider.on("slideChange", function () {
					if (this.activeIndex === 0) {
						thumbPrevButton.setAttribute("disabled", "");
						thumbPrevButton.classList.add("swiper-button-disabled");
					} else {
						thumbPrevButton.removeAttribute("disabled");
						thumbPrevButton.classList.remove("swiper-button-disabled");
					}

					if (this.slides.length - 1 === this.activeIndex) {
						thumbNextButton.setAttribute("disabled", "");
						thumbNextButton.classList.add("swiper-button-disabled");
					} else {
						thumbNextButton.removeAttribute("disabled", "");
						thumbNextButton.classList.remove("swiper-button-disabled");
					}
				});

				thumbPrevButton.addEventListener("click", function () {
					Slider.slidePrev();
				});

				thumbNextButton.addEventListener("click", function () {
					Slider.slideNext();
				});
			}

			Slider.on("slideChange", function (swiper) {
				const activeSlide = swiper.slides[swiper.activeIndex];

				if (!activeSlide) {
					return;
				}

				swiper.allowTouchMove = !(activeSlide.hasAttribute("data-model-slide") && !activeSlide.querySelector(selectors.modelPoster));
			});

			const targetNode = document.querySelector(selectors.slider);
			const observer = new MutationObserver(() => {
				if (targetNode.querySelector(selectors.notInitedIframe)) {
					return;
				}

				disableTabulationOnNotActiveSlidesWithModel(Slider);
				observer.disconnect();
			});

			const observerOptions = {
				attributes: true,
				childList: true,
				subtree: true
			};

			observer.observe(targetNode, observerOptions);

			setEventBusListeners();
			initiated = true;
		}

		function setEventBusListeners() {
			if (!Slider) {
				return;
			}

			Slider.on("slideChange", function (swiper) {
				window.themeCore.EventBus.emit("product-slider:slide-change");
				disableTabulationOnNotActiveSlidesWithModel(swiper);
			});

			window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);
		}

		function onChangeVariant({ variant }) {
			if (!Slider) {
				return;
			}

			let variantMediaID = null;

			if (variant.featured_media) {
				variantMediaID = variant.featured_media.id;
			}

			const currentIndex = [...Slider.slides].findIndex((slide) => {
				const slideVariantIdEl = slide.querySelector(selectors.sliderSlideVariantId);

				if (!slideVariantIdEl) {
					return false;
				}

				const slideMediaId = slideVariantIdEl.getAttribute("data-media-id");

				return slideMediaId.includes(variantMediaID);
			});

			if (currentIndex === false || currentIndex === -1) {
				return;
			}

			Slider.slideTo(currentIndex);
		}

		function destroy() {
			if (Slider && initiated) {
				Slider.destroy();
				Slider = null;
			}

			if (Thumbnails && initiated) {
				Thumbnails.destroy();
				Thumbnails = null;
			}

			initiated = false;
		}

		function disableSwipe() {
			if (!Slider) {
				return;
			}

			Slider.allowTouchMove = false;
		}

		return Object.freeze({
			init,
			destroy,
			disableSwipe
		});
	};

	/**
	 * Component: Product sticky form
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ProductStickyForm
	 */
	var ProductStickyForm = (section) => {
		const on = window.themeCore.utils.on;
		const DEFAULT_HEADER_HEIGHT = 1;
		const STICKY_SCROLL_KOEFICIENT = 100;

		const selectors = {
			stickyContainer: ".js-product-sticky-container",
			headerContentWrapper: "[data-header-container]",
			headerSticky: "[data-header-sticky]",
			cssRoot: ":root"
		};

		const cssVariables = {
			headerHeightStatic: "--header-height-static"
		};

		const breakpoints = {
			afterMedium: 1200
		};

		const stickyContainers = [...section.querySelectorAll(selectors.stickyContainer)];
		const cssRoot = document.querySelector(selectors.cssRoot);

		let headerHeight = getHeaderHeight();

		let windowHeight = window.innerHeight;
		let oldScrollPosition = window.scrollY;

		function getHeaderHeight() {
			const header = document.querySelector(selectors.headerContentWrapper);

			if (!header) {
				return DEFAULT_HEADER_HEIGHT;
			}

			const isHeaderSticky = header.closest(selectors.headerSticky);

			if (!isHeaderSticky) {
				return DEFAULT_HEADER_HEIGHT;
			}

			const headerHeightStaticValue = cssRoot.style.getPropertyValue(cssVariables.headerHeightStatic);
			return headerHeightStaticValue ? parseInt(headerHeightStaticValue) : DEFAULT_HEADER_HEIGHT;
		}

		function init() {
			if (stickyContainers) {
				const smallerContainer = stickyContainers.reduce((acc, container) => (container.offsetHeight > (acc && acc.offsetHeight) ? acc : container));

				initStickyContainer(smallerContainer);
			}
		}

		function initStickyContainer(container) {
			if (!container || !section) {
				return;
			}

			container.style.top = headerHeight + "px";

			on("scroll", () => {
				onScroll(container);
			});
		}

		function onScroll(container) {
			if (window.innerWidth < breakpoints.afterMedium) {
				return;
			}

			headerHeight = getHeaderHeight();

			let containerHeight = container.getBoundingClientRect().height || 0;
			let differentHeights = windowHeight - containerHeight + headerHeight;

			setTimeout(() => {
				let currentScrollPosition = window.scrollY;

				windowHeight = window.innerHeight;
				containerHeight = container.getBoundingClientRect().height || 0;

				if (differentHeights < headerHeight) {
					if (oldScrollPosition > differentHeights) {
						section.style.top = `${windowHeight - containerHeight}px`;
					} else {
						section.style.top = `${oldScrollPosition}px`;
					}
				}

				if (currentScrollPosition > oldScrollPosition) {
					let containerTopPosition = parseInt(container.style.top.replace("px", ""));

					if (!containerTopPosition) {
						return;
					}

					if (containerTopPosition > windowHeight - containerHeight - Math.ceil(container.clientHeight / STICKY_SCROLL_KOEFICIENT)) {
						container.style.top = `${containerTopPosition - Math.ceil(container.clientHeight / STICKY_SCROLL_KOEFICIENT)}px`;
					}
				} else if (currentScrollPosition < oldScrollPosition) {
					let containerTopPosition = parseInt(container.style.top.replace("px", ""));

					if (!containerTopPosition) {
						return;
					}

					if (containerTopPosition < headerHeight) {
						container.style.top = `${containerTopPosition + Math.ceil(container.clientHeight / STICKY_SCROLL_KOEFICIENT)}px`;
					}
				}

				oldScrollPosition = window.scrollY;
			}, 0);
		}

		return Object.freeze({
			init
		});
	};

	var ProductNotifyMe = (section) => {
		const sectionId = section && section.dataset.sectionId;
		const classes = window.themeCore.utils.cssClasses;

		const selectors = {
			notifyMeButtonWrapper: ".js-notify-me-button-wrapper",
			notifyMeButton: ".js-notify-me-button",
			notifyMePopup: ".js-notify-me-popup",
			notifyMeForm: ".js-notify-me-form",
			notifyMeFormStatus: ".js-notify-me-form-status",
			notifyMeFormInputMessage: "[name='contact[message]']",
			notifyMeFormInputProductURL: "[name='contact[ProductURL]']"
		};

		const placeholders = {
			productTitle: "{{ product_title }}"
		};

		const cssClasses = {
			...classes,
			isPosted: "is-posted",
			isNotifyMeActive: "is-notify-me-popup-active"
		};

		const searchParams = {
			contactPosted: "contact_posted",
			contactProductUrl: "contact[ProductURL]",
			contactMessage: "contact[message]",
			formType: "form_type"
		};

		const Toggle = window.themeCore.utils.Toggle;
		const on = window.themeCore.utils.on;

		let notifyMeButton = null;
		let notifyMePopup = null;
		let notifyMeForm = null;
		let notifyMeFormInputMessage = null;
		let notifyMeFormInputProductURL = null;
		let notifyMePopupToggle = null;
		let notifyMeFormStatus = null;
		let notifyMeFormId = null;
		let changeVariantIsFired = false;

		function init() {
			if (!section || !sectionId) {
				return false;
			}

			notifyMeButton = section.querySelector(selectors.notifyMeButton);
			notifyMePopup = section.querySelector(selectors.notifyMePopup);
			notifyMeForm = section.querySelector(selectors.notifyMeForm);

			if (!notifyMeButton || !notifyMePopup || !notifyMeForm) {
				return false;
			}

			notifyMeFormId = notifyMeForm.id;
			notifyMeFormInputMessage = notifyMeForm.querySelector(selectors.notifyMeFormInputMessage);
			notifyMeFormInputProductURL = notifyMeForm.querySelector(selectors.notifyMeFormInputProductURL);
			notifyMeFormStatus = notifyMeForm.querySelector(selectors.notifyMeFormStatus);

			if (!notifyMeFormInputMessage || !notifyMeFormInputProductURL || !notifyMeFormStatus) {
				return;
			}

			initToggle();
			initFormStatus();
			setEventBusListeners();
		}

		function initToggle() {
			notifyMePopupToggle = Toggle({
				toggleSelector: notifyMePopup.id
			});

			notifyMePopupToggle.init();

			on("click", notifyMePopup, function (e) {
				if (e.target == this) {
					notifyMePopupToggle.close(notifyMePopup);
				}
			});

			window.themeCore.EventBus.listen(`Toggle:${notifyMePopup.id}:close`, closeNotifyMePopup);

			window.themeCore.EventBus.listen(`Toggle:${notifyMePopup.id}:open`, openNotifyMePopup);
		}

		function initFormStatus() {
			if (isCurrentFormPosted()) {
				notifyMeForm.classList.add(cssClasses.isPosted);
				notifyMePopupToggle.open(notifyMePopup);
			}
		}

		function isCurrentFormPosted() {
			return window.location.hash.includes(`#${notifyMeFormId}`) && notifyMeFormStatus.dataset.formStatus === "posted";
		}

		function closeNotifyMePopup() {
			if (isCurrentFormPosted()) {
				setTimeout(() => {
					notifyMeForm.classList.remove(cssClasses.isPosted);
					section.classList.remove(cssClasses.isNotifyMeActive);
				}, 400);

				let newUrl = new URL(window.location.href);
				newUrl.hash = "";
				// Get the current URL
				newUrl.searchParams.delete(searchParams.contactPosted);
				newUrl.searchParams.delete(searchParams.contactProductUrl);
				newUrl.searchParams.delete(searchParams.contactMessage);
				newUrl.searchParams.delete(searchParams.formType);
				window.history.replaceState({}, null, newUrl.toString());
			}
		}

		function openNotifyMePopup() {
			section.classList.add(cssClasses.isNotifyMeActive);
		}

		function setEventBusListeners() {
			window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);

			if (!changeVariantIsFired) {
				// product has only default variant
				const productElementJSON = section.querySelector("[data-js-product-json]");
				let productJSON;

				try {
					productJSON = JSON.parse(productElementJSON.innerText);
				} catch {
					productJSON = null;
				}

				if (!productJSON) {
					return;
				}

				if (productJSON.has_only_default_variant) {
					updateFormFields(productJSON.variants[0], productJSON);
					updateNotifyMeButton(productJSON.variants[0]);
				}
			}
		}

		function onChangeVariant({ variant, product }) {
			changeVariantIsFired = true;

			if (!variant || !product) {
				return false;
			}

			updateNotifyMeButton(variant);
			updateFormFields(variant, product);
		}

		function updateFormFields(variant, product) {
			const variantAvailable = variant.available;
			const variantId = variant.id;
			const productURL = product.url;
			const productTitle = product.title;

			if (variantAvailable || !variantId || !productURL || !productTitle) {
				notifyMeFormInputMessage.value = "";
				notifyMeFormInputProductURL.value = "";
				return false;
			}

			const variantURL = `${window.location.origin}${productURL}?variant=${variantId}`;
			const notifyMeMessage = notifyMeFormInputMessage.dataset.notifyMeMessage;
			notifyMeFormInputMessage.value = notifyMeMessage.replace(placeholders.productTitle, productTitle);
			notifyMeFormInputProductURL.value = variantURL;
		}

		function updateNotifyMeButton(variant) {
			const variantAvailable = variant.available;
			const notifyMeButtonWrapper = notifyMeButton.closest(selectors.notifyMeButtonWrapper);

			if (variantAvailable) {
				notifyMeButton.classList.add(cssClasses.hidden);
				notifyMeButtonWrapper && notifyMeButtonWrapper.classList.add(cssClasses.hidden);
			} else {
				notifyMeButton.classList.remove(cssClasses.hidden);
				notifyMeButtonWrapper && notifyMeButtonWrapper.classList.remove(cssClasses.hidden);
			}
		}

		return Object.freeze({
			init
		});
	};

	var ProductAskQuestion = (section) => {
		const sectionId = section && section.dataset.sectionId;

		const selectors = {
			askQuestionButton: ".js-ask-question-button",
			askQuestionPopup: ".js-ask-question-popup",
			askQuestionForm: ".js-ask-question-form",
			askQuestionFormStatus: ".js-ask-question-form-status",
			askQuestionFormInputProductURL: "[name='contact[product_url]']"
		};

		const cssClasses = {
			active: "is-active",
			isPosted: "is-posted",
			isNotifyMeActive: "is-ask-question-popup-active"
		};

		const searchParams = {
			contactPosted: "contact_posted",
			contactProductUrl: "contact[product_url]",
			contactMessage: "contact[body]",
			formType: "form_type"
		};

		const Toggle = window.themeCore.utils.Toggle;
		const on = window.themeCore.utils.on;

		let askQuestionButton = null;
		let askQuestionPopup = null;
		let askQuestionForm = null;
		let askQuestionFormInputProductURL = null;
		let askQuestionPopupToggle = null;
		let askQuestionFormStatus = null;
		let askQuestionFormId = null;
		let changeVariantIsFired = false;

		function init() {
			if (!section || !sectionId) {
				return false;
			}

			askQuestionButton = section.querySelector(selectors.askQuestionButton);
			askQuestionPopup = section.querySelector(selectors.askQuestionPopup);
			askQuestionForm = section.querySelector(selectors.askQuestionForm);

			if (!askQuestionButton || !askQuestionPopup || !askQuestionForm) {
				return false;
			}

			askQuestionFormId = askQuestionForm.id;
			askQuestionFormInputProductURL = askQuestionForm.querySelector(selectors.askQuestionFormInputProductURL);
			askQuestionFormStatus = askQuestionForm.querySelector(selectors.askQuestionFormStatus);

			if (!askQuestionFormInputProductURL || !askQuestionFormStatus) {
				return;
			}

			initToggle();
			initFormStatus();
			setEventBusListeners();
		}

		function initToggle() {
			askQuestionPopupToggle = Toggle({
				toggleSelector: askQuestionPopup.id
			});

			askQuestionPopupToggle.init();

			on("click", askQuestionPopup, function (e) {
				if (e.target == this) {
					askQuestionPopupToggle.close(askQuestionPopup);
				}
			});

			window.themeCore.EventBus.listen(`Toggle:${askQuestionPopup.id}:close`, closeAskQuestionPopup);

			window.themeCore.EventBus.listen(`Toggle:${askQuestionPopup.id}:open`, openQuestionPopup);
		}

		function initFormStatus() {
			if (isCurrentFormPosted()) {
				askQuestionForm.classList.add(cssClasses.isPosted);
				askQuestionPopupToggle.open(askQuestionPopup);
			}
		}

		function isCurrentFormPosted() {
			return window.location.hash.includes(`#${askQuestionFormId}`) && askQuestionFormStatus.dataset.formStatus === "posted";
		}

		function closeAskQuestionPopup() {
			if (isCurrentFormPosted()) {
				setTimeout(() => {
					askQuestionForm.classList.remove(cssClasses.isPosted);
					section.classList.remove(cssClasses.isNotifyMeActive);
				}, 400);

				let newUrl = new URL(window.location.href);
				newUrl.hash = "";
				// Get the current URL
				newUrl.searchParams.delete(searchParams.contactPosted);
				newUrl.searchParams.delete(searchParams.contactProductUrl);
				newUrl.searchParams.delete(searchParams.contactMessage);
				newUrl.searchParams.delete(searchParams.formType);
				window.history.replaceState({}, null, newUrl.toString());
			}
		}

		function openQuestionPopup() {
			section.classList.add(cssClasses.isNotifyMeActive);
		}

		function setEventBusListeners() {
			window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);

			if (!changeVariantIsFired) {
				// product has only default variant
				const productElementJSON = section.querySelector("[data-js-product-json]");
				let productJSON;

				try {
					productJSON = JSON.parse(productElementJSON.innerText);
				} catch {
					productJSON = null;
				}

				if (!productJSON) {
					return;
				}

				if (productJSON.has_only_default_variant) {
					updateFormFields(productJSON.variants[0], productJSON);
				}
			}
		}

		function onChangeVariant({ variant, product }) {
			changeVariantIsFired = true;

			if (!variant || !product) {
				return false;
			}

			updateFormFields(variant, product);
		}

		function updateFormFields(variant, product) {
			const variantId = variant.id;
			const productURL = product.url;

			if (!variantId || !productURL) {
				askQuestionFormInputProductURL.value = "";
				return false;
			}

			const variantURL = `${window.location.origin}${productURL}?variant=${variantId}`;
			askQuestionFormInputProductURL.value = variantURL;
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Component: Product media scroller
	 * ------------------------------------------------------------------------------
	 *
	 * @namespace ProductMediaScroller
	 */

	var ProductMediaScroller = (section) => {
		const cssClasses = window.themeCore.utils.cssClasses;

		const selectors = {
			mediaContainer: ".js-product-media-container",
			mediaItem: ".js-product-media-item",
			mediaItemVariant: ".js-product-media-item-variant",
			header: ".js-header",
			cssRoot: ":root"
		};

		const attributes = {
			enableMediaScroller: "data-enable-media-scroller",
			staticHeader: "data-static-header",
			hideOnScrollHeader: "data-hide-on-scroll-down"
		};

		const cssVariables = {
			headerHeightStatic: "--header-height-static",
			headerHeight: "--header-height"
		};

		const breakpoints = {
			afterMedium: "(min-width: 1200px)"
		};

		const sectionId = section && section.dataset.sectionId;
		const cssRoot = document.querySelector(selectors.cssRoot);
		const isAlternateDesign = document.body.classList.contains(cssClasses.designAlternate);

		let previousVariantId;

		function init() {
			if (!section) {
				return;
			}

			const mediaContainer = section.querySelector(selectors.mediaContainer);

			if (!mediaContainer) {
				return;
			}

			const enableMediaScroller = mediaContainer.hasAttribute(attributes.enableMediaScroller);

			if (!enableMediaScroller) {
				return;
			}

			setEventBusListeners();
		}

		function setEventBusListeners() {
			window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);
		}

		function onChangeVariant({ variant, variantId, firstInitialization }) {
			if (previousVariantId === variantId) {
				return;
			}

			previousVariantId = variantId;

			const isDesktop = window.matchMedia(breakpoints.afterMedium).matches;

			if (!isDesktop || firstInitialization) {
				return;
			}

			let variantMediaID = null;

			if (variant.featured_media) {
				variantMediaID = variant.featured_media.id;
			}

			const mediaContainer = section.querySelector(selectors.mediaContainer);
			const mediaItems = mediaContainer.querySelectorAll(selectors.mediaItem);

			const currentMediaItem = [...mediaItems].find((mediaItem) => {
				const mediaItemVariant = mediaItem.querySelector(selectors.mediaItemVariant);

				if (!mediaItemVariant) {
					return false;
				}

				const mediaItemId = mediaItemVariant.getAttribute("data-media-id");

				return mediaItemId.includes(variantMediaID);
			});

			if (!currentMediaItem) {
				return null;
			}

			scrollToElement(currentMediaItem);
		}

		function scrollToElement(element) {
			const sectionBoundingClientRect = section.getBoundingClientRect();
			const elementBoundingClientRect = element.getBoundingClientRect();

			const elementTopOffset = Math.round(elementBoundingClientRect.top);
			const sectionTopOffset = Math.round(sectionBoundingClientRect.top);
			const sectionBottomOffset = Math.round(sectionBoundingClientRect.bottom);
			const windowScrollY = Math.round(window.scrollY);
			const scrollOffset = isAlternateDesign ? 30 : 10;

			let scrollTo = windowScrollY + elementTopOffset - scrollOffset;

			const containerTop = windowScrollY + sectionTopOffset - scrollOffset;
			const containerBottom = windowScrollY + sectionBottomOffset + scrollOffset;

			scrollTo = Math.max(scrollTo, containerTop);

			const currentHeaderHeight = getCurrentHeaderHeight();
			const currentScrollTo = scrollTo - currentHeaderHeight;

			if (Math.abs(windowScrollY - currentScrollTo) <= 1) {
				return;
			}

			const headerHeight = getHeaderHeight(windowScrollY, scrollTo);
			scrollTo = scrollTo - headerHeight;

			scrollTo = Math.min(scrollTo, containerBottom - window.innerHeight);

			window.scrollTo({
				top: scrollTo,
				behavior: "smooth"
			});
		}

		function getCurrentHeaderHeight() {
			const header = document.querySelector(selectors.header);

			if (!header) {
				return 0;
			}

			const isHeaderStatic = header.hasAttribute(attributes.staticHeader);

			if (isHeaderStatic) {
				return 0;
			}

			const headerHeightValue = cssRoot.style.getPropertyValue(cssVariables.headerHeight);
			return headerHeightValue ? parseInt(headerHeightValue) : 0;
		}

		function getHeaderHeight(windowScrollY, scrollTo) {
			const header = document.querySelector(selectors.header);

			if (!header) {
				return 0;
			}

			const isHeaderStatic = header.hasAttribute(attributes.staticHeader);
			const isHideOnScrollHeader = header.hasAttribute(attributes.hideOnScrollHeader);
			const headerHeightStaticValue = cssRoot.style.getPropertyValue(cssVariables.headerHeightStatic);
			const headerHeightStatic = headerHeightStaticValue ? parseInt(headerHeightStaticValue) : 0;

			if (isHeaderStatic || (isHideOnScrollHeader && windowScrollY < scrollTo - headerHeightStatic)) {
				return 0;
			}

			return headerHeightStatic;
		}

		return Object.freeze({
			init
		});
	};

	/**
	 * Section: Product Section
	 * ------------------------------------------------------------------------------
	 * @namespace ProductSection
	 */

	var ProductSection = (section) => {
		const Toggle = window.themeCore.utils.Toggle;
		const isElementInViewport = window.themeCore.utils.isElementInViewport;
		const off = window.themeCore.utils.off;
		const on = window.themeCore.utils.on;
		const cssClasses = window.themeCore.utils.cssClasses;

		const selectors = {
			mediaContainer: ".js-product-media-container",
			thumbnailsStacked: ".js-product-media-thumbnails-stacked",
			thumbnailsSlide: ".js-product-media-thumbnails-slide",
			slide: ".js-product-gallery-slide",
			modelButton: ".js-product-media-model-button",
			modelPoster: ".js-product-media-model-poster",
			modelContent: ".js-product-media-model-content"
		};

		const sectionId = section && section.dataset.sectionId;

		const carouselSelectors = {
			slider: `.js-product-media-slider-${sectionId}`,
			sliderNavigationNext: `.js-product-media-slider-next-${sectionId}`,
			sliderNavigationPrev: `.js-product-media-slider-prev-${sectionId}`,
			thumbNavigationNext: `.js-product-media-thumb-next-${sectionId}`,
			thumbNavigationPrev: `.js-product-media-thumb-prev-${sectionId}`,
			sliderSlideVariantId: `.js-product-gallery-slide-variant-${sectionId}`,
			sliderThumbnails: `.js-product-media-slider-thumbnails-${sectionId}`,
			sliderPagination: `.product-media__slider-pagination-${sectionId}`
		};

		const mediaContainerClasses = {
			stacked: "product-media--layout-stacked",
			stacked_2_col: "product-media--layout-stacked_2_col",
			slider: "product-media--layout-carousel"
		};

		const drawersSelectors = {
			sizeGuideDrawer: `productSizeGuideDrawer-${sectionId}`,
			descriptionDrawer: `descriptionDrawer-${sectionId}`,
			shippingAndReturnsDrawer: `shippingAndReturnsDrawer-${sectionId}`,
			customDrawer1: `CustomDrawer-1-${sectionId}`
		};

		let Carousel = null;

		function init() {
			const ProductZoom = Zoom(section);
			Carousel = ProductCarousel({
				selectors: carouselSelectors,
				sectionId
			});
			const productStickyForms = ProductStickyForm(section);

			ProductZoom.init();
			productStickyForms.init();
			initCarousel();
			setDrawers();
			initModelButtons();
			initNotifyMe();
			initAskQuestion();
			setEventBusListeners();

			const productHandle = section.dataset.productHandle;

			if (!productHandle) {
				return;
			}

			let recentlyViewed = localStorage.getItem("theme_recently_viewed");

			if (recentlyViewed) {
				try {
					recentlyViewed = JSON.parse(recentlyViewed);
					recentlyViewed = [...new Set([...recentlyViewed, productHandle])];
					recentlyViewed = recentlyViewed.slice(-11);
					localStorage.setItem("theme_recently_viewed", JSON.stringify(recentlyViewed));
				} catch (e) {
					// eslint-disable-next-line no-console
					console.log(e);
				} finally {
					// eslint-disable-next-line no-unsafe-finally
					return;
				}
			}

			localStorage.setItem("theme_recently_viewed", `["${productHandle}"]`);
		}

		function setEventBusListeners() {
			// need update "sizeGuideDrawer" after options change, because options re-render
			window.themeCore.EventBus.listen(`form:${sectionId}:change-variant`, function () {
				setToggleDrawer(drawersSelectors.sizeGuideDrawer, { hasFullWidth: true });
			});
		}

		function initCarousel() {
			const mediaContainer = section.querySelector(selectors.mediaContainer);

			if (!mediaContainer) {
				return;
			}

			const mediaLayout = mediaContainer.dataset.mediaLayout;

			if (!mediaLayout) {
				return;
			}

			if (mediaLayout === "carousel") {
				Carousel.init();
			}

			if (mediaLayout === "stacked" || mediaLayout === "stacked_2_col") {
				updateMedia();

				on("scroll", document, onScroll);

				activeDragThumbnail();

				on("resize", updateMedia);

				ProductMediaScroller(section).init();
			}
		}

		function updateMedia() {
			const mediaContainer = section.querySelector(selectors.mediaContainer);

			if (!mediaContainer) {
				return;
			}

			const mediaLayout = mediaContainer.dataset.mediaLayout;
			let stackedClass = mediaContainerClasses.stacked;

			if (mediaLayout === "stacked_2_col") {
				stackedClass = mediaContainerClasses.stacked_2_col;
			}

			if (window.innerWidth > 1199) {
				Carousel.destroy();
				mediaContainer.classList.add(stackedClass);
				mediaContainer.classList.remove(mediaContainerClasses.slider);
			} else {
				Carousel.init();
				mediaContainer.classList.add(mediaContainerClasses.slider);
				mediaContainer.classList.remove(stackedClass);
			}
		}

		function onScroll() {
			off("scroll", document, onScroll);

			const mediaContainer = section.querySelector(selectors.mediaContainer);
			const thumbnailsStacked = section.querySelector(selectors.thumbnailsStacked);

			if (!mediaContainer || !thumbnailsStacked) {
				return;
			}

			const slides = [...mediaContainer.querySelectorAll(selectors.slide)];

			slides.forEach((slide) => {
				setTimeout(() => {
					if (isElementInViewport(slide, thumbnailsStacked, 200)) {
						const thumbnails = [...thumbnailsStacked.querySelectorAll(selectors.thumbnailsSlide)];

						thumbnails.forEach((thumbnail) => {
							thumbnail.classList.remove(cssClasses.active);
						});

						const currentThumbnail = thumbnails.find((thumbnail) => thumbnail.dataset.mediaId === slide.dataset.mediaId);

						if (currentThumbnail) {
							currentThumbnail.classList.add(cssClasses.active);

							const offsetTopThumbnail = currentThumbnail.offsetTop;
							const offsetHeightContainer = thumbnailsStacked.offsetHeight / 2;
							const offsetHeightThumbnail = currentThumbnail.offsetHeight / 2;
							const scroll = offsetTopThumbnail - offsetHeightContainer + offsetHeightThumbnail;

							thumbnailsStacked.scroll(0, scroll);
						}
					}
					on("scroll", document, onScroll);
				}, 700);
			});
		}

		function activeDragThumbnail() {
			const thumbnail = section.querySelector(selectors.thumbnailsStacked);

			if (!thumbnail) {
				return;
			}

			let pos = { top: 0, left: 0, x: 0, y: 0 };
			let isDrag = false;

			const mouseDownHandler = function (e) {
				// Change the cursor and prevent user from selecting the text
				thumbnail.style.cursor = "grabbing";
				thumbnail.style.userSelect = "none";
				thumbnail.style.scrollBehavior = "auto";

				pos = {
					left: thumbnail.scrollLeft,
					top: thumbnail.scrollTop,
					// Get the current mouse position
					x: e.clientX,
					y: e.clientY
				};

				on("mousemove", document, mouseMoveHandler);
				on("mouseup", document, mouseUpHandler);
			};

			const mouseMoveHandler = function (e) {
				// How far the mouse has been moved
				const dx = e.clientX - pos.x;
				const dy = e.clientY - pos.y;

				isDrag = Boolean(dx + dy);

				// Scroll the element
				thumbnail.scrollTop = pos.top - dy;
				thumbnail.scrollLeft = pos.left - dx;
			};

			const mouseUpHandler = function () {
				const anchors = [...thumbnail.querySelectorAll("a")];

				if (anchors && isDrag) {
					const preventDefault = (e) => {
						e.preventDefault();

						anchors.forEach((anchor) => {
							off("click", anchor, preventDefault);
						});

						isDrag = false;
					};

					anchors.forEach((anchor) => {
						on("click", anchor, preventDefault);
					});
				}

				document.removeEventListener("mousemove", mouseMoveHandler);
				document.removeEventListener("mouseup", mouseUpHandler);

				thumbnail.style.cursor = "grab";
				thumbnail.style.removeProperty("user-select");
				thumbnail.style.scrollBehavior = "smooth";
			};

			on("mousedown", thumbnail, mouseDownHandler);
		}

		function setDrawers() {
			try {
				setToggleDrawer(drawersSelectors.sizeGuideDrawer, { hasFullWidth: true });
				setToggleDrawer(drawersSelectors.descriptionDrawer);
				setToggleDrawer(drawersSelectors.shippingAndReturnsDrawer);
				setToggleDrawer(drawersSelectors.customDrawer1);
			} catch (e) {
			}
		}

		function setToggleDrawer(selector, options = {}) {
			const toggleButton = document.querySelector(`[data-js-toggle="${selector}"]`);

			if (!toggleButton) {
				return;
			}

			const ToggleDrawer = Toggle({
				toggleSelector: selector,
				...options
			});

			ToggleDrawer.init();
		}

		function initModelButtons() {
			const modelButtons = [...section.querySelectorAll(selectors.modelButton)];

			if (!modelButtons.length) {
				return;
			}

			section.addEventListener("click", (event) => {
				const button = event.target.closest(selectors.modelButton);

				if (!button) {
					return;
				}

				const container = button.parentElement;
				const poster = container.querySelector(selectors.modelPoster);
				const content = container.querySelector(selectors.modelContent);

				if (!poster || !content) {
					return;
				}

				poster.remove();
				button.remove();
				content.classList.remove(cssClasses.hidden);
				Carousel.disableSwipe();
			});
		}

		function initNotifyMe() {
			const productNotifyMe = ProductNotifyMe(section);
			productNotifyMe.init();
		}

		function initAskQuestion() {
			const productAskQuestion = ProductAskQuestion(section);
			productAskQuestion.init();
		}

		return Object.freeze({
			init
		});
	};

	const selectors = {
		section: '[data-section-type="product"]',
		productAvailabilityToggleSelector: "[data-js-toggle-selector]",
		mediaContainer: ".js-product-media-container",
		video: ".js-video",
		slide: ".js-product-gallery-slide",
		paused: ".js-paused-video",
		placeholder: ".js-product-gallery-video-placeholder"
	};
	const videos = [];
	let sections;
	let ProductForms;
	let Toggle;
	let Video;
	let cssClasses;

	async function init(sectionId) {
		Video = await window.themeCore.utils.getExternalUtil("Video");
		Toggle = window.themeCore.utils.Toggle;
		cssClasses = {
			...window.themeCore.utils.cssClasses,
			pausedVideo: "is-paused-video"
		};
		sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
		ProductForms = ProductForm();
		sections.forEach(initSection);
		ProductForms.init();
		initVideos();
		setEventBusListeners();
		window.themeCore.EventBus.emit("product:loaded");
	}

	function initSection(section) {
		const productSection = ProductSection(section);

		window.themeCore.EventBus.listen(`pickup-availability-drawer:productAvailability-pickup-availability__${section.dataset.sectionId}:loaded`, () => {
			const productAvailabilityToggles = [...document.querySelectorAll(selectors.productAvailabilityToggleSelector)];
			const productAvailabilityToggle = productAvailabilityToggles.find((toggle) => {
				return toggle.dataset.jsToggle === `productAvailability-pickup-availability__${section.dataset.sectionId}`;
			});

			const productAvailability = Toggle({
				toggleSelector: productAvailabilityToggle.dataset.target
			});

			productAvailability.init();
		});

		window.setTimeout(() => {
			handlerPauseVideo(section);
		}, 0);

		productSection.init();
	}

	function handlerPauseVideo(section) {
		const mediaContainer = section.querySelector(selectors.mediaContainer);

		if (!mediaContainer) {
			return;
		}

		mediaContainer.addEventListener("click", (event) => {
			const paused = event.target.closest(selectors.paused);

			if (!paused || !paused.classList.contains(cssClasses.pausedVideo)) {
				return;
			}
			const placeholder = paused.querySelector(selectors.placeholder);
			const videoEl = paused.querySelector(selectors.video);

			pauseVideos(videoEl);

			if (placeholder) {
				paused.classList.remove(cssClasses.pausedVideo);
				placeholder.classList.add(cssClasses.hidden);

				videos.forEach(({ player, videoWrapper, type }) => {
					if (videoWrapper === videoEl) {
						playVideo(player, type);
					}
				});
			}
		});
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

	function pauseVideos(currentVideo) {
		videos.forEach(({ player, videoWrapper }) => {
			if (videoWrapper === currentVideo) {
				return;
			}

			try {
				player.pauseVideo();
			} catch (e) {}

			try {
				player.pause();
			} catch (e) {}
		});
	}

	function setEventBusListeners() {
		window.themeCore.EventBus.listen("product-slider:slide-change", pauseVideos);
		window.themeCore.EventBus.listen("product:zoom:open", pauseVideos);
	}

	function initVideos() {
		const slides = [...document.querySelectorAll(selectors.slide)];

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

	var Product = () => {
		return Object.freeze({
			init
		});
	};

	/**
	 * Template: Product
	 * ------------------------------------------------------------------------------
	 * @namespace Product
	 */

	const action = () => {
		window.themeCore.Product = window.themeCore.Product || Product();
		window.themeCore.utils.register(window.themeCore.Product, "product-template");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
