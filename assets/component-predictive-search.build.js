(function () {
	'use strict';

	var PredictiveSearch = () => {
		const Images = window.themeCore.utils.images;
		const debounce = window.themeCore.utils.debounce;
		const formatMoney = window.themeCore.utils.formatMoney;
		const globalClasses = window.themeCore.utils.cssClasses;

		const selectors = {
			form: ".js-predictive-search-form",
			input: ".js-predictive-search-input",
			resultContainer: ".js-predictive-search-result",
			searchType: "input[name='type']",
			applyButton: ".js-predictive-search-apply-button",
			resultRow: ".js-predictive-search-result-row",
			tabsButton: ".js-predictive-search-tabs-button",
			preloader: ".js-preloader",
			searchDrawer: "#headerDrawerSearch"
		};

		const attributes = {
			disabled: "disabled",
			id: "id",
			dataId: "data-id",
			ariaExpanded: "aria-expanded",
			ariaHidden: "aria-hidden"
		};

		const classes = {
			visuallyHidden: "visually-hidden",
			...globalClasses
		};

		const SEARCH_RESULTS_COUNT = 8;
		let cachedResults = {};
		const preloader = document.querySelector(selectors.preloader);
		const locale = window.Shopify.routes.root;

		async function searchAction(event) {
			const input = event.target.closest(selectors.input);
			const searchDrawer = document.querySelector(selectors.searchDrawer);
			const resultContainer = document.querySelector(selectors.resultContainer);
			const applyButton = document.querySelector(selectors.applyButton);

			if (!searchDrawer || !input || !resultContainer || !applyButton) {
				return;
			}

			const inputValue = input.value.trim();

			if (!inputValue.length) {
				applyButton.setAttribute(attributes.disabled, attributes.disabled);
				applyButton.setAttribute(attributes.ariaHidden, "true");
				clearInnerResults(resultContainer);

				return;
			}

			initPreloader();

			if (cachedResults[inputValue]) {
				renderResult(cachedResults[inputValue].resources.results, resultContainer, applyButton);
				removePreloader();
				return;
			}

			const searchResponse = await getResult(inputValue);
			const responseJSON = await searchResponse.json();
			cachedResults[inputValue] = responseJSON;
			renderResult(responseJSON.resources.results, resultContainer, applyButton);
			removePreloader();
		}

		function initPreloader() {
			if (!preloader) {
				return;
			}

			preloader.classList.add(classes.active);
		}

		function removePreloader() {
			if (!preloader) {
				return;
			}

			preloader.classList.remove(classes.active);
		}

		function renderResult(results, resultContainer, applyButton) {
			const resultsCount = Object.values(results).filter((result) => result.length);

			clearInnerResults(resultContainer);
			applyButton.removeAttribute(attributes.disabled);
			applyButton.removeAttribute(attributes.ariaHidden);

			if (!resultsCount.length) {
				applyButton.setAttribute(attributes.disabled, attributes.disabled);
				applyButton.setAttribute(attributes.ariaHidden, "true");
				renderEmptyResult(resultContainer);

				return;
			}

			renderResultItem(results.products, results.articles, results.pages, resultContainer);
		}

		function renderResultItem(products, articles, pages, resultContainer) {
			let productsResult;
			let articlesResult;
			let pagesResult;

			if (articles || pages) {
				const searchTabs = `
					<ul class="predictive-search__tabs">
						${
							products
								? `
									<li class="predictive-search__tabs-item js-predictive-search-tabs-item">
										<button
											class="focus-visible-outline predictive-search__tabs-button ${products.length ? classes.active : ""} js-predictive-search-tabs-button"
											type="button"
											aria-controls="search-products"
											aria-expanded="true"
											aria-label="${window.themeCore.translations.get("general.predictive_search.products_aria_label")}"
											data-id="products"
											${!products.length ? "disabled" : ""}
										>
											${window.themeCore.translations.get("general.predictive_search.products")}
										</button>
									</li>
								`
								: ""
						}

						${
							articles
								? `
									<li class="predictive-search__tabs-item js-predictive-search-tabs-item">
										<button
											class="focus-visible-outline predictive-search__tabs-button ${(!products || !products.length) && articles.length ? classes.active : ""}
											js-predictive-search-tabs-button"
											type="button"
											aria-controls="search-articles"
											aria-expanded="false"
											aria-label="${window.themeCore.translations.get("general.predictive_search.articles_aria_label")}"
											data-id="articles"
											${!articles.length ? "disabled" : ""}
										>
											${window.themeCore.translations.get("general.predictive_search.articles")}
										</button>
									</li>
								`
								: ""
						}

						${
							pages
								? `
									<li class="predictive-search__tabs-item js-predictive-search-tabs-item">
										<button
											class="focus-visible-outline predictive-search__tabs-button ${(!products || !products.length) && (!articles || !articles.length) && pages.length ? classes.active : ""}
											js-predictive-search-tabs-button"
											type="button"
											aria-controls="search-pages"
											aria-expanded="false"
											aria-label="${window.themeCore.translations.get("general.predictive_search.pages_aria_label")}"
											data-id="pages"
											${!pages.length ? "disabled" : ""}
										>
											${window.themeCore.translations.get("general.predictive_search.pages")}
										</button>
									</li>
								`
								: ""
						}
					</ul>
				`;

				resultContainer.innerHTML += searchTabs;
			}

			if (products && products.length) {
				const productsRow = document.createElement("ul");

				productsRow.className = `predictive-search__result-row ${products.length ? classes.active : classes.visuallyHidden}
			js-predictive-search-result-row
			`;
				productsRow.setAttribute(attributes.dataId, "products");
				productsRow.setAttribute(attributes.id, "search-products");
				resultContainer.appendChild(productsRow);

				products.forEach((product) => {
					let productImageSrc = "";
					let productImageSrcSet = "";
					let productImageFocal = "";

					if (product.image) {
						productImageSrc = Images.generateSrc(product.image, 260);
						productImageSrcSet = Images.generateSrcset(product.image, 260);
					} else if (window.themeCore.productPlaceholderImage) {
						productImageSrc = Images.generateSrc(window.themeCore.productPlaceholderImage, 260);
						productImageSrcSet = Images.generateSrcset(window.themeCore.productPlaceholderImage, 260);

						if (window.themeCore.productPlaceholderImageFocal) {
							productImageFocal = `--img-desktop-pos: ${window.themeCore.productPlaceholderImageFocal}`;
						}
					}

					let productPrice = product.price;
					const priceArr = productPrice.split(".");

					if (priceArr.length >= 2) {
						productPrice = priceArr[0] + "." + priceArr[1].substring(0, 2);
					}

					productsResult = `
						<li class="predictive-search__result-col">
							<a
								class="focus-visible-outline predictive-search__product-card"
								href="${product.url}"
								aria-label="${product.title}"
							>
								<div class="predictive-search__product-card-image-container">
									${
										productImageSrc
											? `<img
												class="predictive-search__product-card-image"
												src="${productImageSrc}"
												srcset="${productImageSrcSet}"
												alt="${product.featured_image.alt || ""}"
												width="130"
												height="130"
												${productImageFocal ? `style="${productImageFocal}"` : ""}
											/>`
											: ""
									}
								</div>

								<div class="predictive-search__product-card-info">
									<h3 class="predictive-search__product-card-heading">
										${product.title}
									</h3>

									<div class="predictive-search__product-card-price">
										${formatMoney(productPrice.includes(".") ? productPrice : productPrice + ".00", window.themeCore.objects.shop.money_format)}
									</div>
								</div>

								${
									!resultContainer.classList.contains("predictive-search-new__result")
										? `<span class="predictive-search__product-card-icon">
										<svg
											class="icon"
											width="14"
											height="14"
											viewBox="0 0 14 14"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fill-rule="evenodd"
												clip-rule="evenodd"
												d="M9.36899 3.15909L12.8402 6.61591C13.0533 6.82804 13.0533 7.17196 12.8402 7.38409L9.36899 10.8409C9.15598 11.053 8.81061 11.053 8.5976 10.8409C8.38459 10.6288 8.38459 10.2848 8.5976 10.0727L11.1377 7.54318L1.54545 7.54319C1.24421 7.54319 1 7.29999 1 7C1 6.70001 1.24421 6.45681 1.54545 6.45681L11.1377 6.45681L8.5976 3.92728C8.38459 3.71515 8.38459 3.37122 8.5976 3.15909C8.81061 2.94697 9.15598 2.94697 9.36899 3.15909Z">
											</path>
										</svg>
									</span>`
										: ""
								}
							</a>
						</li>
					`;

					productsRow.innerHTML += productsResult;
				});
			}

			if (articles && articles.length) {
				const articlesRow = document.createElement("ul");

				articlesRow.className = `predictive-search__result-row ${(!products || !products.length) && articles.length ? classes.active : classes.visuallyHidden}
			js-predictive-search-result-row
			`;
				articlesRow.setAttribute(attributes.dataId, "articles");
				articlesRow.setAttribute(attributes.id, "search-articles");
				resultContainer.appendChild(articlesRow);

				articles.forEach((article) => {
					let articleImageSrc = "";
					let articleImageSrcSet = "";
					let articleImageFocal = "";

					if (article.image) {
						let imageWidth = 260;

						if (article.featured_image && article.featured_image.aspect_ratio > 1) {
							imageWidth *= article.featured_image.aspect_ratio;
						}

						articleImageSrc = Images.generateSrc(article.image, imageWidth);

						articleImageSrcSet = Images.generateSrcset(article.image, imageWidth);
					} else if (window.themeCore.articlePlaceholderImage) {
						articleImageSrc = Images.generateSrc(window.themeCore.articlePlaceholderImage, 260);

						articleImageSrcSet = Images.generateSrcset(window.themeCore.articlePlaceholderImage, 260);

						if (window.themeCore.articlePlaceholderImageFocal) {
							articleImageFocal = `--img-desktop-pos: ${window.themeCore.articlePlaceholderImageFocal}`;
						}
					}

					const articleBodyWrapper = document.createElement("div");
					articleBodyWrapper.innerHTML = article.body;

					articlesResult = `
						<li class="predictive-search__result-col">
							<a
								class="focus-visible-outline predictive-search__article-card"
								href="${article.url}"
								aria-label="${article.title}"
							>
								<div class="predictive-search__article-card-image-container">
									${
										articleImageSrc
											? `
												<img
													class="predictive-search__article-card-image"
													src="${articleImageSrc}"
													srcset="${articleImageSrcSet}"
													alt="${article.featured_image.alt ? article.featured_image.alt : ""}"
													width="130"
													height="130"
													${articleImageFocal ? `style="${articleImageFocal}"` : ""}
												/>
											`
											: ""
									}
								</div>

								${
									resultContainer.classList.contains("predictive-search-new__result")
										? `
										<div class="predictive-search__article-card-text-container">
											<h3 class="predictive-search__article-card-heading">
												${article.title}
											</h3>

											<div class="predictive-search__article-card-description">
												${articleBodyWrapper.textContent}
											</div>
										</div>
									`
										: `
										<h3 class="predictive-search__article-card-heading">
											${article.title}
										</h3>

										<span class="predictive-search__article-card-icon">
											<svg
												class="icon"
												width="14"
												height="14"
												viewBox="0 0 14 14"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M9.36899 3.15909L12.8402 6.61591C13.0533 6.82804 13.0533 7.17196 12.8402 7.38409L9.36899 10.8409C9.15598 11.053 8.81061 11.053 8.5976 10.8409C8.38459 10.6288 8.38459 10.2848 8.5976 10.0727L11.1377 7.54318L1.54545 7.54319C1.24421 7.54319 1 7.29999 1 7C1 6.70001 1.24421 6.45681 1.54545 6.45681L11.1377 6.45681L8.5976 3.92728C8.38459 3.71515 8.38459 3.37122 8.5976 3.15909C8.81061 2.94697 9.15598 2.94697 9.36899 3.15909Z">
												</path>
											</svg>
										</span>
									`
								}
							</a>
						</li>
					`;

					articlesRow.innerHTML += articlesResult;
				});
			}

			if (pages && pages.length) {
				const pagesRow = document.createElement("ul");

				pagesRow.className = `predictive-search__result-row ${
				(!products || !products.length) && (!articles || !articles.length) && pages.length ? classes.active : classes.visuallyHidden
			}
			js-predictive-search-result-row
			`;
				pagesRow.setAttribute(attributes.dataId, "pages");
				pagesRow.setAttribute(attributes.id, "search-pages");
				resultContainer.appendChild(pagesRow);

				pages.forEach((page) => {
					pagesResult = `
						<li class="predictive-search__result-col">
							<a
								class="focus-visible-outline predictive-search__page-card"
								href="${page.url}"
								aria-label="${page.title}"
							>
								<h3 class="predictive-search__page-card-link">
									${page.title}
								</h3>

								<span class="predictive-search__page-card-icon">
									${
										resultContainer.classList.contains("predictive-search-new__result")
											? `	<svg
													class="icon"
													aria-hidden="true"
													focusable="false"
													width="36"
													height="12"
													viewBox="0 0 36 12"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<rect
														x="30.3438"
														y="11.6572"
														width="1"
														height="8"
														rx="0.5"
														transform="rotate(-135 30.3438 11.6572)"
														fill="currentColor"
													/>
													<rect
														x="29.6367"
														y="1.0498"
														width="1"
														height="8"
														rx="0.5"
														transform="rotate(-45 29.6367 1.0498)"
														fill="currentColor"
													/>
													<rect
														x="35"
														y="5.34277"
														width="1"
														height="35"
														rx="0.5"
														transform="rotate(90 35 5.34277)"
														fill="currentColor"
													/>
											</svg>
										`
											: `
											<svg
												class="icon"
												width="14"
												height="14"
												viewBox="0 0 14 14"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M9.36899 3.15909L12.8402 6.61591C13.0533 6.82804 13.0533 7.17196 12.8402 7.38409L9.36899 10.8409C9.15598 11.053 8.81061 11.053 8.5976 10.8409C8.38459 10.6288 8.38459 10.2848 8.5976 10.0727L11.1377 7.54318L1.54545 7.54319C1.24421 7.54319 1 7.29999 1 7C1 6.70001 1.24421 6.45681 1.54545 6.45681L11.1377 6.45681L8.5976 3.92728C8.38459 3.71515 8.38459 3.37122 8.5976 3.15909C8.81061 2.94697 9.15598 2.94697 9.36899 3.15909Z">
												</path>
											</svg>
										`
									}
								</span>
							</a>
						</li>
					`;

					pagesRow.innerHTML += pagesResult;
				});
			}

			document.addEventListener("click", setActiveTabCategory);
		}

		function setActiveTabCategory(event) {
			const tabButtons = [...document.querySelectorAll(selectors.tabsButton)];
			const resultRows = [...document.querySelectorAll(selectors.resultRow)];
			const targetTabButton = event.target.closest(selectors.tabsButton);

			if (!targetTabButton || !tabButtons.length || !resultRows.length) {
				return;
			}

			tabButtons.forEach((button) => {
				button.classList.remove(classes.active);
				button.setAttribute(attributes.ariaExpanded, false);
			});

			targetTabButton.classList.add(classes.active);
			targetTabButton.setAttribute(attributes.ariaExpanded, true);

			resultRows.forEach((resultRow) => {
				resultRow.classList.remove(classes.active);
				resultRow.classList.add(classes.visuallyHidden);
			});

			resultRows
				.filter((resultRow) => resultRow.dataset.id === targetTabButton.dataset.id)
				.forEach((resultRow) => {
					resultRow.classList.add(classes.active);
					resultRow.classList.remove(classes.visuallyHidden);
				});
		}

		function renderEmptyResult(resultContainer) {
			const emptyResult = `
				<p class="h4 predictive-search__result-empty">
					${window.themeCore.translations.get("general.predictive_search.no_results")}
				</p>
			`;

			resultContainer.innerHTML += emptyResult;
		}

		async function getResult(inputValue) {
			const searchType = document.querySelector(selectors.searchType);

			if (!searchType) {
				return;
			}

			const resourcesType = `${encodeURIComponent("resources[type]")}=${searchType.value}`;
			const resourcesLimit = `${encodeURIComponent("resources[limit]")}=${SEARCH_RESULTS_COUNT}`;
			const url = `${locale}search/suggest.json?q=${encodeURIComponent(inputValue)}&${resourcesType}&${resourcesLimit}`;

			return await fetch(url);
		}

		function clearInnerResults(resultContainer) {
			resultContainer.innerHTML = "";
		}

		function onFormSubmit(event) {
			const form = event.target.closest(selectors.form);

			if (!form) {
				return;
			}

			event.preventDefault();

			const inputValue = form.querySelector(selectors.input).value.trim();

			if (!inputValue.length) {
				return;
			}

			searchRedirect(inputValue);
		}

		function searchRedirect(value) {
			const searchType = document.querySelector(selectors.searchType);

			if (!searchType) {
				return;
			}

			const valueEncoded = encodeURI(value);
			const url = `${locale}search/?type=${searchType.value}&options%5Bprefix%5D=last&q=${valueEncoded}`;

			window.location.replace(url);
		}

		function init() {
			document.addEventListener("input", debounce(searchAction, 200, false));
			document.addEventListener("submit", onFormSubmit);
		}

		return Object.freeze({
			init
		});
	};

	const action = () => {
		window.themeCore.PredictiveSearch = window.themeCore.PredictiveSearch || PredictiveSearch();
		window.themeCore.utils.register(window.themeCore.PredictiveSearch, "predictive-search");
	};

	if (window.themeCore && window.themeCore.loaded) {
		action();
	} else {
		document.addEventListener("theme:all:loaded", action, { once: true });
	}

})();
