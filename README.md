Bread Pay / Volusion Integration Guide
----------------------------

# Installation

1. Unzip and upload the contents of volusion_bread_release.zip to the volusion store via SFTP into a folder named "bread".
   - Here are details on how to set up and use your Volusion SFTP account: https://volusionhome.my.site.com/knowledgebase/s/article/UsingYourVolusionFTPSFTPAccount
2. Rename the bread/dashboard/settings.default.inc to bread/dashboard/settings.inc
3. In the schema folder, there are two files called `orderHistory.sql` and `orderHistory.xsd`. Use the SFTP program to add those to /vspfiles/schema/Generic.
4. Log into the volusion administration screen.
5. You can edit the theme template via: Design > File Editor > template_xxx.html
6. Add the following script tag to the bottom of the template just before the
   closing `</body>` tag.


```html
<script type="text/javascript" src="/v/bread/js/bread.controller.js"></script>
```

7. Add the following lines to the top of the template, just before the closing `</head>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
```

8. Make sure your store is set to use Standard Checkout. In your Volusion dashboard, go to Settings > Checkout and make sure "Premium Checkout" is *not* checked.
9. Create a Payment Method for Bread Pay. In your Volusion Dashboard, under Settings > Payment, click "More Payment Types" and, next to "Custom Type," copy the following: "Bread Pay™ - Pay Over Time" without the quotation marks. Click "Add." This is what your customers will choose when they check out with Bread Pay. Note the ID associated with this payment type. You will need it later when filling out your settings.
10. Once you've installed Bread Pay via SFTP, your Bread Pay Dashboard can be found at `your-store-url.com/v/bread/dashboard`. Switch out "your-store-url" for the homepage of your Volusion store website. Follow the steps for each the Bread Pay Integration fields below to finish setting up your store.
   
**Notes:**
Buyers will recieve a confirmation directly from Bread Pay when they complete checkout. If you would like to recieve a notification email when a buyer makes a purchase via Bread Pay, you can configure your email settings in the Bread Pay Merchant Portal under Account Settings > Email Notifications

If the Volusion site being installed to does not contain a reference to a version of jQuery greater than or equal to 1.11.x in the window.jQuery variable, the following code must also be added just before the bread.controller.js script tag.

```html
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script type="text/javascript">
$jQueryModern = jQuery.noConflict(true);
</script> 
```

This directory is designed to be used with Bread Pay 2.0 or Platform instances. It is not compatible with Bread Pay Classic.
Any Volusion Store set up after May 2023 will be on Bread Pay 2.0 or later.
If you're not sure which version you're using, speak to our Customer Support team or your Solutions Engineer.

The following fields are required in order to use Bread Pay:
 * Bread Pay API Key
 * Bread Pay API Secret
 * Bread Pay Integration Key
 * Bread Pay Authorization
 * Payment Method ID
 * Payment Method Name
 * Volusion API Domain
 * Volusion API Login
 * Volusion API Password

## Bread Pay Dashboard
The module can be configured by visiting your store url appended with /v/bread/dashboard  
Example: https://xyz.store-domain.com/v/bread/dashboard

**Change Password**
Login with the default password of "bread". After initial setup, make sure to change your password. Unless you want to change your password, you may otherwise leave these fields blank when updating your settings.
## Bread Pay Integration

**Environment**
 - Sandbox: Using the sandbox environment makes requests against the Bread Pay sandbox api. It should only be used for testing using sandbox credentials provided by Bread Pay.
 - Production: The production environment is used for real transactions and requires live api credentials.

**Bread Pay API Key, Secret, and Integration Key**
The Bread API keys and secret are provided from your account interface on Bread Pay.

**Bread Pay 2.0 Authorization**
The authorization to the bread finance api must be obtained using a basic authorization header generator such as: https://www.blitter.se/utils/basic-authentication-header-generator/

Your api key is the username and your secret key is the password. Copy any paste the authorization string starting with the word "Basic".

**Payment Method ID and Name**
In Volusion under Settings > Payment, create a payment type for your customers to use to check out using Bread Pay. Click on "View List" in the top right to see the ID number. Copy the ID and Name into these fields. They will be reflected on your Volusion store checkout page.

## Bread Pay Settings
These settings are not required, but allow you to customize your customers' experience with Bread Pay in your store. 

**Completed Order Status**
Set the order status that orders made via Bread Pay will have when they appear in your Volusion dashboard.

**Auto Settle**
Confirm with your Bread representative before using the auto settle feature. This will skip over your needing to confirm that an order has been paid for and will automatically assume that all orders made via Bread Pay are paid.

