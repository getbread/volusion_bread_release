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
    $.getJSON('/v/bread/asp/tenantSettings.asp', function (tenant_settings) {
        sessionStorage.setItem("currency", tenant_settings.currency);
    })

    let listContainer = document.createElement("div");
    listContainer.setAttribute("id", "order_list_container")
    listContainer.setAttribute("style", "border: 2px solid #0f233f;margin: 20px;");

    let listElement = document.createElement("ul");
    listElement.setAttribute("id", "order_list");
    listContainer.appendChild(listElement);
    document.body.appendChild(listContainer);

    window.BREAD_ORDER_PROCESSING_URL = "/v/bread/asp/getOrders.asp"

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

        const jsonResponse = xmlToJson(xmlResponse);
        const orders = jsonResponse.NewDataSet.Table;

        if (orders) {

            /**
            * Take in the response from the Volusion API, 
            * update each order in the response via the Bread SDK,
            * and provide a report that can be delivered back to
            * the merchant so they can see which orders, if any,
            * need to be reviewed in the Bread Pay Merchant Portal.
            */
            for (let i = 0; i < orders.length; i++) {
                let data = {};

                if ("OrderStatus" in orders[i]) {
                    data.order_status = orders[i]["OrderStatus"]["#text"];
                };
                if ("Custom_Field_Custom5" in orders[i]) {
                    data.tx_id = orders[i]["Custom_Field_Custom5"]["#text"];
                };
                if ("OrderID" in orders[i]) {
                    data.externalID = orders[i]["OrderID"]["#text"];
                };
                if ("PaymentAmount" in orders[i]) {
                    data.amount = JSON.stringify({ currency: sessionStorage.getItem("currency"), value: Math.round(Number(orders[i]["PaymentAmount"]["#text"]) * 100) });
                };
                if ("TrackingNumbers" in orders[i]) {
                    data.carrier = orders[i]["TrackingNumbers"]["Gateway"]["#text"];
                    data.trackingNumber = orders[i]["TrackingNumbers"]["TrackingNumber"]["#text"];
                };
                $.ajax({
                    method: 'post',
                    dataType: 'json',
                    url: "/v/bread/asp/updateOrders.asp",
                    data: data
                }).then(response => {
                    let listItem = document.createElement("li");
                    listItem.textContent = response.message;
                    document.getElementById("order_list").appendChild(listItem);
                });
            };

        } else {
            alert("No orders have been updated in the last 90 days");
        };
    });
};