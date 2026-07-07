(function () {
	'use strict';

	/**
	 * Component: CartReminder
	 * ------------------------------------------------------------------------------
	 * A feature that adds a reminder that the user has items in the cart
	 *
	 * @namespace CartReminder
	 */

	const classes = {
		cartReminder: "cart-reminder",
		cartReminderNew: "cart-reminder-new",
		closeButton: "cart-reminder__close-button",
		content: "cart-reminder__content",
		text: "cart-reminder__text",
		outline: "focus-visible-outline"
	};

	/**
	 * Create a new CartReminder instance.
	 * @param {Object} config - CartReminder settings.
	 */
	var CartReminder = (config) => {
		const setCookie = window.themeCore.utils.setCookie;
		const getCookie = window.themeCore.utils.getCookie;
		const cssClasses = window.themeCore.utils.cssClasses;
		const deleteCookie = window.themeCore.utils.deleteCookie;
		const on = window.themeCore.utils.on;

		const body = document.querySelector("body");
		const isAlternateDesign = body.classList.contains(cssClasses.designAlternate);

		let cartReminder = null;
		let timeout = null;
		let closeTimeout;

		let cookieTimeMinutes = config.cookieTime;
		let cookieTime = cookieTimeMinutes * 60 * 1000;

		if (config.displayFrequency === "one_time") {
			closeTimeout = 24 * 60 * 60 * 1000;
		} else {
			closeTimeout = cookieTime;
		}

		let cookieExpires = new Date().setTime(new Date().getTime() + cookieTime);
		let closeCookieExpires = new Date().setTime(new Date().getTime() + closeTimeout);

		const strings = {
			CART_TYPE_DRAWER: "drawer"
		};

		/**
		 * Initialise
		 */
		function init() {
			checkCart();
			setEventListeners();
		}

		function checkCart() {
			window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART, { noOpen: true });
		}

		function setTimerTimeout() {
			if (getCookie("cart_reminder")) {
				timeout = +getCookie("cart_reminder") - new Date().getTime();
			} else {
				timeout = null;
			}
		}

		function setEventListeners() {
			window.themeCore.EventBus.listen("cart:updated", (event) => {
				if (!getCookie("cart_reminder_closed")) {
					onCartUpdated(event);
				}
			});

			window.themeCore.EventBus.listen("cart-reminder:added", () => {
				cartReminder = document.querySelector(`.${isAlternateDesign ? classes.cartReminderNew : classes.cartReminder}`);

				if (!cartReminder) {
					return;
				}

				let cartReminderCloseButton = cartReminder.querySelector(`.${classes.closeButton}`);
				let cartReminderButton = cartReminder.querySelector(`.${classes.content}`);

				on("click", cartReminderButton, () => {
					window.themeCore.EventBus.emit("cart:drawer:open");
					setCookieOnClose();
					removePopupFromDOM();
				});

				on("click", cartReminderCloseButton, () => {
					setCookieOnClose();
					removePopupFromDOM();
				});
			});
		}

		function setCookieTime() {
			cookieExpires = new Date().setTime(new Date().getTime() + cookieTime);

			setCookie("cart_reminder", cookieExpires, {
				expires: new Date(cookieExpires)
			});
		}

		function setCookieOnClose() {
			closeCookieExpires = new Date().setTime(new Date().getTime() + closeTimeout);

			setCookie("cart_reminder_closed", "1", {
				expires: new Date(closeCookieExpires)
			});
		}

		function onCartUpdated(event) {
			if (event.item_count > 0) {
				if (!getCookie("cart_reminder")) {
					setCookieTime();
				}

				setTimerTimeout();

				if (timeout) {
					setTimeout(() => {
						insertPopupToDOM();
					}, timeout);
				}
			} else {
				deleteCookie("cart_reminder");
				removePopupFromDOM();
			}
		}

		function DOMCartReminder() {
			const DOMContent = config.cartType === strings.CART_TYPE_DRAWER ? DOMContentWithCartDrawer() : DOMContentWithCartPage();

			return `
			<div
				class="${isAlternateDesign ? classes.cartReminderNew : classes.cartReminder}"
				style="
					--cart-reminder-color-text: ${config.colorText};
					--cart-reminder-color-bg: ${config.colorBg};
				"
			>
				<button
					class="${classes.closeButton} ${classes.outline}"
					aria-label="${config.closeButtonA11y}"
					type="button"
					data-cart-reminder-close
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
					</svg>
				</button>

				${DOMContent}
			</div>
		`;
		}

		function DOMContentWithCartDrawer() {
			return `
			<button
				type="button"
				class="${classes.content} ${classes.outline}"
				data-target="CartDrawer"
				data-js-toggle="CartDrawer"
				aria-expanded="false"
				aria-controls="CartDrawer"
				aria-label="${config.cartButtonA11y}"
			>
				<span class="${classes.text} ${isAlternateDesign ? "h4" : ""}">
					${config.text}
				</span>
			</button>
		`;
		}

		function DOMContentWithCartPage() {
			return `
			<a
				href="${config.cartRoute}"
				class="${classes.content} ${classes.outline}"
				aria-label="${config.cartLinkA11y}"
			>
				<span class="${classes.text} ${isAlternateDesign ? "h4" : ""}">
					${config.text}
				</span>
			</a>
		`;
		}

		function insertPopupToDOM() {
			if (cartReminder) {
				removePopupFromDOM();
			}

			body.insertAdjacentHTML("afterbegin", DOMCartReminder());

			window.themeCore.EventBus.emit("cart-reminder:added");
		}

		function removePopupFromDOM() {
			if (cartReminder) {
				cartReminder.remove();
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
		if (!window.themeCore || !window.themeCore.CartReminder || window.themeCore.CartReminder.initiated) {
			return;
		}

		CartReminder(window.themeCore.CartReminder.config).init();
		window.themeCore.CartReminder.initiated = true;
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
