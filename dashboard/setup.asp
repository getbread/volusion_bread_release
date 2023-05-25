<!--#include file="global.inc"-->

<!--#include file="_header.inc"-->

<% If setup_errors > "" Then %>
<div class="alert alert-danger">
	<% = setup_errors %>
</div>
<% ElseIf LCase(Request.ServerVariables("REQUEST_METHOD")) = "post" Then %>
	<div class="alert alert-success"><strong>Success!</strong> Settings have been updated.</div>
<% End If %>

<form action="setup.asp" method="POST" class="form-horizontal">
	<h3>Change Password</h3>
	<div class="form-group">
		<label for="password" class="col-md-2 control-label">Password</label>
		<div class="col-md-4">
			<input type="password" id="password" name="password" class="form-control">
		</div>
	</div>
	<div class="form-group">
		<label for="password" class="col-md-2 control-label">Verify Password</label>
		<div class="col-md-4">
			<input type="password" id="verify_password" name="verify_password" class="form-control">
		</div>
	</div>
	<div class="form-group">
		<div class="col-md-6 col-md-offset-2">
			<label>
				<input type="checkbox" id="update_password" name="update_password"> Update Password
			</label>
		</div>
	</div>
	<h3>Bread Pay Integration</h3>
	<div class="form-group">
		<label for="bread_env" class="col-md-2 control-label">Environment</label>
		<div class="col-md-6">
			<select id="bread_env" name="bread_env" class="form-control">
				<% If dct_setup("bread_env") = "production" Then %>
				<option value="sandbox">Sandbox</option>
				<option value="production" selected>Production</option>
				<% Else %>
				<option value="sandbox" selected>Sandbox</option>
				<option value="production">Production</option>
				<% End If %>
			</select>
		</div>
	</div>
	<div class="platform-api-info">
		<h4>Connect to Bread Pay</h4>
		<div class="form-group">
			<label for="bread_platform_api_key" class="col-md-2 control-label">Bread Pay API Key</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_api_key" name="bread_platform_api_key" class="form-control" value="<% = dct_setup("bread_platform_api_key") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_platform_api_secret" class="col-md-2 control-label">Bread Pay API Secret</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_api_secret" name="bread_platform_api_secret" class="form-control" value="<% = dct_setup("bread_platform_api_secret") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_platform_integration_key" class="col-md-2 control-label">Bread Pay Integration Key</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_integration_key" name="bread_platform_integration_key" class="form-control" value="<% = dct_setup("bread_platform_integration_key") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_platform_auth" class="col-md-2 control-label">Bread Pay Authorization</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_auth" name="bread_platform_auth" class="form-control" value="<% = dct_setup("bread_platform_auth") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_payment_method_id" class="col-md-2 control-label">Payment Method ID</label>
			<div class="col-md-6">
				<input type="text" id="bread_payment_method_id" name="bread_payment_method_id" class="form-control" value="<% = dct_setup("bread_payment_method_id") %>">
			</div>
		</div>
	</div>
	
	<h3>Bread Pay Settings</h3>
	<div class="form-group">
		<label for="completed_order_status" class="col-md-2 control-label">Completed Order Status</label>
		<div class="col-md-6">
			<select id="completed_order_status" name="completed_order_status" class="form-control">
				<option value="New"<% If dct_setup("completed_order_status") = "New" Then %> selected<% End If %>>New</option>
				<option value="Pending"<% If dct_setup("completed_order_status") = "Pending" Then %> selected<% End If %>>Pending</option>
				<option value="Processing"<% If dct_setup("completed_order_status") = "Processing" Then %> selected<% End If %>>Processing</option>
				<option value="Pending Shipment"<% If dct_setup("completed_order_status") = "Pending Shipment" Then %> selected<% End If %>>Pending Shipment</option>
			</select>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">
		Auto Settle
		</label>
		<div class="col-md-6 checkbox">
			<label for="bread_payment_settle" class="control-label" style="margin-bottom: 15px;">
				<input type="checkbox" id="bread_payment_settle" name="bread_payment_settle" value="on"<% If dct_setup("bread_payment_settle") = "on" Then %> checked="checked"<% End If %> />
				Settle payments immediately after checkout (default: off)
			</label>
			<div class="alert alert-warning">
				<strong>Note: </strong>Please confirm with your Bread representative before enabling this feature.
			</div>
		</div>
	</div>
	
	<div class="form-group">
		<label for="bread_product_min" class="col-md-2 control-label">Minimum Product Value</label>
		<div class="col-md-6">
			<input type="number" step="0.01" id="bread_product_min" name="bread_product_min" class="form-control" value="<% = dct_setup("bread_product_min") %>">
			<p>Select the minimum price on which the promotion will be shown. Blank or 0 = no minimum. Use numbers and decimals only. Ex. 100 or 50.25</p>
		</div>
	</div>
	<div class="form-group">
		<label for="bread_product_max" class="col-md-2 control-label">Maximum Product Value</label>
		<div class="col-md-6">
			<input type="number" step="0.01" id="bread_product_max" name="bread_product_max" class="form-control" value="<% = dct_setup("bread_product_max") %>">
			<p>Select the maximum price on which the promotion will be shown. Blank or 0 = no maximum. Use numbers and decimals only. Ex. 100 or 50.25</p>
		</div>
	</div>
	<div class="form-group">
		<label for="bread_enable_sku_filter" class="col-md-2 control-label">Enable Filtering by Product Code</label>
		<div class="col-md-6">
			<select id="bread_enable_sku_filter" name="bread_enable_sku_filter" class="form-control">
				<option value="Off"<% If dct_setup("bread_enable_sku_filter") = "Off" Then %> selected<% End If %>>Off</option>
				<option value="Include"<% If dct_setup("bread_enable_sku_filter") = "Include" Then %> selected<% End If %>>Include</option>
				<option value="Exclude"<% If dct_setup("bread_enable_sku_filter") = "Exclude" Then %> selected<% End If %>>Exclude</option>
			</select>
		</div>
	</div>
	<div class="form-group">
		<label for="bread_sku_filter_list" class="col-md-2 control-label">List product codes to include or exclude:</label>
		<div class="col-md-6">
			<input type="text" id="bread_sku_filter_list" name="bread_sku_filter_list" class="form-control" value="<% = dct_setup("bread_sku_filter_list") %>">
			<p>
			To include or exclude only certain products as available for payment via Bread Pay, choose include or exclude from the dropdown above, and list the product code of each item on which you want to include or exclude Bread Pay checkout, separated by commas. If you choose include, only the products with codes listed here will be available for Bread Pay checkout. If you choose exclude, all products except those listed here will be available for Bread Pay checkout.
			</p>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Embedded Checkout</label>
		<div class="col-md-6 checkbox">
			<label for="bread_embedded_checkout" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_embedded_checkout" name="bread_embedded_checkout" value="on"<% If dct_setup("bread_embedded_checkout") = "on" Then %> checked="checked"<% End If %> />
				Embed Bread Pay Checkout Form directly in page rather than via a pop-up modal (default: off)
			</label>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Disable Product Page Button</label>
		<div class="col-md-6 checkbox">
			<label for="bread_disable_product_button" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_disable_product_button" name="bread_disable_product_button" value="on"<% If dct_setup("bread_disable_product_button") = "on" Then %> checked="checked"<% End If %> />
				If this box is checked, the Bread Pay button will not appear on individual product description pages
			</label>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Disable Cart Page Button</label>
		<div class="col-md-6 checkbox">
			<label for="bread_disable_cart_button" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_disable_cart_button" name="bread_disable_cart_button" value="on"<% If dct_setup("bread_disable_cart_button") = "on" Then %> checked="checked"<% End If %> />
				If this box is checked, the Bread Pay button will not appear on the cart page
			</label>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Disable Category Page Button</label>
		<div class="col-md-6 checkbox">
			<label for="bread_disable_category_button" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_disable_category_button" name="bread_disable_category_button" value="on"<% If dct_setup("bread_disable_category_button") = "on" Then %> checked="checked"<% End If %> />
				If this box is checked, the Bread Pay button will not appear on category pages
			</label>
		</div>
	</div>
	<h3>Volusion API</h3>
	<div class="form-group">
		<label for="storename" class="col-md-2 control-label">Store Name</label>
		<div class="col-md-6">
			<input type="text" id="storename" name="storename" class="form-control" placeholder="Example Store" value="<% = dct_setup("storename") %>">
		</div>
	</div>
	<br>
	<div class="form-group">
		<label for="domain" class="col-md-2 control-label">
			API URL <a href="/net/volusion_api.aspx" data-toggle="tooltip" title="Run a generic API call to get sample URL" target="_blank"><span class="glyphicon glyphicon-new-window"></span></a>
		</label>
		<div class="col-md-6">
			<input type="text" id="api_url" name="api_url" class="form-control" placeholder="Paste a Sample URL Here to Import API Settings" />
		</div>
	</div>
	<div class="form-group">
		<label for="domain" class="col-md-2 control-label">API Domain</label>
		<div class="col-md-6">
			<input type="text" id="domain" name="domain" class="form-control" placeholder="www.example.com" value="<% = dct_setup("domain") %>">
		</div>
	</div>
	<div class="form-group">
		<label for="apilogin" class="col-md-2 control-label">API Login</label>
		<div class="col-md-6">
			<input type="email" id="apilogin" name="apilogin" class="form-control" placeholder="user@example.com" value="<% = dct_setup("apilogin") %>">
		</div>
	</div>
	<div class="form-group">
		<label for="apipassword" class="col-md-2 control-label">API Password</label>
		<div class="col-md-6">
			<input type="text" id="apipassword" name="apipassword" class="form-control" placeholder="Encrypted API Password" value="<% = dct_setup("apipassword") %>">
		</div>
	</div>
	<br>
	<div class="form-group">
        <label for="merchantfrom" class="col-md-2 control-label">Send Order Confirmation From:</label>
        <div class="col-md-6">
            <input type="email" id="merchantfrom" name="merchantfrom" class="form-control" placeholder="user@example.com" value="<% = dct_setup("merchantfrom") %>">
        </div>
    </div>
	<div class="form-group">
		<label for="merchantemail" class="col-md-2 control-label">
			Send Merchant Order Confirmation To:</a>
		</label>
		<div class="col-md-6">
			<input type="text" id="merchantemail" name="merchantemail" class="form-control" value="<% = dct_setup("merchantemail") %>">
		</div>
	</div>
	<h3>Service Tools</h3>
	<div class="form-group">
		<label class="col-md-2 control-label">
		Debug Mode
		</label>
		<div class="col-md-6 checkbox">
			<label for="debug_mode" class="control-label" style="margin-bottom: 15px;">
				<input type="checkbox" id="debug_mode" name="debug_mode" value="on"<% If dct_setup("debug_mode") = "on" Then %> checked="checked"<% End If %> />
				Enable debug logs for transactions (default: off)
			</label>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">
		Disable Autoload
		</label>
		<div class="col-md-6 checkbox">
			<label for="disable_autoload" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="disable_autoload" name="disable_autoload" value="on"<% If dct_setup("disable_autoload") = "on" Then %> checked="checked"<% End If %> />
				Disable the Bread Pay checkout/buttons from automatically displaying on the site. (default: off)
			</label>
			<div class="alert alert-info">
				Add "?bread_test" to the end of a site url to cause the Bread Pay button to load.
			</div>
		</div>
	</div>
	<div class="col-md-4 col-md-offset-3">
		<button type="submit" class="btn btn-default btn-block">Save</button>
	</div>
</form>

</br></br>
<div class="col-md-4 col-md-offset-3">
	<p>Click below to refresh the Bread Pay Merchant Portal</p>
	<button class="btn btn-default btn-block" id="bread_refresh">Refresh Bread Pay</button>
</div>

<!--#include file="_footer.inc"-->