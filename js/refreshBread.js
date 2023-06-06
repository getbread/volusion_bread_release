/**
 * 
 * This operator is called when a Volusion merchant presses the "Refresh Bread"
 * button on the Bread Setings Dashboard. 
 * 
 * At time of writing, Volusion is not able to send automated calls outward from its API, 
 * and it is not able to use webhooks or any external system to automate data transfers.
 * The only way to get data from the Volusion API is to send a request manually.
 * 
 * That's why we need the "Refresh Bread" button to get data from Volusion. It's not ideal,
 * but it's the only way to somewhat automate updates in the merchant portal based on what's
 * happening in Volusion.
 * 
 */


const script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.6.4.min.js';
document.getElementsByTagName('head')[0].appendChild(script);

const breadRefreshButton = document.getElementById("bread_refresh")

breadRefreshButton.onclick = () => {

    window.BREAD_ORDER_PROCESSING_URL = "/v/bread/asp/getOrders.asp"

    $.getJSON('/v/bread/asp/breadSettings.asp', () => {

    }).then(settings => {

        const breadPaymentMethodID = settings.bread_payment_method_id;

        /**
         * 
         * Volusion's API sends data in XML. The way Volusion's API works is that it tracks any new 
         * data that hasn't already been shared in an API request, and when you send a get request,
         * it only sends those new items. This is great for when we only want to update items that have been changed,
         * but causes a problem because if the API hits an error after that data has been accessed, it won't send those same orders again.
         * See the README section on resetting the Volusion API for how to fix this.
         * 
         * The ajax call below gets all new or updated orders and returns them in XML format.
         */

        $.ajax({
            method: 'get',
            dataType: 'xml',
            url: BREAD_ORDER_PROCESSING_URL,
        }).then(xmlResponse => {

            // Reformat the XML response into JSON so Bread can work with it.

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

            let data;

            if (orders) {
                if (orders.constructor === Array) {
                    orders.forEach(order => {
                        data = {
                            order_status: order["OrderStatus"]["#text"],
                            tx_id: order["Custom_Field_Custom5"]["#text"],
                            externalID: order["OrderID"]["#text"],
                            amount: JSON.stringify({ currency: "USD", value: Math.round(Number(order["PaymentAmount"]["#text"]) * 100) })
                        };
                        // Some updates contain carrier info and tracking number:
                        if("TrackingNumbers" in order) {
                            data.carrier = order["TrackingNumbers"]["Gateway"]["#text"];
                        };
                        if ("TrackingNumbers" in order) {
                            data.TrackingNumber = order["TrackingNumbers"]["TrackingNumber"]["#text"];
                        };
                    });
                } else {
                    // if there is only a single order updating, we format things differently
                    data = {
                        order_status: orders["OrderStatus"]["#text"],
                        tx_id: orders["Custom_Field_Custom5"]["#text"],
                        externalID: orders["OrderID"]["#text"],
                        amount: JSON.stringify({ currency: "USD", value: Math.round(Number(orders["PaymentAmount"]["#text"]) * 100) })
                    };
                    // Some updates contain carrier info and tracking number:
                    if("TrackingNumbers" in orders) {
                        data.carrier = orders["TrackingNumbers"]["Gateway"]["#text"];
                    };
                    if ("TrackingNumbers" in orders) {
                        data.TrackingNumber = orders["TrackingNumbers"]["TrackingNumber"]["#text"];
                    };
                };

                // This ajax call sends the new and updated orders to Bread
                $.ajax({
                    method: 'post',
                    dataType: 'json',
                    url: "/v/bread/asp/updateOrders.asp",
                    data: data
                }).then(response => {
                    // ASP does not always send a response upon successful completion. 
                    // If you do not see this alert, it does not necessarily mean the update did not go through.
                    // Click again and you should see "All Bread orders are up to date"
                    if (!response.success) {
                        if (window.confirm(response.message + " Copy the transaction number and click OK to navigate to your Bread Pay Merchant Portal to ensure any cancellations or refunds have processed as expected. Click Cancel to close.")) {
                            window.location.href = "https://merchants.platform.breadpayments.com/login"
                        }
                    } else {
                        alert("Bread updated successfully")
                    }
                });
            } else {
                alert("All Bread orders are up to date");
            };
        });
    });
};