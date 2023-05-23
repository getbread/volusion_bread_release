Bread Pay / Volusion Integration Guide
----------------------------

# Installation

1. Unzip and upload the contents of volusion_plugin.zip to the volusion store via sftp into a folder
   named "bread".
2. Rename the bread/dashboard/settings.default.inc to bread/dashboard/settings.inc
3. Log into the volusion administration screen.
4. Edit the theme template via: Design > File Editor > template_xxx.html
5. Add the following script tag to the bottom of the template just before the
   closing </body> tag.

```html
<script type="text/javascript" src="/v/bread/js/bread.controller.js"></script>
```
   
**Notes:**
If the Volusion site being installed to does not contain a reference to a version of
jQuery greater than or equal to 1.11.x in the window.jQuery variable, the following 
code must also be added just before the bread.controller.js script tag.

```html
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script type="text/javascript">
$jQueryModern = jQuery.noConflict(true);
</script> 
```

This directory is designed to be used with Bread Pay 2.0 or Platform instances. It is not compatible with Bread Pay Classic.
Any Volusion Store set up after May 2023 will be on Bread Pay 2.0 or later.
If you're not sure which version you're using, speak to our Customer Support team or your Solutions Engineer.

## Bread Configuration

The module can be configured by visiting your store url appended with /v/bread/dashboard  
Example: https://xyz.store-domain.com/v/bread/dashboard

Login with the default password of "bread". After initial setup, make sure to change your password.

**Environment**

 - Sandbox: Using the sandbox environment makes requests against the Bread Pay sandbox api. It should only be used for testing using sandbox credentials provided by Bread Pay.
 - Production: The production environment is used for real transactions and requires live api credentials.

**Bread Pay Configuration**
**Bread Pay API Key & Secret**
   
The Bread api key and secret are provided from your account interface on Bread Pay.

**Bread Pay 2.0 Authorization**

The authorization to the bread finance api must be obtained using a basic authorization header generator such as: https://www.blitter.se/utils/basic-authentication-header-generator/

Your api key is the username and your secret key is the password. Copy any paste the authorization string starting with the word "Basic".

**Disable Product Page Button**
Checking this box will prevent the Bread button from showing up on the details pages of each product

**Disable Cart Page Button**
Checking this box will prevent the Bread button from showing up on the cart page

**Bread Payment Method Id**
The bread payment method id allows you to choose which payment method should be selected 
for your orders when checking out using financing from Bread Finance. You can see the ID's 
of your existing payment methods (and create new ones) from your volusion admin dashboard
at: Settings > Payment > More Payment Types (then click the "View List" button at the top
right of the screen.)

**Auto Settle**
Confirm with your Bread representative before using the auto settle feature.