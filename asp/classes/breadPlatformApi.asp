<%

' Bread Platform/2.0 API Wrapper Class
'
' @see: https://platform-docs.breadpayments.com/bread-developers/reference/foundations-introduction
' @example:
'
Class BreadPlatformAPI

	Private api_baseurl
	Private api_key
	Private api_secret
	Private jsonHelper
	Private authToken
	
	' Initialize Class
	Private Sub Class_Initialize
	
		If dct_settings("bread_env") = "production" Then
			api_baseurl = tnt_settings("domain_production")
		Else
			api_baseurl = tnt_settings("domain_sandbox")
		End If

		Set jsonHelper = New VbsJson
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		payload.Add "type", "authorize"

		Dim request_url : request_url = api_baseurl & "/auth/service/authorize"
		Dim http : Set http = CreateObject("MSXML2.ServerXMLHTTP.3.0")

		http.Open "POST", request_url, False
		http.setRequestHeader "Content-Type", "application/json"
		http.setRequestHeader "Authorization", dct_settings("bread_platform_auth")
		
		If dct_settings("debug_mode") = "on" Then
			Set bread_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set bread_log = bread_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-bread-api.inc"), 8, True)
			bread_log.WriteLine( "-------------------------------" )
			bread_log.WriteLine( "Request Url: " & request_url )
			bread_log.WriteLine( "Method: " &  method )
			bread_log.WriteLine( "Authorization: " & dct_settings("bread_platform_auth") )
			bread_log.WriteLine( "Payload: " & jsonHelper.Encode( payload ) )
		End If	
			
		http.Send jsonHelper.Encode( payload )

		authToken = jsonHelper.Decode( http.responseText ).items()(0)

		If dct_settings("debug_mode") = "on" Then
			bread_log.WriteLine( "Response: " & http.responseText ) 
		End If		
		
	End Sub
	
	' Convenience constructor for passing in initialization parameters
	'
	' @param	string			key			The api key
	' @param	string			secret		The api secret key
	'
	' @example:
	' Dim bread : Set bread = (New BreadPlatformAPI)( "xyz123kdkdjf", "djfkalfd3983" )
	Public Default Function construct( key, secret )
	
		api_key = key
		api_secret = secret
		Set construct = Me
	
	End Function

	' Look up a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function getTransaction( tx_id, billingAddress, shippingAddress, contactInfo, purchaseItems, discounts )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		payload.Add "billingAddress", jsonHelper.Decode(billingAddress)
		payload.Add "shippingAddress", jsonHelper.Decode(shippingAddress)
		payload.Add "contactInfo", jsonHelper.Decode(contactInfo)
		payload.Add "items", jsonHelper.Decode(purchaseItems)
		payload.Add "discounts", jsonHelper.Decode(discounts)

		Set getTransaction = getRequest( "GET", "/transaction/" + tx_id, payload )
		
	End Function
	
	' Authorize a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function authorizeTransaction( tx_id, amount )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "authorize"
		payload.Add "amount", jsonHelper.Decode(amount)
		
		Set authorizeTransaction = getRequest( "POST", "/transaction/" + tx_id + "/authorize", payload )

	End Function
	
	' Update a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @param	Dictionary		payload			The request payload
	' @return	Dictionary						The api JSON response
	Public Function updateTransaction( tx_id, externalID )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
	
		payload.Add "type", "update"
		payload.Add "externalID", externalID

		Set updateTransaction = makeRequest( "PATCH", "/transaction/" & tx_id, payload )
		
	End Function
	
	' Settle a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function settleTransaction( tx_id, amount )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "settle"
		payload.Add "amount", jsonHelper.Decode(amount)

		Dim settleResponse : Set settleResponse = makeRequest( "POST", "/transaction/" + tx_id + "/settle", payload )

		' Check for an error, and then return an appropriate response based on error status
		If settleResponse.Exists("message") Then
			If settleResponse("metadata")("status") = "SETTLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " previously settled successfully."" }"
				Response.End
			Elseif settleResponse("metadata")("status") = "REFUNDED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously refunded orders cannot be settled."" }"
				Response.End
			Elseif settleResponse("metadata")("status") = "CANCELLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously cancelled orders cannot be settled."" }"
				Response.End
			Elseif refundResponse("metadara")("status")= "PARTIALLY_REFUNDED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously partially refunded orders must be managed in the Portal."" }"
				Response.End
			Elseif refundResponse("metadara")("status")= "PARTIALLY_CANCELLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously partially cancelled orders must be managed in the Portal."" }"
				Response.End
			End If
		End If
		
		Set settleTransaction = settleResponse
		
	End Function
	
	' Cancel a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function cancelTransaction( tx_id, amount )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "cancel"
		payload.Add "amount", jsonHelper.Decode(amount)
		
		Dim cancelResponse : Set cancelResponse = makeRequest( "POST", "/transaction/" + tx_id + "/cancel", payload )

		' Check for an error, and then return an appropriate response based on error status
		If cancelResponse.Exists("message") Then
			If cancelResponse("metadata")("status") = "CANCELLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " previously cancelled successfully."" }"
				Response.End
			Elseif cancelResponse("metadata")("status") = "SETTLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously settled orders cannot be cancelled."" }"
				Response.End
			Elseif cancelResponse("metadata")("status") = "REFUNDED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously refunded orders cannot be cancelled."" }"
				Response.End
			Elseif refundResponse("metadara")("status")= "PARTIALLY_REFUNDED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously partially refunded orders must be managed in the Portal."" }"
				Response.End
			End If
		End If

		Set cancelTransaction = cancelResponse
		
	End Function
	
	' Refund a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function refundTransaction( tx_id, amount )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
			
		payload.Add "type", "refund"
		payload.Add "amount", jsonHelper.Decode(amount)

		Dim refundResponse : Set refundResponse = makeRequest( "POST", "/transaction/" + tx_id + "/refund", payload )

		' Check for an error, and then return an appropriate response based on error status
		If refundResponse.Exists("message") Then
			If refundResponse("metadata")("status") = "REFUNDED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " previously refunded successfully."" }"
				Response.End
			Elseif refundResponse("metadata")("status") = "AUTHORIZED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Order must be settled to be refunded."" }"
				Response.End
			Elseif refundResponse("metadata")("status") = "CANCELLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously cancelled orders cannot be refunded."" }"
				Response.End
			Elseif refundResponse("metadara")("status")= "PARTIALLY_CANCELLED" Then
				Response.Write "{ ""success"": false, ""message"": ""Order " & tx_id & " failed to update in Bread Pay Merchant Portal. Previously partially cancelled orders must be managed in the Portal."" }"
				Response.End
			End If
		End If
		
		Set refundTransaction = refundResponse
		
	End Function

	' Update shipping info on a transaction
	'
	' @param 	string			tx_id			The bread transaction id
	' @param	string			carrier			The name of the shipping carrier
	' @param 	string			trackingNumber	The shipping Tracking Number
	Public Function updateFulfillmentInfo( tx_id, carrier, trackingNumber )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "fulfillment"
		payload.Add "carrier", carrier
		payload.Add "trackingNumber", trackingNumber

		Set updateFulfillmentInfo = makeRequest( "POST", "/transaction/" + tx_id + "/fulfillment", payload )

	End Function

	' Internal api request helper
	'
	' @param	string			method			The request method
	' @param	string			endpoint		The api endpoint
	' @param	Dictionary		payload			A dictionary to be json encoded as the request payload
	' @return	Dictionary						The request JSON response

	Private Function makeRequest( method, endpoint, payload )
	
		Dim request_url : request_url = api_baseurl & endpoint
		Dim http : Set http = CreateObject("MSXML2.ServerXMLHTTP.3.0")
		
		http.Open method, request_url, False
		http.setRequestHeader "Content-Type", "application/json"
		http.setRequestHeader "Authorization", "Bearer " + authToken
		
		If dct_settings("debug_mode") = "on" Then
			Set bread_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set bread_log = bread_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-bread-api.inc"), 8, True)
			bread_log.WriteLine( "-------------------------------" )
			bread_log.WriteLine( "Request Url: " & request_url )
			bread_log.WriteLine( "Method: " &  method )
			bread_log.WriteLine( "Authorization: Bearer " & authToken )
			bread_log.WriteLine( "Payload: " & jsonHelper.Encode( payload ) )
		End If	
			
		http.Send jsonHelper.Encode( payload )
		If dct_settings("debug_mode") = "on" Then
			bread_log.WriteLine( "Response: " & http.responseText )
			bread_log.Close
		End If

		Set makeRequest = jsonHelper.Decode( http.responseText )
		
	End Function

	' The Get request has specific information that needs to be added to it in order to pass in all necessary info

	Private Function getRequest( method, endpoint, payload )
	
		Dim request_url : request_url = api_baseurl & endpoint
		Dim http : Set http = CreateObject("MSXML2.ServerXMLHTTP.3.0")
		
		http.Open method, request_url, False
		http.setRequestHeader "Content-Type", "application/json"
		http.setRequestHeader "Authorization", "Bearer " + authToken
		
		If dct_settings("debug_mode") = "on" Then
			Set bread_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set bread_log = bread_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-bread-api.inc"), 8, True)
			bread_log.WriteLine( "-------------------------------" )
			bread_log.WriteLine( "Request Url: " & request_url )
			bread_log.WriteLine( "Method: " &  method )
			bread_log.WriteLine( "Authorization: Bearer " & authToken )
			bread_log.WriteLine( "Payload: " & jsonHelper.Encode( payload ) )
		End If	
			
		http.Send jsonHelper.Encode( payload )

		' There's got to be a better way. the JSONHelper Decode function breaks the address info in the response, 
		' so we need to add it back again before sending it along to Volusion for processing

		Dim breadResponse : Set breadResponse = jsonHelper.Decode( http.responseText )

		breadResponse.Add "billingContact", payload("billingAddress")
		breadResponse.Add "shippingContact", payload("shippingAddress")
		breadResponse.Add "contactInfo", payload("contactInfo")
		breadResponse.Add "lineItems", payload("items")
		breadResponse.Add "discounts", payload("discounts")

		If dct_settings("debug_mode") = "on" Then
			bread_log.WriteLine( "Response: " & jsonHelper.Encode(breadResponse) )
			bread_log.Close
		End If
		
		Set getRequest = breadResponse
		
	End Function
	
End Class

%>