(function () {
	'use strict';

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

	const action = () => {
		window.themeCore.ProductCountDownTimer = window.themeCore.ProductCountDownTimer || ProductCountDownTimer();

		window.themeCore.utils.register(window.themeCore.ProductCountDownTimer, "product-countdown-timer");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
