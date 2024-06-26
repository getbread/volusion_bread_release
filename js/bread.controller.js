/**
 * 
 * This operator integrates the Bread 2.0 Platform API into Volusion. 
 * The PageHelper class determines the type of page that the buyer is on.
 * After that the relevant class is extended from the BasePageController,
 * so that the apropriate functionality can be rendered. 
 * 
 * For example, if you are on the Cart page, you will find functionality
 * being used under PageHelper, BasePageController, and CartPageController.
 * 
 * The initialization of the Bread SDK and calling of the makeBread functon,
 * which displays the bread placements and modal on the page, begins at the
 * bottom of the file with the initPage functon. Further functionality is then
 * derived farther up the page depending on the page the buyer is accessing.
 * 
 */

(function ($, undefined) {

    window.BREAD_ORDER_PROCESSING_URL = "/v/bread/asp/completeOrder.asp";

    /** Class Generator **/
    var _class = function (_parent, definition) {
        var model = function () { this.parent = _parent.prototype; if (this.init) { this.init() } };
        $.extend(model.prototype, _parent.prototype);
        $.extend(model.prototype, definition);
        model.__super__ = _parent.prototype; return model;
    };

    /**
     * [Model] Page Helper
     */
    var PageHelper = _class(Object, {
        /**
         * @var string		The current page type
         */
        type: null,

        /**
         * @var object		The page controller
         */
        controller: null,

        /**
         * Init 
         *
         */
        init: function () {
            this.type = this.getPageType() || 'unknown';
            var controllerClass = this.getControllerClass();
            this.controller = new controllerClass;
            this.controller.page = this;
        },

        /**
         * Return the type of the current page
         *
         * @return	string
         */
        getPageType: function () {
            var path = location.pathname.toLowerCase();

            if (path.match(/default/) || path == "/") { return 'home'; }
            if (path.match(/(_s\/|-s\/|searchresults)/)) { return 'category'; }
            if (path.match(/one-page-checkout/)) { return 'checkout'; }
            if (path.match(/(_p\/|-p\/|productdetails)/)) { return 'product'; }
            if (path.match(/shoppingcart/)) { return 'cart'; }
            if (path.match(/orderfinished/)) { return 'finished'; }
        },

        /**
         * Get the correct model to handle the current page
         *
         * @return	object
         */
        getControllerClass: function () {
            switch (this.type) {
                case 'category':
                    return CategoryPageController;
                case 'product':
                    return ProductPageController;
                case 'cart':
                    return CartPageController;
                case 'checkout':
                    return CheckoutPageController;
                case 'finished':
                    return FinishedPageController;
                default:
                    return BasePageController;
            }
        },

        /**
         * Get the selected product options from the page
         * 
         * @param	string|dom		page		The page or dom containing the product with potentially selected options
         * @return	array
         */
        getOptionsFromPage: function (page) {
            var self = this;
            var html = page ? $(page) : $(document);
            var options = [];
            var values = [];

            options.form_values = '';

            /** 
             * The nested if statements below scan the HTML of the page for product options like small/medium/large
             * and scrape those options so they can be added to the order data
             * 
             * For example: A product with S/M/L options is going to have a dropdown with each option.
             * The options are inside a `select` element with a name that begins with "SELECT_" ex. 
             * 
             * <select name="SELECT___BREAD___2" onchange="change_option('SELECT___BREAD___2',this.options[this.selectedIndex].value); AutoUpdatePriceWithSelectedOptions(this.options[this.selectedIndex].value, 2)" title="Size">
             *     <option value="105">Small</option>
             *     <option value="106">Medium</option>
             *     <option value="107">Large</option>
             * </select>
             * 
             * These select elements are inside table elements, so the code below finds the appropriate td (cell) or tr (row) element and reformats in order to send along the data, 
             * */

            if (page && html.find('td b').eq(0).text() == 'Item Details') {
                // Scrape product options from the Item Details popup
                html.find('li').each(function () {
                    values.push('[' + $(this).text().trim() + ']');
                });
            }
            else {
                // Scrape options from the product page itself
                html.find('[name^="SELECT_"]').each(function () {
                    var el = $(this);
                    var td = el.closest('td');
                    var tr = el.closest('tr');

                    if (el.is('select')) {
                        el.find(':selected').each(function () {
                            options.push($(this).attr('value'));
                            values.push('[' + tr.find('td').eq(0).text().trim().split(':')[0] + ':' + $(this).text().split('[')[0].trim() + ']');
                        });
                    } else if (el.is('[type="checkbox"]')) {
                        if (el.is(':checked')) {
                            options.push(el.attr('value'));
                            values.push('[' + tr.find('td').eq(0).text().trim().split(':')[0] + ':' + el.closest('td').text().split('[')[0].trim() + ']');
                        }
                    } else if (el.is('[type="radio"]')) {
                        if (el.is(':selected')) {
                            options.push(el.attr('value'));
                            for (var x = 0; x < tr[0].childNodes.length; x++) {
                                if (tr[0].childNodes[x] === el[0]) {
                                    values.push('[' + tr.find('td').eq(0).text().trim().split(':')[0] + ':' + tr[0].childNodes[x + 1].textContent.split('[')[0].trim() + ']');
                                }
                            }
                        }
                    }
                });

                // Serialize any product options for use when adding to cart for checkout totals calculations
                options.form_values = html.find('form#vCSS_mainform').serialize().split('&').filter(function (val) { return val.split('=')[0].indexOf('SELECT_') === 0; });
            }

            options._values = $.map(values, function (val) { return self.xmlEscape(val); });
            return options;
        },

        /**
         * Escape string for use as an xml value
         *
         * @param	string		str				The string to escape
         * @return	string
         */
        xmlEscape: function (str) {
            return str.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
            });
        },

        /**
         * Show a modal dialog
         *
         * @param	object			options				The modal options
         * @return	MicroModal
         */
        showModal: function (options) {
            if ($('#bread-page-modal').length == 0) {
                $('<div id="bread-page-modal" aria-hidden="true" class="bmodal micromodal-slide">' +
                    '<div class="bmodal__overlay" tabindex="-1">' +
                    '<div class="bmodal__container" role="dialog" aria-modal="true" aria-labelledby="bread-page-modal-title" >' +
                    '<header class="bmodal__header">' +
                    '<h2 class="bmodal__title" id="bread-page-modal-title"></h2>' +
                    '<button class="bmodal__close" aria-label="Close modal" data-micromodal-close></button>' +
                    '</header>' +
                    '<main class="bmodal__content" id="bread-page-modal-content"></main>' +
                    '</div>' +
                    '</div>' +
                    '</div>')
                    .appendTo('body');
            }

            var modal = $('#bread-page-modal');
            modal.find('#bread-page-modal-title').html(options.title);
            modal.find('#bread-page-modal-content').html(options.content);

            MicroModal.show('bread-page-modal', options);
        }

    });

    /**
     * [Model] Base Page Controller
     */
    var BasePageController = _class(Object, {
        /**
         * @var	string		Currency prefix
         */
        c_prefix: '$',

        /**
         * @var	string		Cart cookie name
         */
        cart_cookie: 'CartID5',

        /**
         * @var	boolean		Clear cart after checkout
         */
        clearCart: false,

        /**
         * @var	boolean
         */
        actAsLabel: false,

        /**
         * @var	boolean
         */
        asLowAs: true,

        /**
         * @var	boolean
         */
        allowCheckout: true,

        /**
         * Make bread buttons
         *
         * @return	void
         */
        makeBread: function () {

        },

        /**
         * Base bread checkout options and callbacks
         *
         * @return	object
         */
        getCheckoutParams: function () {
            var self = this;

            var params = {

                /* Disable clicking of button? */
                actAsLabel: this.actAsLabel,

                /* Show as low as pricing? */
                asLowAs: this.asLowAs,

                /* Allow checkout? */
                allowCheckout: this.allowCheckout,

                /* Open in new window if current page is not secure */
                showInWindow: (location.protocol != 'https:') && false,

                /**
                 * Checkout Complete. Submit order to backend.
                 *
                 * @param	object|null		err			An error object if the checkout failed
                 * @param	object|null		token		The transaction token if checkout was successful
                 * @return	void
                 */
                done: function (err, token) {
                    if (token) {
                        breadPage.showModal({
                            title: '<span style="color: #005404">Order Success!</span>',
                            content: '<p>One moment while we complete the processing of your order.</p>'
                        });

                        var data = { tx_id: token };

                        // Add in any variable options selected for the product
                        $.each(params.items, function (i, item) {
                            if (item.options) {
                                if (item.options._values) {
                                    data[item.sku + '_options'] = item.options._values.join('');
                                }
                            }
                        });

                        // Send along the order items to process. The bread backend doesnt maintain
                        // the correct order of transaction line items, so we may need this.
                        data.items = JSON.stringify({
                            items: params.items.map(function (item) {
                                var line = Object.assign({}, item);
                                line.product = { name: line.name };
                                delete line.name;
                                return line;
                            })
                        });

                        $.ajax({
                            method: 'post',
                            dataType: 'json',
                            url: BREAD_ORDER_PROCESSING_URL,
                            data: data
                        }).then(function (response) {
                            if (response.success) {
                                if (self.clearCart) {
                                    self.setCookie(self.cart_cookie, '');
                                }
                                self.orderComplete(response, params);
                            } else {
                                alert(response.message);
                            }
                        });
                    }
                },

                /**
                 * Bread Financing Incomplete
                 *
                 * @param	object|null		err			An error object if the checkout failed
                 * @param	object			custData	Data regarding why the checkout flow ended
                 * @return	void
                 */
                onCustomerClose: function (err, custData) {
                    var email = custData.email;

                    // Reference
                    switch (custData.state) {
                        case 'PREQUALIFIED':
                            break;
                        case 'PARTIALLY_PREQUALIFIED':
                            break;
                        case 'NOT_PREQUALIFIED':
                            break;
                        case 'ABANDONED':
                            break;
                    }
                },

                /**
                 * Bread Financing Flow Opened
                 *
                 * @param	object|null		err			An error object if the checkout failed
                 * @param	object			data		Data about how the flow opened and the options it opened with
                 * @param	function		cb			A callback to pass true or false indicating if the flow should continue
                 * @return	void
                 */
                onCustomerOpen: function (err, data, cb) {
                    // You may pass
                    cb(true);
                }
            };

            return params;
        },

        /**
         * Get the cart items
         *
         * @return	$.Deferred
         */
        getCartItems: function () {
            var result = $.Deferred();

            $.getJSON('/ajaxcart.asp', function (results) {
                var items = [];
                $(results.Products).each(function (i, product) {
                    var options = [];
                    options._values = product.HasOptions == "Y" ? $.map(product.Options, function (opts) { return '[' + opts.join(', ') + ']'; }) : undefined;
                    var productPrice = parseInt(parseInt(product.ProductPrice.replace('$', '').replace(',', '').replace('.', '')) / parseInt(product.Quantity));
                    items.push({
                        name: product.ProductName,
                        price: productPrice,
                        sku: product.ProductCode,
                        imageUrl: location.protocol + '//' + location.hostname + product.ImageSource,
                        detailUrl: location.protocol + '//' + location.hostname + product.ImageSource,
                        quantity: parseInt(product.Quantity),
                        options: options
                    });
                });

                result.resolve(items);
            });

            return result;
        },

        /**
         * An order has been successfully completed
         *
         * @param	object			response				The volusion backend response data
         * @param	object			params					The bread checkout params
         * @return	void
         */
        orderComplete: function (response, params) {
            this.page.showModal({
                title: '<span style="color: #005404">Order Complete!</span>',
                content: '<p>Thank you! Your order has been successfully processed.</p>' +
                    '<p>Your order number is: <strong>' + response.order_id + '</strong>.</p>' +
                    '<p>We have sent an order confirmation to your email address.</p>',
                onClose: function (modal) {
                    location.href = '/';
                }
            });
        },

        /**
         * Get the checkout totals (shipping/tax) for a potential order
         *
         * How you ask? We save the current volusion shopping cart cookie,
         * then we reset it and add all of our items to a new cart, then
         * we make ajax calls to the shipping script for volusion and get
         * all the shipping options, and then finally make requests for
         * each of those shipping options to get the shipping rates, then
         * restore the original cart and resolve our promise. Piece of cake. 
         *
         * @param	array		items				The order items
         * @param	object		shippingContact		The shippping contact details
         * @param	bool		mockCart			Create a mock cart to run calculations on
         * @return	$.Deferred().promise()
         */
        getCheckoutTotals: function (items, shippingContact, mockCart) {
            var self = this;
            var cartID = this.getCookie(this.cart_cookie);
            var cart_requests = [];
            var cartComplete = true;

            if (mockCart) {
                // Create a fresh cart and add the order items to it
                this.setCookie(this.cart_cookie, '');
                cartComplete = $.Deferred();

                // Add items to the cart sequentially (cookie needs to be synchronized)
                var pushToCart = function () {
                    if (cart_requests.length > 0) {
                        $.ajax(cart_requests.shift()).done(pushToCart);
                        return;
                    }
                    cartComplete.resolve();
                };

                $.each(items, function (i, item) {
                    var data = {
                        ProductCode: item.sku,
                        AjaxError: 'Y',
                        btnaddtocart: 'btnaddtocart',
                        batchadd: 'Y'
                    };

                    data['QTY.' + item.sku] = item.quantity;

                    // Add form values into data
                    if (item.options !== undefined && item.options.form_values) {
                        $.each(item.options.form_values, function (i, pair) {
                            var vals = pair.split('=');
                            data[vals[0]] = vals[1];
                        });
                    }

                    cart_requests.push({
                        method: 'post',
                        url: '/ProductDetails.asp',
                        data: data
                    });
                });

                pushToCart();
            }

            var response = $.Deferred();

            // Set the cart back to what it was originally after our process is complete
            response.done(function (data) {
                self.setCookie(self.cart_cookie, cartID, 30);
            });

            // When cart add requests are complete, get the shipping options from the 
            // checkout page, and then get the quoted rate for each shipping option
            $.when(cartComplete).done(function () {
                // Get all available shipping choices
                $.ajax({
                    method: 'post',
                    url: '/one-page-checkout.asp?RecalcShipping=RecalcShipping',
                    data: {
                        ShipResidential: 'Y',
                        ShipPostalCode: shippingContact.zip,
                        ShipState: shippingContact.state,
                        hidden_btncalc_shipping: 'this_button_was_pressed'
                    }
                }).done(function (data) {
                    var shippingOptions = [];
                    var quotes = [];
                    var tax = 0;

                    try {
                        // Of course Volusion doesn't even return valid JSON data (why would we expect any less)
                        data = self.parseCrapJSON(data);

                        if (data.DisplayShippingSpeedChoices) {
                            var shipChoicesHtml = $(data.DisplayShippingSpeedChoices);

                            // Get the quoted rate for each shipping option
                            shipChoicesHtml.find('option').each(function () {
                                var option = $(this);

                                quotes.push($.ajax({
                                    method: 'post',
                                    url: '/one-page-checkout.asp?ShippingSpeedChoice=ShippingSpeedChoice',
                                    data: {
                                        ShipResidential: 'Y',
                                        ShipPostalCode: shippingContact.zip,
                                        ShipState: shippingContact.state,
                                        ShippingSpeedChoice: option.val()
                                    }
                                }).done(function (data) {
                                    data = self.parseCrapJSON(data);
                                    if (data.TotalsTax1 != undefined) {
                                        tax = parseInt(parseFloat(data.TotalsTax1.split(self.c_prefix)[1].replace(',', '')) * 100);
                                    }

                                    if (data.TotalsSH != undefined) {
                                        if (parseInt(option.val())) {
                                            shippingOptions.push({
                                                typeId: option.val(),
                                                cost: parseInt(parseFloat(data.TotalsSH.split(self.c_prefix)[1].replace(',', '')) * 100),
                                                type: option.text()
                                            });
                                        }
                                    }
                                }));
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    }

                    // Once all available shipping options have been quoted, resolve the choices
                    $.when.apply($, quotes).done(function () {
                        response.resolve({
                            shipping: shippingOptions,
                            tax: tax
                        });
                    });

                });
            });

            return response.promise();
        },

        /**
         * Flatten a list of items
         *
         * Instead of having items with other products as options, add them instead
         * as line items.
         *
         * @param	array			items				The items list
         * @return	array
         */
        flattenItems: function (items) {
            var _items = [];
            var product_line = /(\d+) of (.+): \n(.+)/;
            $.each(items, function (i, item) {
                _items.push(item);
                if (item.options && item.options._values) {
                    item.options._values = $(item.options._values).filter(function (j, value) {
                        var match = value.match(product_line);
                        if (match) {
                            _items.push({
                                name: match[3].replace(/]$/, ''),
                                price: 0,
                                quantity: parseInt(match[1]),
                                sku: match[2],
                                detailUrl: item.detailUrl
                            });
                            return false;
                        }
                        return true;
                    }).toArray();
                }
            });
            return _items;
        },

        /**
         * Get a cookie value by name
         *
         * @param	string		cname		Cookie name to fetch
         * @return	string
         */
        getCookie: function (cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        },

        /**
         * Set a cookie value
         *
         * @param	string			cname			Cookie name
         * @param	string			cvalue			Cookie value
         * @param	int				exdays			Expiration of cookie in days
         */
        setCookie: function (cname, cvalue, exdays) {
            var d = new Date();
            exdays = exdays || 0;
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        },

        /**
         * Parse the invalid json responses that volusion returns
         *
         * @param	string			crapJSON			Non-standard data that volusion passes as json
         * @return	object
         */
        parseCrapJSON: function (crapJSON) {
            var crapProperties = crapJSON.match(/(\w*):/g);
            $.each(crapProperties, function (i, prop) {
                prop = prop.replace(':', '');
                crapJSON = crapJSON.replace(prop + ':', '"' + prop + '":');
            });

            return JSON.parse(crapJSON);
        },

        minMaxCheck: function (price) {
            const breadMin = Math.round(Number(sessionStorage.getItem("bread-product-min")) * 100);
            const breadMax = Math.round(Number(sessionStorage.getItem("bread-product-max")) * 100);

            if ((breadMax === 0 && price > breadMin) || (price >= breadMin && price <= breadMax)) {
                return true;
            }
            return false;

        },

        skuCheck: function (product_code) {

            const sku_list_string = sessionStorage.getItem("bread_sku_filter_list");
            const sku_filter_option = sessionStorage.getItem("bread_enable_sku_filter");
            let product_list;
            if (sku_list_string === "" && sku_filter_option != "Off") {
                console.log("Bread Settings Error: Include/Exclude option is turned on, but no product codes have been specified");
                return true;
            } else {
                // convert comma separated string to an array
                product_list = sku_list_string.split(",").map(item => {
                    return item.trim();
                });
            };

            // check the array to see if any provided codes match this product
            let filtered = false;
            for (let i = 0; i < product_list.length; i++) {
                if (product_code.toLowerCase() === product_list[i].toLowerCase()) {
                    filtered = true;
                };
            };

            /** 
            * Four reasons why the bread button should show up on a product:
            * 1. The filter by sku/product code option is turned off
            * 2. The filter is set to include and this product is on the list of included items
            * 3. The filter is set to exclude and this product is not on the list of excluded items
            * 4. The merchant has turned the filter on, but not specified any product codes. In this case we default to showing the Bread button
            */
            if (sku_filter_option === "Off" || (sku_filter_option === "Include" && filtered) || (sku_filter_option === "Exclude" && !filtered)) {
                return true;
            };

            return false;
        }
    });

    /**
     * [Model] Category Page Controller
     */
    var CategoryPageController = _class(BasePageController,
        {
            /**
             * @var	string 		Button HTML
             */
            buttonHtml: '<div data-role="bread-checkout" class="bread-checkout-btn"></div>',

            /**
             * Make bread buttons
             *
             * @return	void
             */
            makeBread: function (integrationKey) {
                var self = this;

                var Payments;
                if (sessionStorage.getItem("tenant_prefix") === "rbc") {
                    Payments = window.RBCPayPlan;
                } else {
                    Payments = window.BreadPayments;
                }

                /** 
                 * Bread uses [placements] to fill in information about the product and apply it to the pre-qualification button.
                 * In order to get that information, we get the list of divs from the page that match the ID "v-product", 
                 * and use that list to run getCheckoutParams, which returns information about the products.
                 * The actual product info is stored in a parameter called "items". We loop over each product to get its "items" data.
                 * The item data is added to productArray, which we can then access to get price and other necessary info.
                 * We then add that info to the placement, which is pushed to bread via registerPlacements() to generate buttons with applicable prices.
                 */

                const products = $('.v-product');
                const placements = [];

                // Add the bread button to each product on the page
                products.each(function (i) {
                    const product = $(this);
                    const button = $(self.buttonHtml);
                    const buttonId = 'bread-checkout-btn-' + i;
                    const item = self.getCheckoutParams(product, buttonId)
                    const productArray = item.items
                    const price = productArray[0].price
                    const product_code = productArray[0].sku

                    // Check that the price is between min and max set prices
                    if (self.minMaxCheck(price)) {
                        // Check if products are filtered out of Bread availability
                        if (self.skuCheck(product_code)) {
                            button.attr('id', buttonId);
                            product.append(button);
                            const currency = sessionStorage.getItem("currency");

                            placements.push({
                                financingType: "installment",
                                domID: buttonId,
                                allowCheckout: false,
                                order: {
                                    items: [],
                                    subTotal: {
                                        value: price,
                                        currency: currency,
                                    },
                                    totalDiscounts: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalShipping: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalTax: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalPrice: {
                                        value: price,
                                        currency: currency,
                                    },
                                }
                            });
                        };
                    };
                });

                Payments.setup({
                    integrationKey: integrationKey
                });

                Payments.registerPlacements(placements);

                Payments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                Payments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                Payments.on('INSTALLMENT:INITIALIZED', () => { });
                Payments.__internal__.init();
            },

            /**
             * Get the bread checkout parameters
             *
             * @param	jQuery		product			The jquery wrapped product
             * @param	string		buttonId		The button id
             * @return	object
             */
            getCheckoutParams: function (product, buttonId) {
                var self = this;

                // product details
                var items = [{
                    name: product.find('.v-product__title').text().trim(),
                    price: parseInt(parseFloat(product.find('.product_productprice').text().trim().split(this.c_prefix)[1].replace(',', '')) * 100),
                    sku: getProductCodeFromUrl(product.find('a[href*="ProductCode"]').attr('href')),
                    imageUrl: product.find('.v-product__img img').data('image-path'),
                    detailUrl: product.find('a.v-product__title').attr('href'),
                    quantity: 1
                }];

                // checkout options
                var opts = {
                    buttonId: buttonId,
                    items: items,
                    calculateTax: function (shippingContact, callback) {
                        $.when(self.getCheckoutTotals(items, shippingContact, true)).done(function (result) {
                            callback(null, result.tax);
                        });
                    },
                    calculateShipping: function (shippingContact, callback) {
                        $.when(self.getCheckoutTotals(items, shippingContact, true)).done(function (result) {
                            callback(null, result.shipping);
                        });
                    }
                };

                return $.extend(this.parent.getCheckoutParams.apply(this), opts);
            }
        });

    /**
     * [Model] Product Page Controller
     */
    var ProductPageController = _class(BasePageController,
        {
            /**
             * Init 
             *
             */
            init: function () {
                this.allowCheckout = sessionStorage.getItem('bread-disable-product-checkout') != 'on';
            },

            /**
             * @var	string 		Button HTML
             */
            buttonHtml: '<tr><td><div id="bread-checkout-btn" class="bread-checkout-btn" style="margin: 5px auto;"></div></td></tr>',

            /**
             * Make bread buttons
             *
             * @return	void
             */
            makeBread: function (integrationKey) {
                var self = this;

                var Payments;
                if (sessionStorage.getItem("tenant_prefix") === "rbc") {
                    Payments = window.RBCPayPlan;
                } else {
                    Payments = window.BreadPayments;
                }


                // Inserts the bread button underneath the Product
                var button = $(this.buttonHtml);
                this.insertButton(button);

                /** 
                 * Bread uses [placements] to fill in information about the product and apply it to the pre-qualification button.
                 * In order to get that information, we run getCheckoutParams, which returns information about that product.
                 * The actual product info is stored in a parameter called "items" (even though there's only one).
                 * The item info is added to productArray, which we can then access to get price and other necessary info.
                 * We then add that info to the placement, which is pushed to bread via registerPlacements() to generate buttons with applicable prices.
                 */

                const refreshBread = function () {

                    let qty;

                    const qtySelector = $('input[name*="QTY"]');
                    if (qtySelector[0] !== undefined) {
                        qty = qtySelector[0].value;
                    } else {
                        qty = 1;
                    }


                    let placements = [];
                    let item = self.getCheckoutParams();
                    let productArray = item.items;
                    let price = productArray[0].price * qty;
                    let product_code = productArray[0].sku;

                    // Check that the price is between min and max set prices
                    if (self.minMaxCheck(productArray[0].price)) {
                        // Check if products are filtered out of Bread availability
                        if (self.skuCheck(product_code)) {
                            // Check if the product page has options. If yes, display only "Low Monthly Payments"
                            if (!self.optionsCheck()) {
                                const currency = sessionStorage.getItem("currency")
                                placements.push({
                                    financingType: "installment",
                                    domID: "bread-checkout-btn",
                                    allowCheckout: false,
                                    order: {
                                        items: [],
                                        subTotal: {
                                            value: price,
                                            currency: currency,
                                        },
                                        totalDiscounts: {
                                            value: 0,
                                            currency: currency,
                                        },
                                        totalShipping: {
                                            value: 0,
                                            currency: currency,
                                        },
                                        totalTax: {
                                            value: 0,
                                            currency: currency,
                                        },
                                        totalPrice: {
                                            value: price,
                                            currency: currency,
                                        },
                                    }
                                });
                            } else {
                                placements.push({
                                    financingType: "installment",
                                    domID: "bread-checkout-btn",
                                    allowCheckout: false,
                                })
                            }



                            Payments.setup({
                                integrationKey: integrationKey
                            });

                            Payments.registerPlacements(placements);
                            Payments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                            Payments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                            Payments.on('INSTALLMENT:INITIALIZED', () => { });
                            Payments.__internal__.init();

                        };
                    };
                };

                $('button[class*="vol-cartqty"]').on("click", function () { refreshBread() });
                $('select[name*="SELECT"]').change(function () { refreshBread() });
                refreshBread();
            },

            optionsCheck: function () {
                /**
                 * The actual monetary value associated with an option is not stored anywhere prior to it being added to the total price.
                 * In order to avoid potential misalignment between the true total and the total displayed on the button,
                 * this function checks if a product has options (a warranty, for example) and, if so, displays the XXX button instead of the
                 * placement with the calculated price. This is to avoid having to scrape the HTML in a variety of different ways.
                 */

                const optionVal = $('select[name*="SELECT_"]').val();
                // Check that this item actually has options to choose from
                if (optionVal) {
                    return true;
                } else return false;
            },

            /**
             * Insert the button into the page
             *
             * @param	jquery		button			The jquery wrapped button element
             * @return	void
             */
            insertButton: function (button) {

                const addToCartButton = $("input[name$='addtocart']");
                button.insertAfter(addToCartButton)

            },

            /**
             * Get the bread checkout parameters
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	object
             */
            getCheckoutParams: function (html) {
                var self = this;
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');

                // product details
                var items = [{
                    name: this.getProductName(html),
                    price: this.getProductPrice(html),
                    sku: this.getProductSku(html),
                    imageUrl: this.getProductImage(html),
                    quantity: this.getProductQuantity(html),
                    detailUrl: location.href,
                    options: self.page.getOptionsFromPage(html)
                }];

                // checkout options
                var opts = {
                    buttonId: 'bread-checkout-btn',
                    items: items,
                    calculateTax: function (shippingContact, callback) {
                        $.when(self.getCheckoutTotals(items, shippingContact, true)).done(function (result) {
                            callback(null, result.tax);
                        });
                    },
                    calculateShipping: function (shippingContact, callback) {
                        $.when(self.getCheckoutTotals(items, shippingContact, true)).done(function (result) {
                            callback(null, result.shipping);
                        });
                    }
                };

                return $.extend(this.parent.getCheckoutParams.apply(this), opts);
            },

            /**
             * Get the product name
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	string
             */
            getProductName: function (html) {
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');
                return product.find('[itemprop=name]').text().trim();
            },

            /**
             * Get the product price
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	int
             */
            getProductPrice: function (html) {
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');
                return parseInt(parseFloat(product.find('[itemprop=price]').attr('content')) * 100);
            },

            /**
             * Get the product sku
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	string
             */
            getProductSku: function (html) {
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');
                return product.find('.product_code').text() || window.global_Current_ProductCode;
            },

            /**
             * Get the product image url
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	string
             */
            getProductImage: function (html) {
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');
                return product.find('#product_photo').data('image-path') || product.find('#product_photo').attr('src');
            },

            /**
             * Get the product quantity
             *
             * @param	string|jQuery|undefined		html		Page to get checkout params from			
             * @return	int
             */
            getProductQuantity: function (html) {
                var page = html ? $(html) : $(document);
                var product = page.find('table[id$="product-parent"]');
                return parseInt(product.find('input[class$="cartqty"]').val() || 1);
            }
        });

    /**
     * [Model] Cart Page Controller
     */
    var CartPageController = _class(BasePageController,
        {
            /**
             * @var	string 		Button HTML
             */
            buttonHtml: '<tr><td colspan="2"><div id="bread-checkout-btn" class="bread-checkout-btn" style="float:right; width: 300px;"></div></td></tr>',

            /**
             * @var	boolean		Clear cart after checkout
             */
            clearCart: true,

            /**
             * Init 
             *
             */
            init: function () {
                this.allowCheckout = sessionStorage.getItem('bread-disable-cart-checkout') != 'on';
            },

            /**
             * Make bread buttons
             *
             * @return	void
             */
            makeBread: function (integrationKey) {
                const self = this;
                const button = $(this.buttonHtml);
                this.insertButton(button);

                var Payments;
                if (sessionStorage.getItem("tenant_prefix") === "rbc") {
                    Payments = window.RBCPayPlan;
                } else {
                    Payments = window.BreadPayments;
                }


                const placements = [];

                $.when(this.getCheckoutParams()).done(function (params) {

                    const productArray = params.items;
                    let price = 0;
                    let excluded_products = [];

                    productArray.forEach(item => {
                        price += item.price * item.quantity;
                        const product_code = item.sku;
                        const product_name = item.name;

                        // Check if products are filtered out of Bread availability
                        if (!self.skuCheck(product_code)) {
                            excluded_products.push(product_name);
                        };

                    });

                    // Check that the price is between min and max set prices
                    if (self.minMaxCheck(price)) {
                        if (excluded_products.length === 0) {
                            const currency = sessionStorage.getItem("currency");

                            placements.push({
                                financingType: "installment",
                                domID: "bread-checkout-btn",
                                allowCheckout: false,
                                order: {
                                    items: [],
                                    subTotal: {
                                        value: price,
                                        currency: currency,
                                    },
                                    totalDiscounts: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalShipping: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalTax: {
                                        value: 0,
                                        currency: currency,
                                    },
                                    totalPrice: {
                                        value: price,
                                        currency: currency,
                                    },
                                }
                            });

                            Payments.setup({
                                integrationKey: integrationKey
                            });

                            Payments.registerPlacements(placements);
                            Payments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                            Payments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                            Payments.on('INSTALLMENT:INITIALIZED', () => { });
                            Payments.__internal__.init();
                        };
                    };
                });
            },

            /**
             * Insert the button into the page
             *
             * @param	jquery		button			The jquery wrapped button element
             * @return	void
             */
            insertButton: function (button) {
                var table = $('table[id$="cart-checkout-parent"]');
                button.insertAfter(table.find('tr').eq(0));
            },

            /**
             * Get the bread checkout parameters
             *
             * @return	$.Deferred
             */
            getCheckoutParams: function () {
                var self = this;
                var items = [];
                var cart_discounts = [];
                var cart_surcharges = [];
                var products = $('.v65-cart-details-row');
                var discounts = $('[class$="cart-giftcert-details-row"]');
                var detailsRequests = [];
                var checkoutParams = $.Deferred();
                var cartID = 0;

                if (window.BREAD_USE_AJAX_CART) {
                    // fetch products details
                    detailsRequests.push(this.getCartItems().done(function (_items) {
                        items.push.apply(items, _items);
                    }));
                }
                else {
                    // scrape products details
                    products.each(function () {
                        var product = $(this);
                        cartID += 1;
                        if (product.find('.cart-item-name').length) {
                            cartID = product.find('.cart-item-name').attr('href').match(/CartID=(\d+)/)[1] || cartID;
                            detailsRequests.push($.get('/Help_CartItemDetails.asp?CartID=' + cartID, function (itemDetailsPage) {
                                items.push({
                                    name: product.find('a.cart-item-name').text().trim(),
                                    price: parseInt(parseFloat(product.children('td').filter(function () { return $(this).text().trim().indexOf(self.c_prefix) === 0; }).eq(0).text().trim().split(self.c_prefix)[1].replace(',', '')) * 100),
                                    sku: getProductCodeFromUrl(product.find('a[href*="ProductCode"]').attr('href')),
                                    imageUrl: product.find('[class$="cart-detail-productimage"] img').data('image-path') || product.find('[class$="cart-detail-productimage"] img').attr('src'),
                                    detailUrl: location.protocol + '//' + location.hostname + '/' + product.find('a.cart-item-name').attr('href'),
                                    quantity: parseInt(product.find('input[name^="Quantity"]').val()),
                                    options: self.page.getOptionsFromPage(itemDetailsPage)
                                });
                            }));
                        }
                    });
                }

                discounts.each(function () {
                    var discount = $(this);
                    var discountAmount = parseInt(parseFloat(discount.find('.carttext').eq(1).text().trim().replace(self.c_prefix, '').replace(',', '')) * 100);
                    var description = discount.find('.carttext').eq(0).text().trim();
                    if (discountAmount < 0) {
                        cart_discounts.push({
                            description: description,
                            amount: Math.abs(discountAmount)
                        });
                    } else if (discountAmount > 0) {
                        cart_surcharges.push({
                            name: description,
                            price: discountAmount,
                            sku: 'SURCHARGE',
                            detailUrl: location.protocol + '//' + location.hostname,
                            quantity: 1
                        });
                    }
                });

                $.when.apply($, detailsRequests).done(function () {
                    items.push.apply(items, cart_surcharges);

                    // checkout options
                    var opts = {
                        buttonId: 'bread-checkout-btn',
                        items: self.flattenItems(items),
                        discounts: cart_discounts,
                        calculateTax: function (shippingContact, callback) {
                            $.when(self.getCheckoutTotals(items, shippingContact)).done(function (result) {
                                callback(null, result.tax);
                            });
                        },
                        calculateShipping: function (shippingContact, callback) {
                            $.when(self.getCheckoutTotals(items, shippingContact)).done(function (result) {
                                callback(null, result.shipping);
                            });
                        }
                    };

                    checkoutParams.resolve($.extend(self.parent.getCheckoutParams.apply(self), opts));
                });

                return checkoutParams;
            }
        });

    /**
     * [Model] Checkout Page Controller
     */
    var CheckoutPageController = _class(BasePageController,
        {
            /**
             * @var	string 		Button HTML
             */
            buttonHtml: '<div id="bread-checkout-btn" class="bread-checkout-btn" style="float:right; width: 300px;"></div>',

            /**
             * @var	boolean		Clear cart after checkout
             */
            clearCart: true,

            /**
             * Depending on if the customer has chosen to replace the default volusion 
             * place order button or not, either this function or makeBread will be called
             */

            makeBreadReplaceButton: function (integrationKey) {
                const self = this;
                const tenantName = sessionStorage.getItem("tenant_name");
                let breadInit = false;
                let shippingChoice = "0";

                var Payments;
                if (sessionStorage.getItem("tenant_prefix") === "rbc") {
                    Payments = window.RBCPayPlan;
                } else {
                    Payments = window.BreadPayments;
                };

                $("#PaymentMethodTypeDisplay").change(function () {
                    // Initialize the Bread Pay modal once the buyer chooses the Bread Pay option
                    const tenantNameNoSpaces = tenantName.replace(/\s/g, '');
                    if ($("#PaymentMethodType").val() === `${tenantNameNoSpaces}™—PayOverTime`) {

                        // Hide the standard volusion button and replace it with the Bread Pay Option
                        $("#btnSubmitOrder").hide();
                        const breadButton = `<button class="w-100 btn btn-primary btn-lg" id="bread-checkout-btn" type="button" style="display: inline-block; margin: 5px auto; font-family: Poppins, sans-serif;">${tenantName}™ — Pay Over Time</button>`;
                        $("#btnSubmitOrder").before(breadButton);

                        // Ensure they have chosen a shipping option before proceeding
                        if (document.getElementsByName("ShippingSpeedChoice").length > 0) {
                            shippingChoice = document.getElementsByName("ShippingSpeedChoice")[0].value;
                        };

                        /**
                        * Check that the Bread Pay Modal has not already been initialized.
                        * This prevents a possible bug if the buyer switches back and forth between Bread Pay and other payment options.
                        * It also prevents the buyer from opening the modal without a shipping option chosen.
                        */
                        if ($('input[name="ShipResidential"]').is(':checked') || $('input[name="ShipResidential"]').length <= 1) {
                            if (!breadInit && shippingChoice !== "0" && shippingChoice) {
                                /**
                                 * Connect to and initialize the Bread SDK
                                 */
                                getBreadParams().then(breadParams => {
                                    // Check that total is above $50.00
                                    if (breadParams.placement.order.totalPrice.value >= 5000) {
                                        if (sessionStorage.getItem("bread_embedded_checkout") !== "on") {
                                            Payments.setup({
                                                integrationKey: integrationKey,
                                                buyer: breadParams.buyer
                                            });
                                        } else {
                                            const td = $('#divbtnSubmitOrder');
                                            td.before("<div id='checkout-container'></div>");

                                            Payments.setEmbedded(true);

                                            Payments.setup({
                                                integrationKey: integrationKey,
                                                buyer: breadParams.buyer,
                                                containerID: "checkout-container"
                                            });
                                        };

                                        Payments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                                        Payments.on('INSTALLMENT:INITIALIZED', () => { });
                                        Payments.on('INSTALLMENT:APPLICATION_CHECKOUT', response => {
                                            /**
                                             * When the buyer completes the Bread Modal process,
                                             * this function collects that data and sends it to the Bread Merchant Portal
                                             * and the Volusion Admin Portal.
                                             */

                                            let breadData = breadParams.data;
                                            breadData.tx_id = response.transactionID;
                                            breadData.contactInfo.email = response.billingContact.email; // when a buyer is logged in, their email will be undefined in the params, so we double check it here
                                            breadData.contactInfo = JSON.stringify(breadData.contactInfo);

                                            // Add in any variable options selected for the product
                                            $.each(breadParams.params.items, function (i, item) {
                                                if (item.options) {
                                                    if (item.options._values) {
                                                        breadData[item.sku + '_options'] = item.options._values.join('');
                                                    }
                                                }
                                            });

                                            // Send along the order items to process. The bread backend doesnt maintain
                                            // the correct order of transaction line items, so we may need this.
                                            breadData.items = breadParams.params.items.map(function (item) {
                                                var line = Object.assign({}, item);
                                                line.product = { name: line.name };
                                                delete line.name;
                                                return line;
                                            });

                                            breadData.items = JSON.stringify(breadData.items)

                                            breadData.discounts = breadParams.params.discounts.map(function (item) {
                                                var line = Object.assign({}, item);
                                                return line;
                                            });

                                            breadData.discounts = JSON.stringify(breadData.discounts);

                                            $.ajax({
                                                method: 'post',
                                                dataType: 'json',
                                                url: BREAD_ORDER_PROCESSING_URL,
                                                data: breadData
                                            }).then(function (response) {
                                                if (response.success) {
                                                    if (self.clearCart) {
                                                        self.setCookie(self.cart_cookie, '');
                                                    }
                                                    self.orderComplete(response, breadParams.params);
                                                } else {
                                                    alert(response.message);
                                                }
                                            });
                                        });
                                        Payments.init();
                                    } else {
                                        resetBreadButton(tenantName, "total");
                                    }
                                });

                            } else if (shippingChoice === "0" || !shippingChoice) {
                                resetBreadButton(tenantName);
                            } else if (breadInit) {
                                self.zoidNodeCheck();
                            };

                            // When the Bread Pay Button is clicked:
                            $("#bread-checkout-btn").on("click", () => {
                                if (shippingChoice === "0") {
                                    /**
                                     * Shipping options are the only thing that cannot be updated or corrected in the Bread Pay modal.
                                     * This check prevents buyers from moving forward without having chosen a shipping option.
                                     */
                                    alert("Please choose a shipping option");
                                } else {
                                    // Open the Bread Pay modal and begin checkout.
                                    $("#bread-btn-loading").show()
                                    breadModalOpen();
                                    $("#bread-btn-loading").hide()
                                    breadInit = true;
                                }
                            });
                        } else {
                            resetBreadButton(tenantName);
                        };
                    } else {
                        // Remove the Bread Pay button and reveal the Volusion one when the buyer switches from Bread Pay to another payment type
                        $("#bread-checkout-btn").remove();
                        $("#btnSubmitOrder").show();
                    };
                });

                const resetBreadButton = (tenantName, resetReason = "") => {
                    $("#PaymentMethodTypeDisplay").prop("selectedIndex", 0);
                    $("#bread-checkout-btn").remove();
                    $("#btnSubmitOrder").show();
                    if (resetReason === "total") {
                        alert(`${tenantName} Requires a Total of $50 or More.`);
                    } else {
                        alert("Please complete your contact information.");
                    };
                };

                const breadModalOpen = async () => {
                    /**
                     * Open the Bread Pay Modal
                     */

                    const breadParams = await getBreadParams();

                    $("#bread-btn-loading").hide();
                    Payments.registerPlacements([breadParams.placement]);
                    Payments.openExperienceForPlacement([breadParams.placement]);

                };

                const getBreadParams = async () => {
                    /**
                     * Collect and organize the data needed for checkout
                     */

                    return new Promise((resolve, reject) => {

                        let buyer = {};
                        let placement;
                        let data;

                        $.when(self.getCheckoutParams()).done(function (params) {

                            const shippingChoice = self.getShippingChoice(params.taxAndShipping.shipping);
                            const currency = sessionStorage.getItem("currency");

                            if (shippingChoice == undefined) {
                                $("#bread-btn-loading").hide();
                                alert("Please complete your shipping information before proceeding.");
                            }

                            self.zoidNodeCheck();

                            if (shippingChoice !== "TBD") {
                                // Check for and remove trailing whitespace from shipping descripion
                                shippingChoice.type = shippingChoice.type.trim()

                                // Check for BOPIS and assign pickup address if necessary.
                                if (shippingChoice.type === "In-store Pickup") {
                                    ShippingOrPickupAddress = {
                                        address1: sessionStorage.getItem("bopis_address_1"),
                                        address2: sessionStorage.getItem("bopis_address_2"),
                                        country: params.billingAddress.country,
                                        locality: sessionStorage.getItem("bopis_address_locality"),
                                        region: sessionStorage.getItem("bopis_address_region"),
                                        postalCode: sessionStorage.getItem("bopis_address_postalcode")
                                    };
                                } else {
                                    ShippingOrPickupAddress = params.shippingAddress
                                };

                                buyer = {
                                    givenName: params.givenName,
                                    familyName: params.familyName,
                                    additionalName: "",
                                    birthDate: "",
                                    email: params.email,
                                    phone: params.phone,
                                    billingAddress: params.billingAddress,
                                    shippingAddress: ShippingOrPickupAddress
                                };

                                const totalShipping = shippingChoice.cost

                                const totalTaxString = $("#TotalsTax1TD").text();
                                const totalTax = Math.round(Number(totalTaxString.replace(/[^0-9.-]+/g, "")) * 100);
                                let excluded_products = [];

                                let subTotal = 0;
                                params.items.forEach(item => {
                                    const product_code = item.sku;
                                    const product_name = item.name;

                                    // Check if products are filtered out of Bread availability
                                    if (!self.skuCheck(product_code)) {
                                        excluded_products.push(product_name);
                                    };

                                    subTotal += item.unitPrice.value * item.quantity;
                                    item.shippingCost = {
                                        value: totalShipping,
                                        currency: currency,
                                    };
                                    item.unitTax = {
                                        value: 0,
                                        currency: currency,
                                    };
                                    item.shippingDescription = shippingChoice.type

                                });

                                let totalPrice;

                                // Check if the buyer has any excluded products in their cart.
                                if (excluded_products.length > 0) {
                                    alert(`The following items are not available for purchase via Bread: ${excluded_products}. To pay over time with ${tenantName}, remove them from your cart and try again.`);
                                    return;
                                } else {
                                    // Check that the price is between min and max set prices
                                    if (self.minMaxCheck(subTotal)) {

                                        let totalDiscounts = 0;
                                        params.discounts.forEach(discount => {
                                            totalDiscounts += discount.amount;
                                        });

                                        totalPrice = subTotal + totalTax + totalShipping - totalDiscounts;

                                        placement = {
                                            locationType: "checkout",
                                            domID: "bread-checkout-btn",
                                            allowCheckout: true,
                                            order: {
                                                items: params.items,
                                                subTotal: {
                                                    value: subTotal,
                                                    currency: currency,
                                                },
                                                totalTax: {
                                                    value: totalTax,
                                                    currency: currency,
                                                },
                                                totalShipping: {
                                                    value: totalShipping,
                                                    currency: currency,
                                                },
                                                totalDiscounts: {
                                                    value: totalDiscounts,
                                                    currency: currency,
                                                },
                                                totalPrice: {
                                                    value: totalPrice,
                                                    currency: currency,
                                                },
                                            }
                                        };

                                        if (shippingChoice.type === "In-store Pickup") {
                                            placement.order.fulfillmentType = "PICKUP";
                                            placement.order.pickupInformation = {
                                                name: {
                                                    givenName: sessionStorage.getItem("bopis_contact_firstname"),
                                                    familyName: sessionStorage.getItem("bopis_contact_lastname"),
                                                    additionalName: sessionStorage.getItem("bopis_contact_additionalname"),
                                                },
                                                phone: sessionStorage.getItem("bopis_contact_phone"),
                                                address: ShippingOrPickupAddress,
                                                email: sessionStorage.getItem("bopis_contact_email"),
                                            };
                                        };
                                    };
                                };

                                // The jsonHelper Decode function in the asp folder breaks nested objects, 
                                // so I have to send the customer contact info here or else it doesn't work,
                                // But I also have to restructure it so there are no nested objects

                                let contactInfo = {
                                    firstName: params.givenName,
                                    lastName: params.familyName,
                                    fullName: `${params.givenName} ${params.familyName}`,
                                    email: params.email,
                                    phone: params.phone
                                }

                                // asp can't parse JSON natively, so we have to transform these objects into strings
                                // the use jsonHelper to convert and manipulate them in the asp files.

                                data = {
                                    shippingID: shippingChoice.typeId,
                                    amount: JSON.stringify({ currency: currency, value: totalPrice }),
                                    billingAddress: JSON.stringify(params.billingAddress),
                                    shippingAddress: JSON.stringify(ShippingOrPickupAddress),
                                    contactInfo: contactInfo // we need to add another item to this object later, so we stringify it then.
                                };

                                const response = { "buyer": buyer, "placement": placement, "data": data, "params": params }

                                resolve(response);

                            } else if (shippingChoice == "TBD" && $('[id*="zoid-checkout-component"]').length == 0) {
                                alert("Please choose a shipping option.");
                            } else {
                                self.zoidNodeCheck();
                            };
                        });
                    });
                };
            },

            makeBread: function (integrationKey) {

                const self = this;
                const tenantName = sessionStorage.getItem("tenant_name");
                const currency = sessionStorage.getItem("currency");

                var Payments;
                if (sessionStorage.getItem("tenant_prefix") === "rbc") {
                    Payments = window.RBCPayPlan;
                } else {
                    Payments = window.BreadPayments;
                }

                /**
                 * These elements are added to the page, and then shown or hidden appropriately based on 
                 * if the buyer has met the relevant criteria. This prevents them from doing something like 
                 * opening the Bread Pay modal before having chosen a shipping option.
                 */
                let button = $(this.buttonHtml);
                this.insertButton(button);
                const placeHolderHTML = `<div id="bread-btn-placeholder" style="float:right; width: 300px;">*Please choose a shipping option to check out with ${tenantName}™</div>`
                const loadingHTML = `<div id="bread-btn-loading" style="float:right; width: 300px;">${tenantName}™ Checkout Loading...</div>`
                $('#bread-checkout-btn').before(placeHolderHTML);
                $('#bread-checkout-btn').before(loadingHTML);
                $('#bread-btn-placeholder').hide();
                $('#bread-btn-loading').hide();

                const refreshCheckoutParams = function () {

                    self.zoidNodeCheck();

                    $("#bread-checkout-btn").hide();
                    $('#bread-btn-placeholder').hide();
                    $('#bread-btn-loading').show();

                    $.when(self.getCheckoutParams()).done(function (params) {
                        const shippingChoice = self.getShippingChoice(params.taxAndShipping.shipping);
                        if ($('input[name="ShipResidential"]').is(':checked') || $('input[name="ShipResidential"]').length <= 1) {
                            
                            let ShippingOrPickupAddress = {};
                            if (shippingChoice !== "TBD" && shippingChoice !== undefined) {
                                // Check for and remove trailing whitespace from shipping descripion
                                shippingChoice.type = shippingChoice.type.trim()

                                // Check for BOPIS and assign pickup address if necessary.
                                if (shippingChoice.type === "In-store Pickup") {
                                    ShippingOrPickupAddress = {
                                        address1: sessionStorage.getItem("bopis_address_1"),
                                        address2: sessionStorage.getItem("bopis_address_2"),
                                        country: params.billingAddress.country,
                                        locality: sessionStorage.getItem("bopis_address_locality"),
                                        region: sessionStorage.getItem("bopis_address_region"),
                                        postalCode: sessionStorage.getItem("bopis_address_postalcode")

                                    };
                                } else {
                                    ShippingOrPickupAddress = params.shippingAddress
                                };

                                $("#bread-checkout-btn").show();
                                $('#bread-btn-placeholder').hide();
                                $('#bread-btn-loading').hide();

                                const buyer = {
                                    givenName: params.givenName,
                                    familyName: params.familyName,
                                    additionalName: "",
                                    birthDate: "",
                                    email: params.email,
                                    phone: params.phone,
                                    billingAddress: params.billingAddress,
                                    shippingAddress: ShippingOrPickupAddress
                                };

                                if (sessionStorage.getItem("bread_embedded_checkout") !== "on") {
                                    Payments.setup({
                                        integrationKey: integrationKey,
                                        buyer: buyer
                                    });
                                } else {
                                    const td = $('#divbtnSubmitOrder');
                                    td.before("<div id='checkout-container'></div>");

                                    Payments.setEmbedded(true);

                                    Payments.setup({
                                        integrationKey: integrationKey,
                                        buyer: buyer,
                                        containerID: "checkout-container"
                                    });
                                };

                                const totalShipping = shippingChoice.cost;
                                const totalTax = params.taxAndShipping.tax;

                                let excluded_products = [];

                                let subTotal = 0;
                                params.items.forEach(item => {
                                    const product_code = item.sku;
                                    const product_name = item.name;

                                    // Check if products are filtered out of Bread availability
                                    if (!self.skuCheck(product_code)) {
                                        excluded_products.push(product_name);
                                    };

                                    subTotal += item.unitPrice.value * item.quantity;
                                    item.shippingCost = {
                                        value: totalShipping,
                                        currency: currency,
                                    };
                                    item.unitTax = {
                                        value: 0,
                                        currency: currency,
                                    };
                                    item.shippingDescription = shippingChoice.type
                                });

                                let totalPrice;

                                // Check if the buyer has any excluded products in their cart.
                                if (excluded_products.length > 0) {
                                    alert(`The following items are not available for purchase via Bread: ${excluded_products}. To pay over time with ${tenantName}, remove them from your cart and try again.`);
                                    return;
                                } else {
                                    // Check that the price is between min and max set prices
                                    if (self.minMaxCheck(subTotal)) {

                                        let totalDiscounts = 0;
                                        params.discounts.forEach(discount => {
                                            totalDiscounts += discount.amount;
                                        });

                                        totalPrice = subTotal + totalTax + totalShipping - totalDiscounts;

                                        placement = {
                                            locationType: "checkout",
                                            domID: "bread-checkout-btn",
                                            allowCheckout: true,
                                            order: {
                                                items: params.items,
                                                subTotal: {
                                                    value: subTotal,
                                                    currency: currency,
                                                },
                                                totalTax: {
                                                    value: totalTax,
                                                    currency: currency,
                                                },
                                                totalShipping: {
                                                    value: totalShipping,
                                                    currency: currency,
                                                },
                                                totalDiscounts: {
                                                    value: totalDiscounts,
                                                    currency: currency,
                                                },
                                                totalPrice: {
                                                    value: totalPrice,
                                                    currency: currency,
                                                },
                                            }
                                        };
                                    };
                                };

                                if (shippingChoice.type === "In-store Pickup") {
                                    placement.order.fulfillmentType = "PICKUP";
                                    placement.order.pickupInformation = {
                                        name: {
                                            givenName: sessionStorage.getItem("bopis_contact_firstname"),
                                            familyName: sessionStorage.getItem("bopis_contact_lastname"),
                                            additionalName: sessionStorage.getItem("bopis_contact_additionalname"),
                                        },
                                        phone: sessionStorage.getItem("bopis_contact_phone"),
                                        address: ShippingOrPickupAddress,
                                        email: sessionStorage.getItem("bopis_contact_email"),
                                    };
                                }

                                if (totalPrice >= 5000) {
                                    Payments.registerPlacements([placement]);
                                    Payments.on('INSTALLMENT:APPLICATION_CHECKOUT', response => {
                                        // The jsonHelper Decode function in the asp folder breaks nested objects, 
                                        // so I have to send the customer contact info here or else it doesn't work,
                                        // But I also have to restructure it so there are no nested objects

                                        let contactInfo = {
                                            firstName: params.givenName,
                                            lastName: params.familyName,
                                            fullName: `${params.givenName} ${params.familyName}`,
                                            email: response.billingContact.email,
                                            phone: params.phone
                                        }

                                        // asp can't parse JSON natively, so we have to transform these objects into strings
                                        // the use jsonHelper to convert and manipulate them in the asp files.

                                        let breadData = {
                                            tx_id: response.transactionID,
                                            shippingID: shippingChoice.typeId,
                                            amount: JSON.stringify({ currency: sessionStorage.getItem("currency"), value: totalPrice }),
                                            billingAddress: JSON.stringify(params.billingAddress),
                                            shippingAddress: JSON.stringify(ShippingOrPickupAddress),
                                            contactInfo: JSON.stringify(contactInfo)
                                        };

                                        //  Add in any variable options selected for the product
                                        $.each(params.items, function (i, item) {
                                            if (item.options) {
                                                if (item.options._values) {
                                                    breadData[item.sku + '_options'] = item.options._values.join('');
                                                }
                                            }
                                        });

                                        // Send along the order items to process. The bread backend doesnt maintain
                                        // the correct order of transaction line items, so we may need this.
                                        breadData.items = params.items.map(function (item) {
                                            var line = Object.assign({}, item);
                                            line.product = { name: line.name };
                                            delete line.name;
                                            return line;
                                        });

                                        breadData.items = JSON.stringify(breadData.items);

                                        breadData.discounts = params.discounts.map(function (item) {
                                            var line = Object.assign({}, item);
                                            return line;
                                        });

                                        breadData.discounts = JSON.stringify(breadData.discounts);

                                        $.ajax({
                                            method: 'post',
                                            dataType: 'json',
                                            url: BREAD_ORDER_PROCESSING_URL,
                                            data: breadData
                                        }).then(function (response) {
                                            if (response.success) {
                                                if (self.clearCart) {
                                                    self.setCookie(self.cart_cookie, '');
                                                }
                                                self.orderComplete(response, params);
                                            } else {
                                                alert(response.message);
                                            }
                                        });

                                        Payments.on('INSTALLMENT:INITIALIZED', () => { });

                                    });
                                } else {
                                    // If the cart is less than $50, do not allow checkout
                                    $("#bread-btn-loading").hide();
                                    $("#bread-checkout-btn").hide();
                                    $("#bread-btn-placeholder").hide();
                                };
                            } else {
                                /**
                                 * If the buyer has not yet chosen a shipping option, we hide the button that would open the modal until they do so.
                                 */
                                $("#bread-checkout-btn").hide();
                                $("#bread-btn-placeholder").show();
                                $("#bread-btn-loading").hide();
                                $('#bread-btn-checkout').hide();
                            };
                        } else {
                            $("#bread-checkout-btn").hide();
                            $("#bread-btn-placeholder").show();
                            $("#bread-btn-loading").hide();
                            $('#bread-btn-checkout').hide();
                        }
                        Payments.__internal__.init();
                    });
                };

                // Reapply the checkout options any time a contact info field changes
                $.each([
                    'BillingFirstName', 'ShipFirstName',
                    'BillingLastName', 'ShipLastName',
                    'BillingAddress1', 'ShipAddress1',
                    'BillingAddress2', 'ShipAddress2',
                    'BillingPostalCode', 'ShipPostalCode',
                    'BillingCity', 'ShipCity',
                    'BillingState', 'ShipState',
                    'BillingPhoneNumber', 'ShipPhoneNumber',
                    'BillingCountry', 'ShipResidential'
                ], function (i, name) {
                    $('input[name="' + name + '"]').on('change', refreshCheckoutParams);
                });
                $("#DisplayShippingSpeedChoicesTD").change(function () { refreshCheckoutParams() })
                $("#v65-cart-billemail").change(function () { refreshCheckoutParams() })

                refreshCheckoutParams();

            },

            getShippingChoice: function (shippingArray) {
                /**
                 * Get shipping information from the buyer's choices on the checkout page
                 */

                if (document.getElementsByName("ShippingSpeedChoice").length > 0) {
                    const shippingID = document.getElementsByName("ShippingSpeedChoice")[0].value;

                    for (let i = 0; i < shippingArray.length; i++) {
                        if (shippingArray[i].typeId === shippingID) {
                            return shippingArray[i];
                        }
                    };
                } else {
                    return "TBD";
                };
            },

            insertButton: function (button) {
                var td = $('#divbtnSubmitOrder');
                td.before(button);
            },

            zoidNodeCheck: function () {
                const tenant_name = sessionStorage.getItem("tenant_name")
                if ($('[id*="zoid-checkout-component"]').length > 0) {
                    /**
                     * Volusion does not separate checkout from filling our your billing details, including shipping choice.
                     * This can cause an issue where the buyer can potentially initialized Bread Pay, then close it,
                     * then change their checkout details, and repoen the modal again, which will still have the old checkout details, including shipping costs.
                     * 
                     * At time of writing, there is a backlog ticket to address this issue in the modal directly. In the meantime,
                     * this check should prevent the buyer from checking out with changed shipping information.
                     */
                    if (confirm(`Please click OK to refresh the page to update your shipping option and check out with ${tenant_name}. Your information will be saved in the form.`)) {
                        location.reload();
                    };
                };
            },

            /**
             * Get the bread checkout parameters
             *
             * @return	$.Deferred
             */
            getCheckoutParams: function () {
                var self = this;
                var items = [];
                var cart_discounts = [];
                var cart_surcharges = [];
                var cartID = 0;
                var lineitems = $('table[id$="onepage-ordersummary-items"] tr').slice(1);
                var detailsRequests = [];
                var checkoutParams = $.Deferred();

                const currency = sessionStorage.getItem("currency");

                if (window.BREAD_USE_AJAX_CART) {
                    // fetch products details
                    detailsRequests.push(this.getCartItems().done(function (_items) {
                        items.push.apply(items, _items);
                    }));
                }
                else {
                    // scrape products details
                    lineitems.each(function () {
                        var lineitem = $(this);
                        var rows = lineitem.find('td');
                        var itemSku = rows.filter('[class$="ordersummary-itemcode"]').text().trim();
                        var price = rows.filter('[class$="ordersummary-itemtotal"]').text().trim();
                        var quantity = parseInt(rows.filter('[class$="ordersummary-itemqty"]').text().trim());
                        var price_in_cents = parseInt((parseFloat(price.replace(self.c_prefix, '').replace(',', '')) * 100) / quantity);
                        var name = rows.filter('[class$="ordersummary-itemname"]').text().trim();

                        // Check if this line item is a discount
                        if (price.indexOf('-') === 0 || itemSku.indexOf('DSC-') === 0) {
                            if (price_in_cents < 0) {
                                cart_discounts.push({
                                    description: name + ' (' + itemSku + ')',
                                    amount: Math.abs(price_in_cents),
                                    productCode: itemSku
                                });
                            } else if (price_in_cents > 0) {
                                cart_surcharges.push({
                                    name: name + ' (' + itemSku + ')',
                                    unitPrice: {
                                        value: price_in_cents,
                                        currency: currency
                                    },
                                    sku: 'SURCHARGE',
                                    detailUrl: location.href,
                                    quantity: quantity
                                });
                            }
                        }
                        else {
                            cartID += 1;
                            if (price_in_cents > 0) {
                                detailsRequests.push($.get('/Help_CartItemDetails.asp?CartID=' + cartID, function (itemDetailsPage) {
                                    items.push({
                                        name: name,
                                        unitPrice: {
                                            value: price_in_cents,
                                            currency: currency
                                        },
                                        sku: itemSku,
                                        detailUrl: location.href,
                                        quantity: quantity,
                                        options: self.page.getOptionsFromPage(itemDetailsPage),
                                    });
                                }));
                            }
                        }
                    });
                }

                // Get a form value
                var formValue = function (name) {
                    return $('input[name="' + name + '"]').val();
                };

                let billingCountry = "";
                const billingCountryOptions = document.getElementsByName("BillingCountry")[0];
                for (let i = 0; i < billingCountryOptions.length; i++) {
                    if (billingCountryOptions[i].selected == true) {
                        switch (billingCountryOptions[i].value) {
                            case "Canada":
                                billingCountry = "CA";
                                break;
                            case "United States":
                                billingCountry = "US";
                                break;
                            default:
                                billingCountry = billingCountryOptions[i].value;
                        }
                    }
                }

                let shippingCountry = "";
                const shippingCountryOptions = document.getElementsByName("ShipCountry")[0];
                if (shippingCountryOptions === undefined) {
                    // Buyer has indicated billing and shipping addresses are the same
                    shippingCountry = billingCountry;
                } else {
                    for (let i = 0; i < shippingCountryOptions.length; i++) {
                        if (shippingCountryOptions[i].selected == true) {
                            switch (shippingCountryOptions[i].value) {
                                case "Canada":
                                    shippingCountry = "CA";
                                    break;
                                case "United States":
                                    shippingCountry = "US";
                                    break;
                                default:
                                    shippingCountry = shippingCountryOptions[i].value;
                            }
                        }
                    }
                }

                var billingContact = {
                    firstName: formValue('BillingFirstName'),
                    lastName: formValue('BillingLastName'),
                    address: formValue('BillingAddress1'),
                    address2: formValue('BillingAddress2'),
                    zip: formValue('BillingPostalCode'),
                    city: formValue('BillingCity'),
                    state: formValue('BillingState'),
                    phone: formValue('BillingPhoneNumber'),
                    email: formValue('Email'),
                    country: billingCountry
                };

                var shippingContact = {
                    firstName: formValue('ShipFirstName'),
                    lastName: formValue('ShipLastName'),
                    address: formValue('ShipAddress1'),
                    address2: formValue('ShipAddress2'),
                    zip: formValue('ShipPostalCode'),
                    city: formValue('ShipCity'),
                    state: formValue('ShipState'),
                    phone: formValue('ShipPhoneNumber'),
                    country: shippingCountry
                };

                $.when.apply($, detailsRequests).done(function () {
                    items.push.apply(items, cart_surcharges);

                    const taxAndShipping = {};
                    $.when(self.getCheckoutTotals(items, shippingContact)).done(function (result) {
                        taxAndShipping.shipping = result.shipping;
                        taxAndShipping.tax = result.tax;

                        // checkout options
                        var opts = {
                            domID: 'bread-checkout-btn',
                            givenName: billingContact.firstName,
                            familyName: billingContact.lastName,
                            email: billingContact.email,
                            phone: billingContact.phone,
                            billingAddress: {
                                address1: billingContact.address,
                                address2: billingContact.address2,
                                locality: billingContact.city,
                                region: billingContact.state,
                                postalCode: billingContact.zip,
                                country: billingCountry
                            },
                            shippingAddress: {
                                address1: shippingContact.address,
                                address2: shippingContact.address2,
                                locality: shippingContact.city,
                                region: shippingContact.state,
                                postalCode: shippingContact.zip,
                                country: shippingCountry
                            },
                            items: self.flattenItems(items),
                            discounts: cart_discounts,
                            taxAndShipping: taxAndShipping,
                        };

                        checkoutParams.resolve($.extend(self.parent.getCheckoutParams.apply(self), opts));
                    });
                });
                return checkoutParams;
            }
        });

    /**
     * [Model] Finished Page Controller
     */
    var FinishedPageController = _class(BasePageController, {});

    /**
     * Export page controllers to the global namespace so that controller methods
     * can be overridden on a site by site basis.
     */
    window.breadControllers = {
        base: BasePageController,
        category: CategoryPageController,
        product: ProductPageController,
        cart: CartPageController,
        checkout: CheckoutPageController,
        finished: FinishedPageController
    };

    /* Initialize when page is loaded */
    $(document).ready(function () {
        const initPage = function () {
            let breadEnv = sessionStorage.getItem('bread-environment');
            const integrationKey = sessionStorage.getItem("integration-key");
            // Check for the user's environment
            // Append the appropriate script to the page
            let script = document.createElement("script");
            script.type = "text/javascript";
            let script_url;

            if (breadEnv === "sandbox") {
                script_url = sessionStorage.getItem("sdk_sandbox");
            } else {
                script_url = sessionStorage.getItem("sdk_production");
            };

            // Set the appropriate script URL and append the script HTML tag to the store template
            script.src = script_url;

            script.onload = function () {
                console.log("Bread API Script Loaded Successfully")
                var page = new PageHelper();
                window.breadPage = page;
                if (sessionStorage.getItem('bread-disabled') != 'on' || location.search == '?bread_test') {
                    if (page.type === "product" && sessionStorage.getItem("bread-disable-product-button") === "on") {
                        console.log("Bread button disabled on this page")
                    } else if (page.type === "cart" && sessionStorage.getItem("bread-disable-cart-button") === "on") {
                        console.log("Bread button disabled on this page");
                    } else if (page.type === "category" && sessionStorage.getItem("bread-disable-category-button") === "on") {
                        console.log("Bread button disabled on this page");
                    } else {
                        if (page.type === "checkout" && sessionStorage.getItem("bread-replace-checkout-button") === "on") {
                            page.controller.makeBreadReplaceButton(integrationKey);
                        } else {
                            page.controller.makeBread(integrationKey);
                        }
                    };
                };
            };

            document.head.appendChild(script);

            // Micromodal.js
            // These scripts and files control the modal that pops up after the order has been completed via Bread Pay
            $('body').append('<script type="text/javascript" src="/v/bread/js/micromodal.min.js"></script>');
            $('body').append('<link rel="stylesheet" href="/v/bread/css/micromodal.css" />');

        };

        // Fetch environment 
        $.getJSON('/v/bread/asp/tenantSettings.asp', function (tenant_settings) {
            sessionStorage.setItem("tenant_name", tenant_settings.tenant_name);
            sessionStorage.setItem("tenant_prefix", tenant_settings.tenant_prefix);
            sessionStorage.setItem("sdk_sandbox", tenant_settings.sdk_sandbox);
            sessionStorage.setItem("sdk_production", tenant_settings.sdk_production);
            sessionStorage.setItem("currency", tenant_settings.currency);
        })

        $.getJSON('/v/bread/asp/breadSettings.asp', function (settings) {
            sessionStorage.setItem('bread-environment', settings.environment);
            sessionStorage.setItem('integration-key', settings.integration_key);
            sessionStorage.setItem('bread-disabled', settings.disable_autoload);
            sessionStorage.setItem("bread-disable-product-button", settings.disable_product_button);
            sessionStorage.setItem("bread-disable-cart-button", settings.disable_cart_button);
            sessionStorage.setItem("bread-disable-category-button", settings.disable_category_button);
            sessionStorage.setItem("bread-product-min", settings.bread_product_min);
            sessionStorage.setItem("bread-product-max", settings.bread_product_max);
            sessionStorage.setItem("bread_enable_sku_filter", settings.bread_enable_sku_filter);
            sessionStorage.setItem("bread_sku_filter_list", settings.bread_sku_filter_list);
            sessionStorage.setItem("bread_embedded_checkout", settings.bread_embedded_checkout);
            sessionStorage.setItem("bread-replace-checkout-button", settings.bread_replace_checkout_button);
            sessionStorage.setItem("bopis_contact_firstname", settings.bopis_contact_firstname);
            sessionStorage.setItem("bopis_contact_lastname", settings.bopis_contact_lastname);
            sessionStorage.setItem("bopis_contact_additionalname", settings.bopis_contact_additionalname);
            sessionStorage.setItem("bopis_contact_phone", settings.bopis_contact_phone);
            sessionStorage.setItem("bopis_contact_email", settings.bopis_contact_email);
            sessionStorage.setItem("bopis_address_1", settings.bopis_address_1);
            sessionStorage.setItem("bopis_address_2", settings.bopis_address_2);
            sessionStorage.setItem("bopis_address_locality", settings.bopis_address_locality);
            sessionStorage.setItem("bopis_address_region", settings.bopis_address_region);
            sessionStorage.setItem("bopis_address_postalcode", settings.bopis_address_postalcode);
            breadEnv = settings.environment;
            initPage();
        })
    });

    var getProductCodeFromUrl = function (url) {
        var parameters = url.split('?')[1].split("&");
        for (var i = 0; i < parameters.length; i++) {
            var part = parameters[i].split("=");
            if (part[0] == 'ProductCode') {
                return decodeURIComponent(part[1]);
            }
        }
    }
})(window.$jQueryModern || jQuery);