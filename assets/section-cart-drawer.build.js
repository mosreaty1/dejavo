(function () {
	'use strict';

	var Cart = () => {
		const Toggle = window.themeCore.utils.Toggle;
		const cssClasses = window.themeCore.utils.cssClasses;
		const formToJSON = window.themeCore.utils.formToJSON;
		const on = window.themeCore.utils.on;
		const QuantityWidget = window.themeCore.utils.QuantityWidget;
		const UpsellSlider = window.themeCore.utils.UpsellSlider;
		const Preloder = window.themeCore.utils.Preloder;
		const shop_currency_rate = window.Shopify.currency.rate || 1;
		const moneyFormat = window.themeCore.objects.shop.money_format;

		/**
		 * DOM selectors.
		 */
		const selectors = {
			section: '[data-section-type="cart-template"]',
			sectionDrawer: '[data-section-modification="drawer"]',
			upsellForm: "[data-cart-upsell]",
			container: ".js-cart-container",
			content: ".js-cart-content",
			buttonsContent: ".js-cart-footer-button",
			additionalButtons: ".js-cart-footer-additional-buttons",
			checkoutButtons: ".js-cart-footer-checkout",
			cartItem: "[data-cart-item]",
			quantity: ".js-quantity",
			termsAndConditionsCheckbox: ".js-terms-and-conditions-checkbox",
			quantityError: ".js-cart-item-error-message",
			remove: ".js-cart-item-remove",
			closeButton: ".js-cart-close-button",
			cartNoteField: ".js-cart-notes-field",
			cartDrawerNoteControlText: ".js-cart-drawer-note-control-text",
			cartFooterButtonMessage: ".js-cart-footer-button-message",
			discountAccordionContainer: ".js-cart-discount-accordion-container",
			accordionItem: ".js-accordion-item",
			accordionControl: ".js-accordion-control",
			discountForm: ".js-cart-discount-form",
			discountApply: ".js-cart-discount-apply-button",
			discountPill: ".js-cart-discount-pill",
			discountRemove: ".js-cart-discount-pill-remove",
			discountError: ".js-cart-discount-error",
			discountErrorCode: ".js-cart-discount-error-code",
			discountErrorShipping: ".js-cart-discount-error-shipping"
		};

		/**
		 * CSS selectors.
		 */
		const classes = {
			...cssClasses,
			empty: "is-empty"
		};

		/**
		 * Sections.
		 */
		let sections = [];

		/**
		 * Drawer sections.
		 */
		let drawers = [];

		/**
		 * Initialise component.
		 */
		function init() {
			setupDrawers();
			setupSections();
			setupEventListeners();
			setupTermsAndConditions();

			if (window.themeCore.objects.settings.show_shipping_rates_calculator && window.Shopify) {
				initCartShippingCalculator();
			}
		}

		let hasErrors = false;

		/**
		 * Setup sections with drawers modification.
		 */
		function setupDrawers() {
			drawers = [...document.querySelectorAll(selectors.sectionDrawer)].map((section) => {
				const drawer = Toggle({
					toggleSelector: section.id,
					closeAccordionsOnHide: false
				});

				drawer.init();

				const initializedDrawer = {
					el: section,
					toggle: {
						open: () => drawer.open(section),
						close: () => drawer.close(section)
					}
				};

				setupDrawerEvents(initializedDrawer);

				return initializedDrawer;
			});
		}

		/**
		 * Setup event listeners section with drawers modification.
		 * @param {Object} drawer - drawer section.
		 */
		function setupDrawerEvents(drawer) {
			if (!drawer || !drawer.toggle) {
				return;
			}

			window.themeCore.EventBus.listen(`cart:drawer:${drawer.el.id}:open`, drawer.toggle.open);
			window.themeCore.EventBus.listen(`cart:drawer:${drawer.el.id}:close`, drawer.toggle.close);
		}

		/**
		 * Setup cart template sections.
		 */
		function setupSections() {
			sections = Array.from(document.querySelectorAll(selectors.section)).map((section) => ({
				el: section,
				id: section.dataset.sectionId,
				content: section.querySelector(selectors.content)
			}));

			sections.forEach((section) => {
				const quantityWidgets = Array.from(section.el.querySelectorAll(selectors.quantity));

				if (!quantityWidgets || !quantityWidgets.length) {
					section.quantityWidgets = [];
				} else {
					section.quantityWidgets = quantityWidgets.map((quantityEl) => {
						const widget = QuantityWidget(quantityEl, {
							onQuantityChange
						});

						return widget.init();
					});
				}

				const preloader = Preloder(section.el);
				if (preloader) {
					section.preloader = preloader.init();
				}

				const upsell = UpsellSlider(section.el);
				if (upsell) {
					section.upsell = upsell.init();
				}

				on("click", section.el, onRemoveButtonClick);
				on("submit", section.el, onUpsellFormSubmit);
				on("submit", section.el, onDiscountSubmit);
				on("click", section.el, onRemoveDiscount);
			});

			updateFreeShippingBar();
			updateMinimumOrderAmount();
			window.themeCore.LazyLoadImages.init();
		}

		/**
		 * Setup global event listeners for sections.
		 */
		function setupEventListeners() {
			window.themeCore.EventBus.listen("cart:updated", onCartUpdated);
			window.themeCore.EventBus.listen("cart:refresh", refreshSections);
			window.themeCore.EventBus.listen("cart:drawer:open", openCartDrawer);
			window.themeCore.EventBus.listen("cart:drawer:refresh-and-open", refreshAndOpenCartDrawer);
			window.themeCore.EventBus.listen("cart:drawer:close", closeCartDrawer);
			document.addEventListener("click", (event) => event.target.closest(selectors.closeButton) && window.themeCore.EventBus.emit("cart:drawer:close"));
			document.addEventListener("change", saveCartNoteValue);
		}

		/**
		 * Save cart note value.
		 */
		async function saveCartNoteValue(event) {
			const cartNotesField = event.target.closest(selectors.cartNoteField);
			const cartNoteControlText = document.querySelector(selectors.cartDrawerNoteControlText);

			if (!cartNotesField) return;

			showPreloaders();

			try {
				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.UPDATE_CART, {
					note: cartNotesField.value
				});
			} catch (error) {
				console.log(error);
			} finally {
				hidePreloaders();

				if (cartNoteControlText) {
					if (cartNotesField.value !== "") {
						cartNoteControlText.textContent = window.themeCore.translations.get("cart.general.edit_note");
					} else {
						cartNoteControlText.textContent = window.themeCore.translations.get("cart.general.note");
					}
				}
			}
		}

		/**
		 * Get cart template sections ids.
		 * @return {Array}
		 */
		function getSectionsIds() {
			return sections.map((section) => section.id);
		}

		/**
		 * Get cart template sections DOMs.
		 * @return {Promise}
		 */
		function getCartSectionsDOMs() {
			const ids = getSectionsIds();

			const requestURL = new URL(window.location.href);
			requestURL.searchParams.set("sections", ids.join(","));
			requestURL.searchParams.set("lazyload", "false");

			return fetch(requestURL.href).then((response) => response.json());
		}

		/**
		 * Open cart drawer.
		 * @param {*} data - Payload to send to listeners.
		 */
		function openCartDrawer(data) {
			if (data && data.id) {
				window.themeCore.EventBus.emit(`cart:drawer:${data.id}:open`);
				return;
			}

			const firstAvailableCartDrawer = drawers.find((drawer) => drawer.toggle && drawer.toggle.open);
			if (firstAvailableCartDrawer) {
				firstAvailableCartDrawer.toggle.open();
			}
		}

		/**
		 * Refresh and open cart drawer.
		 * @param {*} data - Payload to send to listeners.
		 */
		function refreshAndOpenCartDrawer(data) {
			refreshSections().then(() => {
				openCartDrawer(data);
			});
		}

		/**
		 * Close cart drawer.
		 * @param {*} data - Payload to send to listeners.
		 */
		function closeCartDrawer(data) {
			if (data && data.id) {
				window.themeCore.EventBus.emit(`cart:drawer:${data.id}:close`);
				return;
			}

			drawers.forEach((drawer) => {
				if (drawer.toggle && drawer.toggle.close) {
					drawer.toggle.close();
				}
			});
		}

		/**
		 * Show preloaders in cart template sections.
		 */
		function showPreloaders() {
			sections.forEach((section) => {
				if (section.preloader) {
					section.preloader.show();
				}
			});
		}

		/**
		 * Hide preloaders in cart template sections.
		 */
		function hidePreloaders() {
			sections.forEach((section) => {
				if (section.preloader) {
					section.preloader.hide();
				}
			});
		}

		/**
		 * Refresh cart template sections.
		 * @param {Object} sectionsResource - Sections DOMs.
		 * @returns {Promise}
		 */
		async function refreshSections(sectionsResource = null) {
			const resource = !(sectionsResource && Object.keys(sectionsResource).length === 0 && Object.getPrototypeOf(sectionsResource) === Object.prototype)
				? await getCartSectionsDOMs()
				: sectionsResource;

			if (!resource) {
				return false;
			}

			sections.map((section) => {
				const template = new DOMParser().parseFromString(resource[section.id], "text/html");

				const updatedSection = template.querySelector(selectors.section);
				const content = template.querySelector(selectors.content);
				const buttonsContent = template.querySelector(selectors.buttonsContent);
				const additionalButtons = template.querySelector(selectors.additionalButtons);
				const cartFooterButtonMessage = template.querySelector(selectors.cartFooterButtonMessage);

				let isDiscountAccordionActive = false;
				const discountAccordionContainer = section.el.querySelector(selectors.discountAccordionContainer);

				if (discountAccordionContainer) {
					const accordionItem = discountAccordionContainer.querySelector(selectors.accordionItem);

					if (accordionItem) {
						isDiscountAccordionActive = accordionItem.classList.contains(classes.active);
					}
				}

				if (!updatedSection || !content) {
					return;
				}

				section.el.classList.toggle(classes.empty, updatedSection.classList.contains(classes.empty));

				const sectionContent = section.el.querySelector(selectors.content);

				if (!sectionContent) {
					return;
				}

				if (buttonsContent) {
					const sectionButtonsContent = section.el.querySelector(selectors.buttonsContent);

					if (sectionButtonsContent && sectionButtonsContent.innerHTML !== buttonsContent.innerHTML) {
						sectionButtonsContent.innerHTML = buttonsContent.innerHTML;
					}
				}

				if (cartFooterButtonMessage) {
					const sectionCartFooterButtonMessage = section.el.querySelector(selectors.cartFooterButtonMessage);

					if (sectionCartFooterButtonMessage && sectionCartFooterButtonMessage.outerHTML !== cartFooterButtonMessage.outerHTML) {
						const dataCartFooterButtonMessage = cartFooterButtonMessage.getAttribute("data-cart-total");

						sectionCartFooterButtonMessage.setAttribute("data-cart-total", dataCartFooterButtonMessage);
					}
				}

				if (additionalButtons) {
					const sectionAdditionalButtons = section.el.querySelector(selectors.additionalButtons);

					if (sectionAdditionalButtons && sectionAdditionalButtons.innerHTML !== additionalButtons.innerHTML) {
						sectionAdditionalButtons.classList.toggle(classes.hidden, additionalButtons.classList.contains(classes.hidden));
					}
				}

				if (isDiscountAccordionActive) {
					const newDiscountAccordionContainer = content.querySelector(selectors.discountAccordionContainer);

					if (newDiscountAccordionContainer) {
						const accordionItem = newDiscountAccordionContainer.querySelector(selectors.accordionItem);

						accordionItem.classList.add(cssClasses.active);
						accordionItem.querySelector(selectors.accordionControl).setAttribute("aria-expanded", true);
					}
				}

				sectionContent.innerHTML = content.innerHTML;

				window.themeCore.Accordion.init();
			});

			setupSections();
			setupTermsAndConditions();
		}

		/**
		 * Emit an event in the eventBus when the quick view button is clicked.
		 * @param {String} handle - Product handle for quick view modal.
		 * @param {String} variantId - Product variant for quick view modal.
		 */
		function emitQuickViewClickEvent(handle, variantId) {
			window.themeCore.EventBus.emit("product-card:quick-view:clicked", {
				productHandle: handle,
				variant: variantId
			});
		}

		/**
		 * Add upsell product into cart.
		 * @param {String} variantId - Product variant.
		 */
		async function emitAddToCard(variantId, quantity) {
			try {
				await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, {
					id: variantId,
					quantity: quantity
				});
			} catch (error) {
				return error && error.description;
			}
		}

		/**
		 * Quantity change in quantity widget event handler.
		 * @param {Object} widget - Quantity widget instance.
		 */
		function onQuantityChange(widget) {
			if (!widget || !widget.controls || !widget.controls.input) {
				return;
			}

			showPreloaders();

			const input = widget.controls.input;
			const key = input.dataset.itemKey;
			const quantity = widget.quantity.value;

			const sectionsIds = getSectionsIds().join(",");

			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.CHANGE_CART_ITEM_QUANTITY, key, quantity, sectionsIds)
				.then(async (cart) => {
					let item = cart.items.find((item) => item.key === key);

					if (item && quantity !== item.quantity) {
						const description = window.themeCore.translations.get("cart.errors.quantity", {
							count: item.quantity,
							title: item.title
						});

						hasErrors = true;

						setTimeout(() => {
							hasErrors = false;
						}, 0);

						throw { description };
					}
				})
				.catch((error) => {
					onQuantityError(widget, error);
				})
				.finally(() => {
					hidePreloaders();
				});
		}

		/**
		 * Remove button click event handler.
		 * @param {Event} event - Click event.
		 */
		function onRemoveButtonClick(event) {
			const removeButton = event.target.closest(selectors.remove);
			if (!removeButton) {
				return;
			}

			event.preventDefault();
			showPreloaders();

			const sectionsIds = getSectionsIds().join(",");

			const key = removeButton.dataset.itemKey;
			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.REMOVE_CART_ITEM, key, sectionsIds).finally(() => {
				hidePreloaders();
			});
		}

		function getRenderedDiscounts() {
			const discountPills = [...document.querySelectorAll(selectors.discountPill)];

			return discountPills.map((pillHTML) => pillHTML.dataset.discountCode);
		}

		async function onDiscountSubmit(event) {
			const form = event.target.closest(selectors.discountForm);

			if (!form) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			showPreloaders();

			try {
				const formData = formToJSON(form);
				const discountCodeValue = formData.discount;

				const renderedDiscounts = getRenderedDiscounts();

				if (renderedDiscounts.includes(discountCodeValue)) {
					return;
				}

				const updateCartResponse = await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.UPDATE_CART, {
					discount: [...renderedDiscounts, discountCodeValue].join(",")
				});

				form.reset();

				const isDiscountError = updateCartResponse.discount_codes.find((discount) => discount.code === discountCodeValue && !discount.applicable);

				if (isDiscountError) {
					showDiscountError("discount_code");
					return;
				}

				await refreshSections();

				const newRenderedDiscountCodes = getRenderedDiscounts();

				const isShippingError =
					newRenderedDiscountCodes.length === renderedDiscounts.length &&
					newRenderedDiscountCodes.every((code) => renderedDiscounts.includes(code)) &&
					updateCartResponse.discount_codes.some((discount_code) => discount_code.code === discountCodeValue && discount_code.applicable);

				if (isShippingError) {
					showDiscountError("shipping_error");
				}
			} catch (error) {
				console.log("Error while submit discount:", error);
			} finally {
				hidePreloaders();
			}
		}

		function showDiscountError(type) {
			const rootError = document.querySelector(selectors.discountError);
			const codeError = document.querySelector(selectors.discountErrorCode);
			const shippingError = document.querySelector(selectors.discountErrorShipping);

			rootError.classList.remove(cssClasses.hidden);

			if (type === "discount_code") {
				codeError.classList.remove(cssClasses.hidden);
				shippingError.classList.add(cssClasses.hidden);
			} else if (type === "shipping_error") {
				codeError.classList.add(cssClasses.hidden);
				shippingError.classList.remove(cssClasses.hidden);
			}
		}

		async function onRemoveDiscount(event) {
			const removeButton = event.target.closest(selectors.discountRemove);

			if (!removeButton) {
				return;
			}

			const discountPill = event.target.closest(selectors.discountPill);

			if (!discountPill) {
				return;
			}

			const discountCode = discountPill.dataset.discountCode;

			if (!discountCode) {
				return;
			}

			showPreloaders();

			try {
				const renderedDiscounts = getRenderedDiscounts();
				const index = renderedDiscounts.indexOf(discountCode);

				if (index === -1) {
					return;
				}

				renderedDiscounts.splice(index, 1);

				const sectionsIds = getSectionsIds().join(",");

				await window.themeCore.CartApi.makeRequest(
					window.themeCore.CartApi.actions.UPDATE_CART,
					{
						discount: renderedDiscounts.join(",")
					},
					sectionsIds
				);
			} catch (error) {
				console.log("Error while removing discount:", error);
			} finally {
				hidePreloaders();
			}
		}

		/**
		 * Quantity error event handler.
		 * @param {Object} quantityWidget - Quantity widget instance.
		 * @param {Object} error - Error.
		 */
		function onQuantityError(quantityWidget, error) {
			if (!quantityWidget || !error) {
				return;
			}

			quantityWidget.rollbackValue();

			const cartItem = quantityWidget.widget.closest(selectors.cartItem);
			if (!cartItem) {
				return;
			}

			const errorEl = cartItem.querySelector(selectors.quantityError);
			const errorMessage = error.message || error.description;

			if (errorMessage) {
				errorEl.innerHTML = errorMessage;
			}
		}

		/**
		 * Upsell form submit event handler.
		 * @param {Event} event - Submit event.
		 */
		function onUpsellFormSubmit(event) {
			const form = event.target.closest(selectors.upsellForm);
			if (!form) {
				return;
			}

			event.preventDefault();

			const formData = formToJSON(form);
			const { id, handle, singleVariant, quantity } = formData;

			JSON.parse(singleVariant) ? emitAddToCard(id, Number(quantity)) : emitQuickViewClickEvent(handle, id);
		}

		/**
		 * Logic for checkbox 'terms and conditions'
		 */
		function setupTermsAndConditions() {
			const termsAndConditionsCheckbox = document.querySelectorAll(selectors.termsAndConditionsCheckbox);
			const cartButton = document.querySelector(selectors.checkoutButtons);
			const cartFooterButtonMessage = document.querySelector(selectors.cartFooterButtonMessage);

			termsAndConditionsCheckbox.forEach((checkbox) => {
				if (!checkbox || (cartFooterButtonMessage && cartFooterButtonMessage.classList.contains(cssClasses.disabled))) {
					return;
				}

				cartButton.disabled = !checkbox.checked;

				checkbox.addEventListener("change", () => {
					cartButton.disabled = !checkbox.checked;
				});
			});
		}

		/**
		 * Cart updated event handler.
		 * @param {Object} data
		 */
		function onCartUpdated(data) {
			let resource = null;
			if (data) {
				resource = data.sections;
			}

			if (!hasErrors) {
				refreshSections(resource).then(() => {
					const isNotificationEnable = window.themeCore.objects.settings.show_cart_notification;
					const isOpenCart = !data.params.some((param) => param.noOpen);

					if (!JSON.parse(isNotificationEnable) && isOpenCart) {
						window.themeCore.EventBus.emit("cart:drawer:open");
					}
				});
			}
		}

		function updateFreeShippingBar() {
			let freeShippingBar = document.querySelector(".js-cart-shipping");

			if (!freeShippingBar) {
				return;
			}

			let cart_total = Number(freeShippingBar.getAttribute("data-cart-total"));
			let amount_cents = freeShippingBar.getAttribute("data-amount-cents") * shop_currency_rate;
			let percentage = (cart_total / amount_cents) * 100;
			let amount_message = freeShippingBar.getAttribute("data-amount-message");
			let success_message = freeShippingBar.getAttribute("data-success-message");
			let progressBar = freeShippingBar.querySelector(".js-cart-shipping-progress-bar");
			let shippingTextEl = freeShippingBar.querySelector(".js-cart-shipping-amount-msg");
			let shippingIcon = freeShippingBar.querySelector(".js-cart-shipping-icon");
			let progressBarHiddenText = freeShippingBar.querySelector(".js-shipping-bar-progress-hidden-text");
			let progressBarMessage = window.themeCore.translations.get("cart.shipping_bar.progress").replace("{{ value }}", percentage.toFixed(1));
			freeShippingBar.style.setProperty("--shipping-bar-progress-value", percentage + "%");

			if (progressBarHiddenText) {
				progressBarHiddenText.textContent = progressBarMessage;
			}

			if (percentage < 100) {
				let remaining = amount_cents - cart_total;
				let remaining_money = window.themeCore.utils.formatMoney(remaining, moneyFormat);

				shippingTextEl.innerHTML = amount_message.replace("{amount}", `<strong>${remaining_money}</strong>`);
				progressBar.classList.remove(cssClasses.hidden);

				if (shippingIcon) {
					shippingIcon.classList.add(cssClasses.hidden);
				}
			} else {
				shippingTextEl.innerHTML = success_message;
				progressBar.classList.add(cssClasses.hidden);

				if (shippingIcon) {
					shippingIcon.classList.remove(cssClasses.hidden);
				}
			}
		}

		function updateMinimumOrderAmount() {
			const cartFooterButtonMessage = document.querySelector(selectors.cartFooterButtonMessage);

			if (!cartFooterButtonMessage) {
				return;
			}

			const additionalButtons = document.querySelector(selectors.additionalButtons);
			const checkoutButtons = document.querySelector(selectors.checkoutButtons);
			const cart_total = Number(cartFooterButtonMessage.getAttribute("data-cart-total"));
			const amount_message = cartFooterButtonMessage.getAttribute("data-amount-message");
			const success_message = cartFooterButtonMessage.getAttribute("data-success-message");
			const amount_cents = cartFooterButtonMessage.getAttribute("data-amount-cents") * shop_currency_rate;
			const percentage = (cart_total / amount_cents) * 100;

			if (percentage < 100) {
				const remaining = amount_cents - cart_total;
				const remaining_money = window.themeCore.utils.formatMoney(remaining, moneyFormat);

				additionalButtons && additionalButtons.classList.remove(cssClasses.hidden);
				cartFooterButtonMessage.classList.add(cssClasses.disabled);
				cartFooterButtonMessage.innerHTML = amount_message.replace("{{rest}}", `<strong>${remaining_money}</strong>`);
				checkoutButtons.setAttribute("disabled", "");
			} else {
				additionalButtons && additionalButtons.classList.add(cssClasses.hidden);
				cartFooterButtonMessage.classList.remove(cssClasses.disabled);
				cartFooterButtonMessage.innerHTML = success_message;
				checkoutButtons.removeAttribute("disabled");
			}
		}

		function initCartShippingCalculator() {
			new window.Shopify.CountryProvinceSelector("cart-address-country", "cart-address-province", {
				hideElement: "cart-address-province-container"
			});

			const submitRatesButton = document.querySelector(".js-get-ship-rates");
			const formElements = document.querySelectorAll(".js-ship-rate-field");
			const ratesCountry = document.getElementById("cart-address-country");
			const ratesProvince = document.getElementById("cart-address-province");
			const ratesZIP = document.getElementById("cart-address-zip");
			const responseWrapper = document.getElementById("cart-rates-wrapper");

			let shippingAddress = {
				country: "",
				province: "",
				zip: ""
			};

			formElements.forEach(function (field) {
				let eventName = "keyup";

				if (field.tagName === "SELECT") {
					eventName = "change";
				}

				field.addEventListener(eventName, () => {
					removeError(field);
				});
			});

			submitRatesButton.addEventListener("click", function (e) {
				e.preventDefault();

				submitRatesButton.setAttribute("disabled", "");

				shippingAddress.country = ratesCountry.value || "";
				shippingAddress.province = ratesProvince.value || "";
				shippingAddress.zip = ratesZIP.value || "";

				const params = `shipping_address[country]=${shippingAddress.country}&shipping_address[province]=${shippingAddress.province}&shipping_address[zip]=${shippingAddress.zip}`;
				const url = encodeURI(`${params}`);

				try {
					fetch(`/cart/prepare_shipping_rates.json?${url}`, {
						method: "POST"
					})
						.then((response) => response.text())
						.then((state) => {
							const parsedState = JSON.parse(state);

							if (typeof parsedState === "object" && parsedState !== null) {
								Object.entries(parsedState).forEach(([key, value]) => {
									const fieldElement = document.getElementById(`cart-address-${key}`);
									const errorElement = document.getElementById(`error-cart-address-${key}`);

									if (!errorElement) {
										return;
									}

									errorElement.textContent = `${value}`;
									errorElement.classList.remove(cssClasses.hidden);

									fieldElement.setAttribute("aria-invalid", "true");
									fieldElement.setAttribute("aria-describedby", `error-cart-address-${key}`);
								});

								submitRatesButton.removeAttribute("disabled");
								return;
							}

							fetch(`/cart/async_shipping_rates.json?${url}`)
								.then((response) => response.text())
								.then((responseText) => {
									const parsedResponse = JSON.parse(responseText);
									const shippingRates = parsedResponse ? parsedResponse.shipping_rates : [];

									submitRatesButton.removeAttribute("disabled");

									if (shippingRates.length > 0) {
										responseWrapper.innerHTML = "";
										const ulElement = document.createElement("ul");
										ulElement.classList.add("cart-shipping-calc__rate-list");

										shippingRates.forEach((rate) => {
											const liElement = document.createElement("li");
											ulElement.appendChild(liElement);
											const name = rate.name;
											let price = rate.price;
											const deliveryDays = rate.delivery_days;
											let estimateTime = "";

											if (price === "0.00") {
												price = window.themeCore.translations.get("cart.shipping_rates.price_free");
											} else {
												price = `${window.themeCore.utils.formatMoney(
												price.includes(".") ? price : price + ".00",
												window.themeCore.objects.shop.money_format
											)}`;
											}

											if (deliveryDays.length) {
												deliveryDays.forEach((t, i) => {
													estimateTime = i === 0 ? t : `${estimateTime}-${t}`;
												});

												estimateTime = `<span>${estimateTime} days</span>`;
											}

											liElement.innerHTML = `<span class="cart-shipping-calc__rate-name">${name}:</span> ${estimateTime} ${price}`;
										});

										responseWrapper.appendChild(ulElement);
									} else {
										responseWrapper.innerHTML = `<span class="cart-shipping-calc__no-rate">${window.themeCore.translations.get(
										"cart.shipping_rates.no_shipping"
									)}</span>`;
									}
								});
						});
				} catch (e) {
					console.log(e, "Error with shipping rates");
				}
			});

			function removeError(formField) {
				if (!formField) {
					return;
				}

				const errorType = formField.id.split("cart-address-")[1];
				const errorMessage = document.getElementById(`error-cart-address-${errorType}`);

				formField.removeAttribute("aria-invalid");
				formField.removeAttribute("aria-describedby");

				if (errorMessage) {
					errorMessage.classList.add(cssClasses.hidden);
					errorMessage.textContent = "";
				}
			}
		}

		/**
		 * Expose public interface.
		 */
		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.Cart = window.themeCore.Cart || Cart();
		window.themeCore.utils.register(window.themeCore.Cart, "cart-drawer");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
