const script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.6.4.min.js';
document.getElementsByTagName('head')[0].appendChild(script);

const breadRefreshButton = document.getElementById("bread_refresh")

breadRefreshButton.onclick = () => {

    window.BREAD_ORDER_PROCESSING_URL = "/v/bread/asp/updateOrder.asp"

    $.getJSON('/v/bread/asp/breadSettings.asp', () => {

    }).then(settings => {

        const breadPaymentMethodID = settings.bread_payment_method_id;
        const breadTenant = settings.bread_tenant;

        let currency;
        if (breadTenant === "ADS") {
            currency = "USD"
        } else {
            currency = "CAD"
        };

        $.ajax({
            method: 'get',
            dataType: 'xml',
            url: BREAD_ORDER_PROCESSING_URL,
        }).then(xmlResponse => {

            function xmlToJson(xml) {
                // Create the return object
                var obj = {};

                if (xml.nodeType == 1) { // element
                    // do attributes
                    if (xml.attributes.length > 0) {
                        obj["@attributes"] = {};
                        for (var j = 0; j < xml.attributes.length; j++) {
                            var attribute = xml.attributes.item(j);
                            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                        }
                    }
                }
                else if (xml.nodeType == 3 ||
                    xml.nodeType == 4) { // text and cdata section
                    obj = xml.nodeValue
                }

                // do children
                if (xml.hasChildNodes()) {
                    for (var i = 0; i < xml.childNodes.length; i++) {
                        var item = xml.childNodes.item(i);
                        var nodeName = item.nodeName;
                        if (typeof (obj[nodeName]) == "undefined") {
                            obj[nodeName] = xmlToJson(item);
                        } else {
                            if (typeof (obj[nodeName].length) == "undefined") {
                                var old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            if (typeof (obj[nodeName]) === 'object') {
                                obj[nodeName].push(xmlToJson(item));
                            }
                        }
                    }
                }
                return obj;
            }

            const jsonResponse = xmlToJson(xmlResponse)
            const orders = jsonResponse.xmldata.Orders;

            if (orders) {
                if (orders.constructor === Array) {
                    orders.forEach(order => {

                        //   This check means that the way for this to work will have 
                        //   to be through a user selecting the Bread payment type, or else it won't be updatable
                        if (order["PaymentMethodID"]["#text"] === breadPaymentMethodID) {
                            let data = {
                                order_status: order["OrderStatus"]["#text"],
                                tx_id: order["Custom_Field_Custom5"]["#text"],
                                externalID: order["OrderID"]["#text"],
                                amount: JSON.stringify({ currency: currency, value: Math.round(Number(order["PaymentAmount"]["#text"]) * 100) })
                            }

                            $.ajax({
                                method: 'post',
                                dataType: 'json',
                                url: "/v/bread/asp/updateOrders.asp",
                                data: data
                            }).then(response => {
                                alert("Bread updated")
                            });
                        };
                    });
                } else {
                    if (orders["PaymentMethodID"]["#text"] === breadPaymentMethodID) {
                        let data = {
                            order_status: orders["OrderStatus"]["#text"],
                            tx_id: orders["Custom_Field_Custom5"]["#text"],
                            order_id: orders["OrderID"]["#text"],
                            amount: JSON.stringify({ currency: currency, value: Math.round(Number(orders["PaymentAmount"]["#text"]) * 100) })
                        }

                        $.ajax({
                            method: 'post',
                            dataType: 'json',
                            url: "/v/bread/asp/updateOrders.asp",
                            data: data
                        }).then(response => {
                            alert("Bread updated")
                        });
                    }
                };
            } else {
                alert("All Bread orders are up to date");
            };
        });
    });
};