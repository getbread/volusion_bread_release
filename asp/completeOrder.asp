<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->
<!--#include file="./classes/breadPlatformApi.asp"-->
<!--#include file="./classes/volusionApi.asp"-->
<!--#include file="./classes/SMTP.asp"-->

<%

Dim jsonHelper : Set jsonHelper = New VbsJson
Dim tx_id : tx_id = Request.Form("tx_id")
Dim amount : amount = Request.Form("amount")
Dim billingAddress : billingAddress = Request.Form("billingAddress")
Dim shippingAddress : shippingAddress = Request.Form("shippingAddress")
Dim contactInfo : contactInfo = Request.Form("contactInfo")
Dim purchaseItems : purchaseItems = Request.Form("items")
Dim shippingID : shippingID = request.Form("shippingID")
Dim breadPlatform : Set breadPlatform = (New BreadPlatformApi)( dct_settings("bread_platform_api_key"), dct_settings("bread_platform_api_secret") )
Dim volusion : Set volusion = (New VolusionApi)( "http://" & dct_settings("domain"), dct_settings("apilogin"), dct_settings("apipassword") )
Dim response_json

If tx_id = "" Then
	Response.Write "{ ""success"": false, ""message"": ""tx_id missing"" }"
	Response.End
End If

Set authorization = breadPlatform.authorizeTransaction( tx_id, amount )
Set transaction = breadPlatform.getTransaction( tx_id, billingAddress, shippingAddress, contactInfo, purchaseItems )

