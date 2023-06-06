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
			api_baseurl = "https://api.platform.breadpayments.com"
		Else
			api_baseurl = "https://api-preview.platform.breadpayments.com"
		End If
		
		Set jsonHelper = New VbsJson

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "authorize"

		Dim request_url : request_url = api_baseurl & "/api/auth/service/authorize"
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
	Public Function getTransaction( tx_id, billingAddress, shippingAddress, contactInfo, purchaseItems )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		payload.Add "billingAddress", jsonHelper.Decode(billingAddress)
		payload.Add "shippingAddress", jsonHelper.Decode(shippingAddress)
		payload.Add "contactInfo", jsonHelper.Decode(contactInfo)
		payload.Add "items", jsonHelper.Decode(purchaseItems)
		payload.Add "shippingID", shippingID
		
		Set getTransaction = getRequest( "GET", "/api/transaction/" + tx_id, payload )
		
	End Function
	
	' Authorize a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function authorizeTransaction( tx_id, amount )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "authorize"
		payload.Add "amount", jsonHelper.Decode(amount)
		
		Set authorizeTransaction = getRequest( "POST", "/api/transaction/" + tx_id + "/authorize", payload )

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

		Set updateTransaction = makeRequest( "PATCH", "/api/transaction/" & tx_id, payload )
		
	End Function
	
	' Settle a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function settleTransaction( tx_id, amount )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "settle"
		payload.Add "amount", jsonHelper.Decode(amount)
		
		Set settleTransaction = makeRequest( "POST", "/api/transaction/" + tx_id + "/settle", payload )
		
	End Function
	
	' Cancel a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function cancelTransaction( tx_id, amount )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")

		payload.Add "type", "cancel"
		payload.Add "amount", jsonHelper.Decode(amount)
		payload.Add "tx_id", tx_id
		
		Set cancelTransaction = makeRequest( "POST", "/api/transaction/" + tx_id + "/cancel", payload )
		
	End Function
	
	' Refund a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function refundTransaction( tx_id, amount )

		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
			
		payload.Add "type", "refund"
		payload.Add "amount", jsonHelper.Decode(amount)
		
		Set refundTransaction = makeRequest( "POST", "/api/transaction/" + tx_id + "/refund", payload )
		
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

		Set updateFulfillmentInfo = makeRequest( "POST", "/api/transaction/" + tx_id + "/fulfillment", payload )

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
			bread_log.WriteLine( jsonHelper.Decode(http.responseText).Exists("message"))
			bread_log.WriteLine( "Response: " & http.responseText )
			bread_log.Close
		End If

		If jsonHelper.Decode(http.responseText).Exists("message") Then
			Response.Write "{ ""success"": false, ""message"": ""Order " & payload("tx_id") & " failed to update."" }"
			Response.End
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

		If dct_settings("debug_mode") = "on" Then
			bread_log.WriteLine( "Response: " & jsonHelper.Encode(breadResponse) )
			bread_log.Close
		End If
		
		Set getRequest = breadResponse
		
	End Function
	
End Class

%>