**Minimum Product Value**
Set a minimum price for products available to purchase via Bread Pay. Products that cost less than this amount will not be available for purchase with Bread Pay, and customers who have those products in their cart at checkout will not be allowed to checkout via Bread Pay. If this field is set to 0 or is left blank, no minimum will be set.

**Maximum Product Value**
Set a maximum price for products available to purchase via Bread Pay. Products that cost more than this amount will not be available for purchase with Bread Pay, and customers who have those products in their cart at checkout will not be allowed to checkout via Bread Pay. If this field is set to 0 or is left blank, no maximum will be set.

**Enable Filtering by Product Code**
You may create a filter of product codes to either include or exclude. Turn filtering on by setting whether you are including or excluding. Set to "Off" to disable filtering.

**List product codes to include or exclude**
After choosing include/exclude from the previous field, copy product codes, separated by commas, that you wish to include/exclude here. 

For example, if you choose "include" and put one product code in this field, *only* that product will be available for purchase by Bread Pay. If you choose "exclude" and put one product code in this field, *every product except that one* will be available for Bread Pay. This field can be used in conjunction with minimum and maximum product values.

You can find your product codes in your Volusion Dashboard under Inventory > Products.

**Embedded Checkout**
By default, Bread Pay opens in a modal overlaid on top of your Voluson checkout page. If you check this box, it will instead open directly as part of the checkout page.

**Disable Product Page Button**
Checking this box will prevent the Bread Pay button from showing up on the details pages of each product.

**Disable Cart Page Button**
Checking this box will prevent the Bread Pay button from showing up on the customer's cart page.

**Disable Category Page Button**
Checkout this box will prevent the Bread Pay button from appearing under each product on your category pages, where multiple products are listed.

## Volusion API
These fields are required in order to connect to your Volusion Store, as well as to make sure that your customers get email confirmations from Volusion when they checkout with Bread Pay.

**Store Name**
The name of your store

**API URL, Domain, Login, and Password**
To get your api url, you must do a sample export from your volusion admin:

* Inventory > Import/Export > Volusion API > Generic > Run
* Then click the "Run" button in the top right of the page
* Copy the provided url and then paste it into the volusion "API URL" configuration field on the bread configuration dashboard.
* The Domain, Login, and Password will be filled in automatically

## Service Tools
**Debug Tools**
Checking this box will enable logs that can be used for troublshooting problems. These log files will be generated in your files under `v/bread/asp`

**Disable Autoload**
If this box is checked, no Bread Pay buttons will appear on your site, unless you add `?bread_test` to the end of the page URL.

## Save Button
When the fields above have been updated, click here to save your changes

## Refresh Bread Pay Button
Volusion does not send data to the Bread Pay Merchant Portal automatically. Click here to send data on order changes such as settlements, cancellations, and refunds to the Bread Pay Merchant Portal. A report will be generated on the page so that you can see if any orders cannot be updated. This may occur for several reasons, for example, that an already cancelled order cannot be refunded. Each order will tell you its status upon the update completing. It may take several minutes depending on the number of orders.

Volusion's API can occassionally fail. If you click this button but don't see a change, or don't see the updates you expect, reset the Volusion API by following the following steps:
 * In your Volusion Dashboard, open Inventory > Volusion API
 * Click "Run" next to Generic/Orders
 * Choose a date from the "Select Date" dropdown based on how far back you want to reset the API
   - Note: Volusion can only send 100 lines of data at a time from its API. If you have had many new or updated orders, you may want to do several resets over a smaller time in order to be sure that Volusion is able to share them. Remember that managing your orders directly in the Bread Pay Merchant Portal is also possible.
* If needed, choose a particular order ID to reset. This will only reset that one order, and is helpful if you're only seeing one or two orders not updating as expected.
* Click "Reset Export," and then return to your Bread Pay Dashboard and click "Refresh Bread" again.

If you still aren't seeing the updates you expect, please reach out to Bread Pay Support.

The Bread Pay Merchant Portal does not allow orders to be canceled after they have been settled. 
You must refund the order. Volusion, however, does allow Shipped orders to be Canceled.
If you attempt to cancel an order in Volusion that has already been marked as Settled in Bread Pay, 
you will recieve an error when you click "Refresh Bread Pay" and the order will not be updated.

## Forgot your Bread Pay Dashboard Password?
An admin on your Bread Pay account can work with Bread Pay Customer Support to help you reset your password. See [Bread Pay Customer Support](https://payments.breadfinancial.com/customer-support/?__hstc=204239887.d06e461549a0697994ca36011b96b2cc.1683915698444.1684957072186.1684959372774.3&__hssc=204239887.1.1684959372774&__hsfp=2609180766) for more details.