If Not transaction("error") Then

	If transaction("status") = "AUTHORIZED" Then
		
		Set customer = volusion.getCustomerByEmail( transaction("contactInfo")("email") )	
		Set customer_id = customer.SelectSingleNode("//Customers/CustomerID")

		names = Split(transaction("contactInfo")("fullName"), " ", 2)
		Dim first_name : first_name = ""
		Dim last_name : last_name = ""

		If UBound(names) > -1 Then
			first_name = names(0)
		End If

		If UBound(names) > 0 Then
			last_name = names(1)
		End If

		'' Create a new customer if needed
		If customer_id Is Nothing Then
			
			Set new_customer = Server.CreateObject("Scripting.Dictionary")
			
			new_customer.Add "EmailAddress", transaction("contactInfo")("email")
			new_customer.Add "BillingAddress1", transaction("billingContact")("address1")
			new_customer.Add "BillingAddress2", transaction("billingContact")("address2")
			new_customer.Add "FirstName", transaction("contactInfo")("firstName")
			new_customer.Add "LastName", transaction("contactInfo")("lastName")
			new_customer.Add "City", transaction("billingContact")("locality")
			new_customer.Add "State", transaction("billingContact")("region")
			new_customer.Add "PostalCode", transaction("billingContact")("postalCode")
			new_customer.Add "PhoneNumber", transaction("contactInfo")("phone")
			new_customer.Add "RestrictedFreeShipping", "T"

			
			Set customer = volusion.insert( "Customers", Array( new_customer ) )
			Set customer_id = customer.SelectSingleNode("//Customers/CustomerID")

		End If
		
		'' Create a new order only if we have a customer
		If Not customer_id Is Nothing Then
		
			Set new_order = Server.CreateObject("Scripting.Dictionary")
			
			new_order.Add "CustomerID", customer_id.text
			new_order.Add "Custom_Field_Custom5", transaction("id")
			new_order.Add "BillingAddress1", transaction("billingContact")("address1")
			new_order.Add "BillingAddress2", transaction("billingContact")("address2")
			new_order.Add "BillingFirstName", first_name
			new_order.Add "BillingLastName", last_name
			new_order.Add "BillingCity", transaction("billingContact")("locality")
			new_order.Add "BillingState", transaction("billingContact")("region")
			new_order.Add "BillingPostalCode", transaction("billingContact")("postalCode")
			new_order.Add "BillingPhoneNumber", transaction("contactInfo")("phone")
			new_order.Add "PaymentMethodID", dct_settings("bread_payment_method_id")
			new_order.Add "SalesTax1", Round( transaction("taxAmount")("value") / 100, 2 )
			new_order.Add "SalesTaxRate1", Round( transaction("taxAmount")("value") / (transaction("adjustedAmount")("value") - transaction("taxAmount")("value") - transaction("shippingAmount")("value")), 5)
			new_order.Add "PaymentAmount", Round( transaction("adjustedAmount")("value") / 100, 2 )
			new_order.Add "Total_Payment_Authorized", Round( transaction("totalAmount")("value") / 100, 2 )
			new_order.Add "ShipAddress1", transaction("shippingContact")("address1")
			new_order.Add "ShipAddress2", transaction("shippingContact")("address2")
			new_order.Add "ShipFirstName", first_name
			new_order.Add "ShipLastName", last_name
			new_order.Add "ShipCity", transaction("shippingContact")("locality")
			new_order.Add "ShipState", transaction("shippingContact")("region")
			new_order.Add "ShipPostalCode", transaction("shippingContact")("postalCode")
			new_order.Add "ShipPhoneNumber", transaction("contactInfo")("phone")
			new_order.Add "ShippingMethodID", shippingID
			new_order.Add "TotalShippingCost", Round( transaction("shippingAmount")("value") / 100, 2 )
			new_order.Add "IsGTSOrder", "False"
			new_order.Add "OrderStatus", dct_settings("completed_order_status")
			new_order.Add "Locked", "Y"
			new_order.Add "OrderDate", Year(Now()) & "-" & Month(Now()) & "-" & Day(Now()) & " " & Hour(Now()) & ":" & Minute(Now()) & ":" & Second(Now())
			
			Dim line_items
			Dim order_details()
			ReDim order_details(-1)

			'' Default to processing line items from bread transaction
			line_items = transaction("lineItems")
			
			'' Allow passing the line items in via ajax to maintain correct ordering 
			If dct_settings("ajax_line_items_mode") = "on" Then
				If Not Request.Form("items") = "" Then
					Set request_items = jsonHelper.Decode( Request.Form("items") )
					line_items = request_items("items")
				End If
			End If
			
			'' Add the line items
			For Each line In line_items

				If line("sku") = "SURCHARGE" Then
				
					Set order_line = Server.CreateObject("Scripting.Dictionary")
					
					order_line.Add "ProductCode", "Surcharge"
					order_line.Add "ProductName", "<![CDATA[" & line("product")("name") & "]]>"
					order_line.Add "ProductPrice", Round( line("unitPrice") / 100, 2 )
					order_line.Add "TotalPrice", Round( line("unitPrice") / 100, 2 )		
					order_line.Add "Quantity", 1
					
					ReDim Preserve order_details( UBound( order_details ) + 1 )
					Set order_details( UBound( order_details ) ) = order_line
				
				Else
				
					Set product = volusion.getProductBySku( line("sku") )
					Set order_line = Server.CreateObject("Scripting.Dictionary")
					
					order_line.Add "ProductID", product.SelectSingleNode("//Products/ProductID").text
					order_line.Add "ProductCode", line("sku")
					order_line.Add "ProductName", "<![CDATA[" & line("product")("name") & "]]>"
					order_line.Add "ProductPrice", Round( line("unitPrice") / 100, 2 )
					order_line.Add "Quantity", line("quantity")
					order_line.Add "TotalPrice", Round( ( line("unitPrice") * line("quantity") ) / 100, 2 )			
					order_line.Add "Options", Request.Form( line("sku") & "_options" )
					
					Set product_weight = product.SelectSingleNode("//Products/ProductWeight")
					If Not product_weight Is Nothing Then
						order_line.Add "ProductWeight", product_weight.text
					End If

					ReDim Preserve order_details( UBound( order_details ) + 1 )
					Set order_details( UBound( order_details ) ) = order_line
					
				End If
				
			Next
			
			'' Add any discounts
			If transaction("discounts") Then
				For Each line In transaction("discounts")
				
					Set order_line = Server.CreateObject("Scripting.Dictionary")
					
					order_line.Add "ProductCode", "Discount"
					order_line.Add "ProductName", line("description")
					order_line.Add "ProductPrice", Round( line("amount")("value") / 100, 2 ) * -1
					order_line.Add "Quantity", 1
					
					ReDim Preserve order_details( UBound( order_details ) + 1 )
					Set order_details( UBound( order_details ) ) = order_line
				
				Next
			End If
			
			new_order.Add "OrderDetails", order_details

			If dct_settings("bread_payment_settle") = "on" Then
				new_order.Add "Total_Payment_Received", Round( transaction("adjustedAmount")("value") / 100, 2 )
			End If
			
			Set order = volusion.insert( "Orders", Array( new_order ) )
			
			If Not order Is Nothing Then
			
				Dim product_rows
				Set order_id = order.SelectSingleNode("//Orders/OrderID")
				Set processed_response = Server.CreateObject("Scripting.Dictionary")
				
				processed_response.Add "order", new_order

				If dct_settings("bread_payment_settle") = "on" Then
					breadPlatform.settleTransaction( tx_id )
					processed_response.Add "transaction", "settled"
				Else
					processed_response.Add "transaction", "unsettled"
				End If

				' The elements being updated in the commented out lines below don't seem to exist in 2.0
				' order_id comes out as having type "Nothing" so order_id.text does not exist
				
				'' Update the bread api with the order id
				' Set payload = Server.CreateObject("Scripting.Dictionary")
				' payload.Add "merchantOrderId", order_id.text

				' breadPlatform.updateTransaction tx_id, payload

				processed_response.Add "success", True
				processed_response.Add "order_id", tx_id 'this was order_id.text also, but i swapped it out so it would work
				
				'' SUCCESS !

				Set emailer = new SMTP
				Set emailTokens = Server.CreateObject("Scripting.Dictionary")
				
				Dim SubTotal : SubTotal = 0
				For Each line In order_details
					product_rows = product_rows & "<tr><td>" & line("ProductCode") & "</td><td>" & Replace(Replace(line("ProductName"), "<![CDATA[", ""), "]]>", "") & "<br></td><td>" & line("Quantity") & " @ " & FormatCurrency( line("ProductPrice"), 2 ) & "</td></tr>"
					SubTotal = SubTotal + ( line("ProductPrice") * line("Quantity") )
				Next
				
				emailTokens.Add "CompanyLogo", dct_settings("store_logo_url")
				emailTokens.Add "StoreName", dct_settings("storename")
				emailTokens.Add "HomeURL", "http://" & Request.ServerVariables("SERVER_NAME")
				emailTokens.Add "CustomerID", new_order("CustomerID")
				emailTokens.Add "OrderNo", tx_id 'this was order_id.text also, but i swapped it out so it would work
				emailTokens.Add "OrderDate", Year(Now()) & "-" & Month(Now()) & "-" & Day(Now())
				emailTokens.Add "OrderTime", Hour(Now()) & ":" & Minute(Now()) & ":" & Second(Now())
				emailTokens.Add "Bill_CompanyName", ""
				emailTokens.Add "Bill_FirstName", new_order("BillingFirstName")
				emailTokens.Add "Bill_LastName", new_order("BillingLastName")
				emailTokens.Add "Bill_Address1", new_order("BillingAddress1")
				emailTokens.Add "Bill_Address2", new_order("BillingAddress2")
				emailTokens.Add "Bill_City", new_order("BillingCity")
				emailTokens.Add "Bill_State", new_order("BillingState")
				emailTokens.Add "Bill_PostalCode", new_order("BillingPostalCode")
				emailTokens.Add "Bill_Country", ""
				emailTokens.Add "Bill_PhoneNumber", new_order("BillingPhoneNumber")
				emailTokens.Add "EmailAddress", transaction("contactInfo")("email")
				emailTokens.Add "Ship_CompanyName", ""
				emailTokens.Add "Ship_FirstName", new_order("ShipFirstName")
				emailTokens.Add "Ship_LastName", new_order("ShipLastName")
				emailTokens.Add "Ship_Address1", new_order("ShipAddress1")
				emailTokens.Add "Ship_Address2", new_order("ShipAddress2")
				emailTokens.Add "Ship_City", new_order("ShipCity")
				emailTokens.Add "Ship_State", new_order("ShipState")
				emailTokens.Add "Ship_PostalCode", new_order("ShipPostalCode")
				emailTokens.Add "Ship_Country", ""
				emailTokens.Add "Ship_PhoneNumber", new_order("ShipPhoneNumber")
				emailTokens.Add "DisplayPaymentMethod", "Bread Financing"
				emailTokens.Add "ShippingMethod", transaction("shippingID")
				emailTokens.Add "OrderDetails", "<table width='100%'>" &_ 
					"<tr>" &_ 
						"<td><strong>Sku</strong></td>" &_ 
						"<td><strong>Product Name<strong></td>" &_ 
						"<td><strong>Quantity Ordered</strong></td>" &_ 
					"</tr>" &_
					product_rows &_
					"<tr>" &_ 
						"<td colspan='3' align='right'>" &_ 
							"<div style='align:right'>Subtotal: " & FormatCurrency( SubTotal, 2 ) & "</div>" &_
							"<div style='align:right'>Tax: " & FormatCurrency( Round( transaction("totalTax") / 100, 2 ) ) & "</div>" &_
							"<div style='align:right'>Shipping: " & FormatCurrency( Round( transaction("shippingCost") / 100, 2 ) ) & "</div>" &_
							"<div style='align:right'>Grand Total: " & FormatCurrency( Round( transaction("adjustedTotal") / 100, 2 ) ) & "</div>" &_
						"</td>" &_
					"</tr>" &_
				"</table>"
				emailTokens.Add "Order_Comments", ""
				emailTokens.Add "Custom_Fields", ""
				
				'' The vsmtp class raises an error if emails fail to send
				On Error Resume Next
				
				emailer.smtpServer   = "smtp.sendgrid.net"
				emailer.smtpEmail    = "apikey"
				emailer.smtpPassword = "xxxx"
				
				emailer.EmailSubject = "Your order (#" & tx_id & ") from " & dct_settings("storename") 'this was order_id.text also, but i swapped it out so it would work
				emailer.EmailFrom    = dct_settings("merchantfrom")
				emailer.EmailTo      = transaction("billingContact")("email")
				emailer.LoadTemplate "OrderConfirmation_To_Customer", emailTokens
				emailer.Send()
				
				emailer.EmailSubject = "New order (#" & tx_id & ") at " & dct_settings("storename") 'this was order_id.text also, but i swapped it out so it would work
				emailer.EmailTo      = dct_settings("merchantemail")
				emailer.Send()
				
				If dct_settings("debug_mode") = "on" Then
					Set ajax_fso = Server.CreateObject("Scripting.FileSystemObject")
					Set ajax_log = ajax_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-order-ajax.inc"), 8, True)
					ajax_log.WriteLine( "---------------------------------" )
					ajax_log.WriteLine( jsonHelper.Encode( processed_response ) )
					ajax_log.Close
				End If
				
				Response.Write jsonHelper.Encode( processed_response )
				Response.End
			
			Else
			
				response_json = "{ ""success"": false, ""message"": ""There was a problem recording your order in the backend."" }"
				
				If dct_settings("debug_mode") = "on" Then
					Set ajax_fso = Server.CreateObject("Scripting.FileSystemObject")
					Set ajax_log = ajax_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-order-ajax.inc"), 8, True)
					ajax_log.WriteLine( "---------------------------------" )
					ajax_log.WriteLine( response_json )
					ajax_log.Close
				End If
				
				Response.Write response_json
				Response.End
			
			End If

		Else

			response_json = "{ ""success"": false, ""message"": ""We could not find or create your customer account to complete the order."", ""details"": """ & customer.text & """, ""transaction"": " & jsonHelper.Encode( transaction ) & " }"
			
			If dct_settings("debug_mode") = "on" Then
				Set ajax_fso = Server.CreateObject("Scripting.FileSystemObject")
				Set ajax_log = ajax_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-order-ajax.inc"), 8, True)
				ajax_log.WriteLine( "---------------------------------" )
				ajax_log.WriteLine( response_json )
				ajax_log.Close
			End If

			Response.Write response_json
			Response.End	
		
		End If
	
	Else
	
		response_json = "{ ""success"": false, ""message"": ""This transaction is not currently AUTHORIZED. (Current status: " & transaction("status") & ")"" }"
		
		If dct_settings("debug_mode") = "on" Then
			Set ajax_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set ajax_log = ajax_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-order-ajax.inc"), 8, True)
			ajax_log.WriteLine( "---------------------------------" )
			ajax_log.WriteLine( response_json )
			ajax_log.Close
		End If

		Response.Write response_json
		Response.End	
	
	End If
	
Else

	response_json = "{ ""success"": false, ""message"": """ & transaction("description") & """ }"
	
	If dct_settings("debug_mode") = "on" Then
		Set ajax_fso = Server.CreateObject("Scripting.FileSystemObject")
		Set ajax_log = ajax_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-order-ajax.inc"), 8, True)
		ajax_log.WriteLine( "---------------------------------" )
		ajax_log.WriteLine( response_json )
		ajax_log.Close
	End If

	Response.Write response_json
	Response.End	

End If

%>