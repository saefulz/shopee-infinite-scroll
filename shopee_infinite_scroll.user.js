// ==UserScript==
// @name         Shopee Infinite Scroll (Enhanced)
// @namespace    shopee-infinite-scroll
// @version      1.3
// @description  Memuat produk Shopee otomatis saat scroll ke bawah (pencarian/kategori).
// @author       Gemini
// @match        https://shopee.co.id/search*
// @match        https://shopee.co.id/mall/search*
// @match        https://shopee.co.id/*-cat.*
// @icon         https://shopee.co.id/favicon.ico
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      shopee.co.id
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/saefulz/shopee-infinite-scroll/main/shopee_infinite_scroll.meta.js
// @downloadURL  https://raw.githubusercontent.com/saefulz/shopee-infinite-scroll/main/shopee_infinite_scroll.user.js
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        productContainerSelector: 'div.shopee-search-item-result__items',
        productItemSelector: 'div.shopee-search-item-result__item',
        paginationSelector: 'div.shopee-page-controller',
        loaderId: 'infinite-scroll-loader-gemini'
    };

    let isLoading = false;
    let hasMorePages = true;
    let currentPage = 0;

    function initialize() {
        if (window.location.pathname.startsWith('/product/')) return;

        const productContainer = document.querySelector(config.productContainerSelector);
        if (!productContainer) {
            console.log('[Shopee Infinite Scroll] Tidak menemukan kontainer produk. Batal.');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        currentPage = parseInt(urlParams.get('page')) || 0;

        const pagination = document.querySelector(config.paginationSelector);
        if (pagination) pagination.style.display = 'none';

        createLoader(productContainer);
        createManualButton();

        window.addEventListener('scroll', handleScroll, { passive: true });
        console.log('[Shopee Infinite Scroll] Aktif.');
    }

    function handleScroll() {
        if (isLoading || !hasMorePages) return;

        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.body.offsetHeight;
        const threshold = 800;

        if (scrollPosition >= pageHeight - threshold) {
            loadNextPage();
        }
    }

    function loadNextPage() {
        isLoading = true;
        showLoader();

        const nextPageNumber = currentPage + 1;
        const nextURL = getNextPageURL(nextPageNumber);
        console.log(`[Shopee Infinite Scroll] Memuat halaman ${nextPageNumber}...`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: nextURL,
            responseType: 'text',
            headers: {
                'Accept': 'text/html'
            },
            onload: function (response) {
                const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                const newItems = doc.querySelectorAll(config.productItemSelector);
                const mainContainer = document.querySelector(config.productContainerSelector);

                if (newItems.length > 0) {
                    const existingHTML = new Set(Array.from(mainContainer.children).map(el => el.innerHTML));

                    newItems.forEach(item => {
                        if (!existingHTML.has(item.innerHTML)) {
                            const imported = document.importNode(item, true);
                            mainContainer.appendChild(imported);
                        }
                    });

                    currentPage = nextPageNumber;
                } else {
                    console.log('[Shopee Infinite Scroll] Tidak ada lagi produk.');
                    hasMorePages = false;
                }

                isLoading = false;
                hideLoader();
            },
            onerror: function (err) {
                console.error('[Shopee Infinite Scroll] Gagal memuat halaman berikutnya:', err);
                isLoading = false;
                hasMorePages = false;
                hideLoader();
            }
        });
    }

    function getNextPageURL(pageNumber) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNumber);
        return url.href;
    }

    function showLoader() {
        const loader = document.getElementById(config.loaderId);
        if (loader) loader.style.display = 'block';
    }

    function hideLoader() {
        const loader = document.getElementById(config.loaderId);
        if (loader) loader.style.display = 'none';
    }

    function createLoader(container) {
        const loader = document.createElement('div');
        loader.id = config.loaderId;
        loader.innerHTML = '<div>🔄 Memuat produk berikutnya...</div>';
        container.insertAdjacentElement('afterend', loader);
    }

    function createManualButton() {
        const btn = document.createElement('button');
        btn.textContent = '⬇️ Muat Lagi';
        btn.onclick = loadNextPage;
        btn.style = `
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #EE4D2D;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
        `;
        document.body.appendChild(btn);
    }

    GM_addStyle(`
        #${config.loaderId} {
            text-align: center;
            padding: 25px;
            font-size: 1.2em;
            color: #EE4D2D;
            display: none;
            font-family: -apple-system,Helvetica Neue,Helvetica,Roboto,Droid Sans,Arial,sans-serif;
        }
    `);

    setTimeout(initialize, 2500);
})();
