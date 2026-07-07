(function () {
	'use strict';

	var CartNotification = () => {
		let cssClasses;
		let on;
		let trapFocus;
		let formatMoney;
		let classes;

		const selectors = {
			component: ".js-cart-notification",
			content: ".js-cart-notification-content",
			close: "[data-notification-close]",
			modal: ".js-cart-notification-modal"
		};
		let component = null;
		let content = null;
		let modal = null;
		let isOpen = false;
		let isAlternateDesign = false;

		function init() {
			cssClasses = window.themeCore.utils.cssClasses;
			on = window.themeCore.utils.on;
			trapFocus = window.themeCore.utils.trapFocus;
			formatMoney = window.themeCore.utils.formatMoney;

			classes = {
				...cssClasses
			};

			isAlternateDesign = document.body.classList.contains(classes.designAlternate);

			component = document.querySelector(selectors.component);
			if (!component) {
				return;
			}

			content = component.querySelector(selectors.content);
			modal = component.querySelector(selectors.modal);

			initEventListeners();
		}

		function showNotification() {
			if (!component) {
				return;
			}

			modal.focus();
			trapFocus(modal);

			component.classList.add(classes.active);
			isOpen = true;
		}

		function hideNotification() {
			if (!component) {
				return;
			}

			component.classList.remove(classes.active);
			isOpen = false;
		}

		function addNotification(html) {
			if (!content || !html) {
				return false;
			}

			content.innerHTML = html;

			return true;
		}

		function isNotificationShowed() {
			return isOpen;
		}

		function initEventListeners() {
			on("click", component, onCloseButtonClick);
			on("click", onBodyClick);

			window.themeCore.EventBus.listen("cart:updated", onCartUpdated);
		}

		function addedItemsDOM(items) {
			if (!items || !items.length) {
				return null;
			}

			const totalPrice = items.reduce((sum, item) => sum + item.final_line_price, 0);
			const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

			const itemsDOM = items
				.map((item) => {
					const link = item.url;
					const title = item.product_title;

					let imageURL, image, image2X, imageFocal;

					if (item.image || window.themeCore.productPlaceholderImage) {
						imageURL = new URL(item.image || window.themeCore.productPlaceholderImage);

						imageURL.searchParams.set("width", "70");
						image = imageURL.href;

						imageURL.searchParams.set("width", "140");
						image2X = imageURL.href;

						if (!item.image && window.themeCore.productPlaceholderImageFocal) {
							imageFocal = `--img-desktop-pos: ${window.themeCore.productPlaceholderImageFocal}`;
						}
					}

					const priceDOM = cartItemPriceDOM(item);
					const blockItemClass = isAlternateDesign ? "cart-notification-item-new" : "cart-notification-item";

					return `
				<div class="${blockItemClass}">
					<a href="${link}" class="focus-visible-outline ${blockItemClass}__media">
						<div class="${blockItemClass}__image-wrapper">
							${
								item.image || window.themeCore.productPlaceholderImage
									? `<img
										class="${blockItemClass}__image"
										srcset="${image} 1x, ${image2X} 2x"
										src="${image}"
										alt="${title}"
										${imageFocal ? `style="${imageFocal}"` : ""}
									/>`
									: ""
							}
						</div>
					</a>

					<div class="${blockItemClass}__info">
						<div class="${blockItemClass}__details">
							<a href="${link}" class="focus-visible-outline ${blockItemClass}__title">
								${title}
							</a>

							<div class="${blockItemClass}__price">
								${priceDOM}
							</div>
						</div>
					</div>
				</div>
			`;
				})
				.join("");

			const blockSummaryClass = isAlternateDesign ? "cart-notification-summary-new" : "cart-notification-summary";
			const summaryDOM = `
			<div class="${blockSummaryClass}">
				<div class="${blockSummaryClass}__row ${blockSummaryClass}__row--light">
					<span class="${blockSummaryClass}__label">
						${window.themeCore.translations.get(`layout.cart.items_count.${totalCount > 1 ? "other" : "one"}`)}
					</span>

					<span class="${blockSummaryClass}__value">
						${totalCount}
					</span>
				</div>

				<div class="${blockSummaryClass}__row">
					<span class="${blockSummaryClass}__label">
						${window.themeCore.translations.get("cart.general.subtotal")}
					</span>

					<span class="${blockSummaryClass}__value">
						${formatMoney(totalPrice, window.themeCore.objects.shop.money_format)}
					</span>
				</div>
			</div>
		`;

			return `
			<div class="cart-notification-items">
				${itemsDOM}
			</div>

			${summaryDOM}
		`;
		}

		function cartItemPriceDOM(item) {
			if (!item) {
				return null;
			}

			const price = item.final_price;
			const comparedPrice = item.original_line_price / item.quantity;

			return `
			<div class="price ${price < comparedPrice ? "price--on-sale" : ""}">
				<div class="price__container">
					<div class="price__sale">
						<span class="visually-hidden">
							${window.themeCore.translations.get("products.product.price.sale_price")}
						</span>

						<span class="price-item price-item--sale">
							${formatMoney(price, window.themeCore.objects.shop.money_format)}
						</span>

						${
							price !== comparedPrice
								? `
							<span class="visually-hidden">
								${window.themeCore.translations.get("products.product.price.regular_price")}
							</span>

							<span>
								<span class="price-item price-item--regular">
									${formatMoney(comparedPrice, window.themeCore.objects.shop.money_format)}
								</span>
							</span>
						`
								: ""
						}
					</div>

					<div class="price__regular">
						<span class="visually-hidden">
							${window.themeCore.translations.get("products.product.price.regular_price")}
						</span>

						<span class="price-item price-item--regular">
							${formatMoney(price, window.themeCore.objects.shop.money_format)}
						</span>
					</div>

					${
						item.unit_price_measurement
							? `
						<div class="unit-price">
							<span class="visually-hidden">
								${window.themeCore.translations.get("products.product.price.unit_price")}
							</span>

							<span class="price-item price-item--last">
								<span>
									${formatMoney(item.unit_price, window.themeCore.objects.shop.money_format)}
								</span>

								<span aria-hidden="true">/</span>

								<span class="visually-hidden">&nbsp;
									${window.themeCore.translations.get("general.accessibility.unit_price_separator")}&nbsp;
								</span>

								<span>
									${
										item.reference_value !== 1
											? `
										${item.unit_price_measurement.reference_value}
									`
											: ""
									}

									${item.unit_price_measurement.reference_unit}
								</span>
							</span>
						</div>
					`
							: ""
					}
				</div>
			</div>
		`;
		}

		function onCloseButtonClick(event) {
			const close = event.target.closest(selectors.close);
			if (!close) {
				return;
			}

			event.preventDefault();

			hideNotification();
		}

		function onBodyClick(event) {
			const target = event.target;
			if (target !== modal && !target.closest(selectors.modal)) {
				hideNotification();
			}
		}

		function onCartUpdated(data) {
			if (!data || !data.action) {
				return;
			}

			let content = null;
			let updates = [];
			let items = [];

			switch (data.action) {
				case window.themeCore.CartApi.actions.ADD_TO_CART:
				case window.themeCore.CartApi.actions.ADD_TO_CART_MANY:
					updates = data.params
						.filter((param) => {
							if (param.hasOwnProperty("id") && param.hasOwnProperty("quantity")) {
								return true;
							}

							if (Array.isArray(param)) {
								return param.every((paramItem) => paramItem.hasOwnProperty("id") && paramItem.hasOwnProperty("quantity"));
							}
						})
						.flatMap((param) => param);

					items = data.items.map((item) => {
						const finalQuantity = item.quantity;
						const updatedData = updates.find((updated) => updated.id === item.id);
						if (updatedData) {
							item.quantity = updatedData.quantity;
							item.final_line_price = (item.final_line_price / finalQuantity) * item.quantity;
							item.original_line_price = (item.original_line_price / finalQuantity) * item.quantity;
							item.line_price = (item.line_price / finalQuantity) * item.quantity;
						}

						return item;
					});

					content = addedItemsDOM(items);
					break;
			}

			if (content) {
				addNotification(content);
				showNotification();
			}
		}

		return Object.freeze({
			init,
			open: showNotification,
			close: hideNotification,
			addNotification,
			isOpen: isNotificationShowed
		});
	};

	const action = () => {
		window.themeCore.CartNotification = window.themeCore.CartNotification || CartNotification();
		window.themeCore.utils.register(window.themeCore.CartNotification, "cart-notification");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
