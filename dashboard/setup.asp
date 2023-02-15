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
	<h3>Bread Finance Integration</h3>
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
		<h4>Bread 2.0</h4>
		<div class="form-group">
			<label for="bread_platform_api_key" class="col-md-2 control-label">Bread 2.0 API Key</label>
			<div class="col-md-6">
				<input type="text" id="bread__platform_api_key" name="bread_platform_api_key" class="form-control" value="<% = dct_setup("bread_platform_api_key") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_platform_api_secret" class="col-md-2 control-label">Bread 2.0 API Secret</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_api_secret" name="bread_platform_api_secret" class="form-control" value="<% = dct_setup("bread_platform_api_secret") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_platform_integration_key" class="col-md-2 control-label">Bread 2.0 Integration Key</label>
			<div class="col-md-6">
				<input type="text" id="bread_platform_integration_key" name="bread_platform_integration_key" class="form-control" value="<% = dct_setup("bread_platform_integration_key") %>">
			</div>
		</div>
	</div>
	<div class="classic-api-info">
		<h4>Bread Classic</h4>
		<div class="form-group">
			<label for="bread_classic_api_key" class="col-md-2 control-label">Bread Classic API Key</label>
			<div class="col-md-6">
				<input type="text" id="bread_classic_api_key" name="bread_classic_api_key" class="form-control" value="<% = dct_setup("bread_classic_api_key") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_classic_api_secret" class="col-md-2 control-label">Bread Classic API Secret</label>
			<div class="col-md-6">
				<input type="text" id="bread_classic_api_secret" name="bread_classic_api_secret" class="form-control" value="<% = dct_setup("bread_classic_api_secret") %>">
			</div>
		</div>
		<div class="form-group">
			<label for="bread_classic_auth" class="col-md-2 control-label">Bread Classic Authorization</label>
			<div class="col-md-6">
				<input type="text" id="bread_classic_auth" name="bread_classic_auth" class="form-control" value="<% = dct_setup("bread_classic_auth") %>">
			</div>
		</div>
	</div>
	<h4>Bread Payment Settings</h4>
	<div class="form-group">
		<label for="bread_payment_method_id" class="col-md-2 control-label">Payment Method Id</label>
		<div class="col-md-6">
			<input type="text" id="bread_payment_method_id" name="bread_payment_method_id" class="form-control" value="<% = dct_setup("bread_payment_method_id") %>">
		</div>
	</div>
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
		<label for="bread_css" class="col-md-2 control-label">Bread Container CSS</label>
		<div class="col-md-6">
			<textarea id="bread_css" name="bread_css" class="form-control" rows="6"><% = Load_Custom_CSS() %></textarea>
			<p>This css will be inserted onto the page and can be used to style the bread button container element in your volusion store.</p>
		</div>
	</div>
	<div class="form-group">
		<label for="bread_button_css" class="col-md-2 control-label">Custom Button CSS</label>
		<div class="col-md-6">
			<input type="text" id="bread_button_css" name="bread_button_css" class="form-control" value="<% = dct_setup("bread_button_css") %>">
			<p>Any CSS entered here will be used to style the bread button itself. Please minify your css using a service such as <a href="https://cssminifier.com/">CSS Minifier</a>.</p>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Disable Product Page Checkout</label>
		<div class="col-md-6 checkbox">
			<label for="bread_disable_product_checkout" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_disable_product_checkout" name="bread_disable_product_checkout" value="on"<% If dct_setup("bread_disable_product_checkout") = "on" Then %> checked="checked"<% End If %> />
				Do not allow users to complete single item purchases directly from the product page. Instead, the bread button will only show available financing rates and the user must add the product to their cart to begin the checkout.
			</label>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">Disable Cart Page Checkout</label>
		<div class="col-md-6 checkbox">
			<label for="bread_disable_cart_checkout" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="bread_disable_cart_checkout" name="bread_disable_cart_checkout" value="on"<% If dct_setup("bread_disable_cart_checkout") = "on" Then %> checked="checked"<% End If %> />
				Do not allow users to complete a bread checkout from the cart page. Instead, the bread button will only show available financing rates and the user must continue to the actual checkout page to complete a bread checkout.
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
				Disable the bread checkout/buttons from automatically displaying on the site. (default: off)
			</label>
			<div class="alert alert-info">
				Add "?bread_test" to the end of a site url to cause the bread button to load.
			</div>
		</div>
	</div>
	<div class="form-group">
		<label class="col-md-2 control-label">
		Line Items Sequencing Tweak
		</label>
		<div class="col-md-6 checkbox">
			<label for="ajax_line_items_mode" class="control-label" style="margin-bottom: 15px; text-align:left;">
				<input type="checkbox" id="ajax_line_items_mode" name="ajax_line_items_mode" value="on"<% If dct_setup("ajax_line_items_mode") = "on" Then %> checked="checked"<% End If %> />
				Enable this option to add line items to volusion orders in the sequence they appear in the cart. This uses the line items obtained from the web browser instead of from
				the transaction record on the bread backend. (default: off)
			</label>
		</div>
	</div>	
	<div class="col-md-4 col-md-offset-3">
		<button type="submit" class="btn btn-default btn-block">Save</button>
	</div>
</form>

<!--#include file="_footer.inc"-->