(function () {
	'use strict';

	const selectors = {
		sections: ".js-events-calendar",
		eventsItem: ".js-events-calendar-item",
		loadMoreButton: ".js-events-calendar-load-more"
	};

	var EventsCalendar = () => {
		const cssClasses = window.themeCore.utils.cssClasses;

		function init(sectionId) {
			const sections = [...document.querySelectorAll(selectors.sections)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));

			sections.forEach(async (section) => {
				const loadMoreButton = section.querySelector(selectors.loadMoreButton);
				const events = section.querySelectorAll(selectors.eventsItem);

				if (!loadMoreButton || !events.length) {
					return;
				}

				loadMoreButton.addEventListener("click", (event) => {
					if (!event.target.closest(selectors.loadMoreButton)) {
						return;
					}

					let loadMoreButton = event.target.closest(selectors.loadMoreButton);

					loadMoreButton.classList.add(cssClasses.hidden);

					events.forEach((event) => {
						event.classList.remove(cssClasses.hidden);
					});

					const firstEvent = events[0];

					firstEvent.setAttribute("tabindex", "-1");
					firstEvent.focus();
				});
			});
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.EventsCalendar = window.themeCore.EventsCalendar || EventsCalendar();

		window.themeCore.utils.register(window.themeCore.EventsCalendar, "events-calendar");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
