/**
 * 
 * This operator integrates the Bread 2.0 Platform API into Volusion
 * 
 */

(function ($, undefined) {

    window.BREAD_ORDER_PROCESSING_URL = "/v/bread/asp/completeOrder.asp"

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
            $('head').append('<link href="/v/bread/css/styles.css" rel="stylesheet" />');

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
         * @var string		Billing country
         */
        billing_country: 'United States',

        /**
         * @var string		Custom CSS
         */
        customCSS: '',

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
         * Set the custom CSS
         *
         * @param	string		customCSS			The custom css string
         * @return	void
         */
        setCustomCSS: function (customCSS) {
            this.customCSS = customCSS;
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

            if (this.customCSS) {
                params.customCSS = this.customCSS;
            }

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
                        ShipCountry: self.billing_country,
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
                                        ShipCountry: self.billing_country,
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

           if ((breadMax === 0 && price > breadMin) || (price > breadMin && price < breadMax)) {
            return true;
           }
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

                    // Check that the price is between min and max set prices
                    if (self.minMaxCheck(price)) {
                        button.attr('id', buttonId);
                        product.append(button);

                        placements.push({
                            financingType: "installment",
                            domID: buttonId,
                            allowCheckout: false,
                            order: {
                                items: [],
                                subTotal: {
                                    value: price,
                                    currency: "USD",
                                },
                                totalDiscounts: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalShipping: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalTax: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalPrice: {
                                    value: price,
                                    currency: "USD",
                                },
                            }
                        })
                    };
                });

                window.BreadPayments.setup({
                    integrationKey: integrationKey
                });

                window.BreadPayments.registerPlacements(placements);

                window.BreadPayments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                window.BreadPayments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                window.BreadPayments.on('INSTALLMENT:INITIALIZED', () => { });

                window.BreadPayments.__internal__.init();
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

                /** 
                 * Bread uses [placements] to fill in information about the product and apply it to the pre-qualification button.
                 * In order to get that information, we run getCheckoutParams, which returns information about that product.
                 * The actual product info is stored in a parameter called "items" (even though there's only one).
                 * The item info is added to productArray, which we can then access to get price and other necessary info.
                 * We then add that info to the placement, which is pushed to bread via registerPlacements() to generate buttons with applicable prices.
                 */

                const placements = [];
                const item = self.getCheckoutParams()
                const productArray = item.items
                const price = productArray[0].price

                // Check that the price is between min and max set prices
                if (self.minMaxCheck(price)) {

                    // Inserts the bread button underneath the Product
                    var button = $(this.buttonHtml);
                    this.insertButton(button);

                    placements.push({
                        financingType: "installment",
                        domID: "bread-checkout-btn",
                        allowCheckout: false,
                        order: {
                            items: [],
                            subTotal: {
                                value: price,
                                currency: "USD",
                            },
                            totalDiscounts: {
                                value: 0,
                                currency: "USD",
                            },
                            totalShipping: {
                                value: 0,
                                currency: "USD",
                            },
                            totalTax: {
                                value: 0,
                                currency: "USD",
                            },
                            totalPrice: {
                                value: price,
                                currency: "USD",
                            },
                        }
                    });

                    window.BreadPayments.setup({
                        integrationKey: integrationKey
                    });

                    window.BreadPayments.registerPlacements(placements);

                    window.BreadPayments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                    window.BreadPayments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                    window.BreadPayments.on('INSTALLMENT:INITIALIZED', () => { });

                    window.BreadPayments.__internal__.init();
                };
            },

            /**
             * Insert the button into the page
             *
             * @param	jquery		button			The jquery wrapped button element
             * @return	void
             */
            insertButton: function (button) {
                var table = $('[class$=productdetail-options]').find('table').eq(0);
                button.insertAfter(table.find('tr').eq(0));
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

                const placements = [];

                $.when(this.getCheckoutParams()).done(function (params) {

                    const productArray = params.items;
                    const price = productArray[0].price;

                    // Check that the price is between min and max set prices
                    if (self.minMaxCheck(price)) {

                        placements.push({
                            financingType: "installment",
                            domID: "bread-checkout-btn",
                            allowCheckout: false,
                            order: {
                                items: [],
                                subTotal: {
                                    value: price,
                                    currency: "USD",
                                },
                                totalDiscounts: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalShipping: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalTax: {
                                    value: 0,
                                    currency: "USD",
                                },
                                totalPrice: {
                                    value: price,
                                    currency: "USD",
                                },
                            }
                        });

                        window.BreadPayments.setup({
                            integrationKey: integrationKey
                        });

                        window.BreadPayments.registerPlacements(placements);

                        window.BreadPayments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });
                        window.BreadPayments.on('INSTALLMENT:APPLICATION_CHECKOUT', () => { });
                        window.BreadPayments.on('INSTALLMENT:INITIALIZED', () => { });

                        window.BreadPayments.__internal__.init();
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
             * Make bread buttons
             *
             * @return	void
             */
            makeBread: function (integrationKey) {
                var self = this;

                var button = $(this.buttonHtml);
                this.insertButton(button);

                let getShippingChoice = () => {
                    const shippingID = document.getElementsByName("ShippingSpeedChoice")[0].value;
                    const shippingChoiceRaw = document.querySelector(`option[value="${shippingID}"]`).innerHTML;
                    let shippingChoiceArray = shippingChoiceRaw.split("").reverse();
                    let shippingPriceArray = [];

                    for (let i = 0; i < shippingChoiceArray.length; i++) {
                        if (shippingChoiceArray[i] !== "$") {
                            shippingPriceArray.push(shippingChoiceArray[i])
                            shippingChoiceArray.shift();
                            i--;
                        } else {
                            shippingChoiceArray.shift();
                            shippingChoiceArray.shift();
                            break;
                        }
                    }
                    shippingPriceArray.shift();
                    shippingPriceArray = shippingPriceArray.reverse();
                    const shippingPriceString = shippingPriceArray.join("");
                    const totalShipping = Number(shippingPriceString.replace(/[^0-9.-]+/g, "")) * 100;

                    shippingChoiceArray = shippingChoiceArray.reverse()
                    const shippingName = shippingChoiceArray.join("")

                    return { shippingID: shippingID, shippingDescription: shippingName, shippingCost: totalShipping }

                }

                var refreshCheckoutParams = function () {
                    $.when(self.getCheckoutParams()).done(function (params) {

                        const shippingChoice = getShippingChoice()

                        const buyer = {
                            givenName: params.givenName,
                            familyName: params.familyName,
                            additionalName: "",
                            birthDate: "",
                            email: params.email,
                            phone: params.phone,
                            billingAddress: params.billingAddress,
                            shippingAddress: params.shippingAddress
                        }

                        window.BreadPayments.setup({
                            integrationKey: integrationKey,
                            buyer: buyer
                        });

                        const totalShipping = shippingChoice.shippingCost

                        const totalTaxString = $("#TotalsTax1TD").text();
                        const totalTax = Number(totalTaxString.replace(/[^0-9.-]+/g, "")) * 100;

                        let subTotal = 0;
                        params.items.forEach(item => {

                            subTotal += item.unitPrice;

                            item.shippingCost = totalShipping;
                            item.unitTax = 0;
                            item.shippingDescription = shippingChoice.shippingDescription

                        });

                        let totalDiscounts = 0;
                        params.discounts.forEach(discount => {
                            totalDiscounts += discount.unitPrice;
                        });

                        const totalPrice = subTotal + totalTax + totalShipping - totalDiscounts;

                        // Check that the price is between min and max set prices
                        if (self.minMaxCheck(subTotal)) {

                            const placement = {
                                locationType: "checkout",
                                domID: "bread-checkout-btn",
                                allowCheckout: true,
                                order: {
                                    items: params.items,
                                    subTotal: {
                                        value: subTotal,
                                        currency: "USD",
                                    },
                                    totalTax: totalTax,
                                    totalShipping: totalShipping,
                                    totalDiscounts: totalDiscounts,
                                    totalPrice: {
                                        value: totalPrice,
                                        currency: "USD",
                                    },
                                }
                            };

                            window.BreadPayments.registerPlacements([placement]);

                            window.BreadPayments.on('INSTALLMENT:APPLICATION_DECISIONED', () => { });

                            window.BreadPayments.on('INSTALLMENT:APPLICATION_CHECKOUT', response => {

                                // The jsonHelper Decode function breaks nested objects, 
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

                                var data = {
                                    tx_id: response.transactionID,
                                    shippingID: shippingChoice.shippingID,
                                    amount: JSON.stringify({ currency: "USD", value: response.order.totalPrice.value }),
                                    billingAddress: JSON.stringify(params.billingAddress),
                                    shippingAddress: JSON.stringify(params.shippingAddress),
                                    contactInfo: JSON.stringify(contactInfo)
                                };

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
                                data.items = params.items.map(function (item) {
                                    var line = Object.assign({}, item);
                                    line.product = { name: line.name };
                                    delete line.name;
                                    return line;
                                });

                                data.items = JSON.stringify(data.items)

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
                            });

                            window.BreadPayments.on('INSTALLMENT:INITIALIZED', () => { });

                            window.BreadPayments.__internal__.init();
                        }
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
                ], function (i, name) {
                    $('input[name="' + name + '"]').on('change', refreshCheckoutParams);
                });
                $("#DisplayShippingSpeedChoicesTD").change(function () { refreshCheckoutParams() })
                $("#v65-cart-billemail").change(function () { refreshCheckoutParams() })

                refreshCheckoutParams();

            },

            /**
             * Insert the button into the page
             *
             * @param	jquery		button			The jquery wrapped button element
             * @return	void
             */
            insertButton: function (button) {
                var td = $('#divbtnSubmitOrder');
                td.before(button);
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
                                    amount: Math.abs(price_in_cents)
                                });
                            } else if (price_in_cents > 0) {
                                cart_surcharges.push({
                                    name: name + ' (' + itemSku + ')',
                                    unitPrice: price_in_cents,
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
                                        unitPrice: price_in_cents,
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
                };

                var shippingContact = {
                    firstName: formValue('ShipFirstName'),
                    lastName: formValue('ShipLastName'),
                    address: formValue('ShipAddress1'),
                    address2: formValue('ShipAddress2'),
                    zip: formValue('ShipPostalCode'),
                    city: formValue('ShipCity'),
                    state: formValue('ShipState'),
                    phone: formValue('ShipPhoneNumber')
                };

                $.when.apply($, detailsRequests).done(function () {
                    items.push.apply(items, cart_surcharges);

                    let taxAndShippingCalc = (shippingContact) => {
                        const response = {};
                        $.when(self.getCheckoutTotals(items, shippingContact)).done(function (result) {
                            // TODO: Since I've had to move the calculation to makeBread, 
                            // I think I can probably remove this whole taxandShippingCalc function, but keeping it in for now JIC
                            response.shipping = result.shipping;
                            response.tax = result.tax;
                        });
                        return response;
                    }

                    let taxAndShipping = taxAndShippingCalc(shippingContact)

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
                            country: "US"
                        },
                        shippingAddress: {
                            address1: shippingContact.address,
                            address2: shippingContact.address2,
                            locality: shippingContact.city,
                            region: shippingContact.state,
                            postalCode: shippingContact.zip,
                            country: "US"
                        },
                        items: self.flattenItems(items),
                        discounts: cart_discounts,
                        taxAndShipping: taxAndShipping,
                    };

                    checkoutParams.resolve($.extend(self.parent.getCheckoutParams.apply(self), opts));
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
        let breadEnv = sessionStorage.getItem('bread-environment');
        let api_key = sessionStorage.getItem('bread-api-key');
        const breadTenant = sessionStorage.getItem("bread-tenant");
        const integrationKey = sessionStorage.getItem("integration-key");

        const initPage = function () {
            // Check for the user's environment and tenant
            // Append the appropriate script to the page
            let script = document.createElement("script");
            script.type = "text/javascript";
            let script_url;

            if (breadTenant === "ADS") {
                if (breadEnv === "sandbox") {
                    script_url = "https://connect-preview.breadpayments.com/sdk.js";
                } else {
                    script_url = "https://connect.breadpayments.com/sdk.js";
                };
            } else {
                if (breadEnv === "sandbox") {
                    script_url = "https://api-preview.rbc.breadpayments.com/";
                } else {
                    script_url = "https://api.rbcpayplan.com/";
                };
            };

            // Set the appropriate script URL and append the script HTML tag to the store template
            script.src = script_url;

            script.onload = function () {
                console.log("Bread API Script Loaded Successfully")
                var page = new PageHelper();
                window.breadPage = page;
                page.controller.setCustomCSS(sessionStorage.getItem('bread-custom-css') || '');
                if (sessionStorage.getItem('bread-disabled') != 'on' || location.search == '?bread_test') {
                    if (page.type === "product" && sessionStorage.getItem("bread-disable-product-button") === "on") {
                        console.log("Bread button disabled on this page")
                    } else if (page.type === "cart" && sessionStorage.getItem("bread-disable-cart-button") === "on") {
                        console.log("Bread button disabled on this page");
                    } else {
                        page.controller.makeBread(integrationKey);
                    }
                }
            };

            document.head.appendChild(script);

            // Micromodal.js
            $('body').append('<script type="text/javascript" src="/v/bread/js/micromodal.min.js"></script>');
            $('body').append('<link rel="stylesheet" href="/v/bread/css/micromodal.css" />');

        };

        // Fetch environment and api key if needed
        if (!api_key) {
            $.getJSON('/v/bread/asp/breadSettings.asp', function (settings) {
                if (settings.success) {
                    sessionStorage.setItem('bread-environment', settings.environment);
                    sessionStorage.setItem('bread-api-key', settings.platform_api_key);
                    sessionStorage.setItem('bread-custom-css', settings.customCSS);
                    sessionStorage.setItem('bread-disabled', settings.disable_autoload);
                    sessionStorage.setItem('bread-disable-product-checkout', settings.disable_product_checkout);
                    sessionStorage.setItem('bread-disable-cart-checkout', settings.disable_cart_checkout);
                    sessionStorage.setItem("bread-tenant", settings.bread_tenant);
                    sessionStorage.setItem("integration-key", settings.integration_key);
                    sessionStorage.setItem("bread-disable-product-button", settings.disable_product_button);
                    sessionStorage.setItem("bread-disable-cart-button", settings.disable_cart_button);
                    sessionStorage.setItem("bread-product-min", settings.bread_product_min);
                    sessionStorage.setItem("bread-product-max", settings.bread_product_max);
                    breadEnv = settings.environment;
                    api_key = settings.platform_api_key;
                    initPage();
                }
            });
        }
        else {
            $.getJSON('/v/bread/asp/breadSettings.asp', function (settings) {
                sessionStorage.setItem("bread-disable-product-button", settings.disable_product_button);
                sessionStorage.setItem("bread-disable-cart-button", settings.disable_cart_button);
                sessionStorage.setItem("bread-product-min", settings.bread_product_min);
                sessionStorage.setItem("bread-product-max", settings.bread_product_max);
                initPage();
            })
        }

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