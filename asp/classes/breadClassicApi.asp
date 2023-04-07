<%

' Bread Classic API Wrapper Class
'
' @see: https://payments.breadfinancial.com/documentation/
' @example:
'
' 	Dim bread : Set bread = (New BreadClassicApi)( "email@domain.com", "accessToken" )
'
Class BreadClassicAPI

	Private api_baseurl
	Private api_key
	Private api_secret
	Private jsonHelper
	
	' Initialize Class
	Private Sub Class_Initialize
	
		If dct_settings("bread_env") = "production" Then
			api_baseurl = "https://api.getbread.com"
		Else
			api_baseurl = "https://api-sandbox.getbread.com"
		End If
		
		Set jsonHelper = New VbsJson
		
	End Sub
	
	' Convenience constructor for passing in initialization parameters
	'
	' @param	string			key			The api key
	' @param	string			secret		The api secret key
	'
	' @example:
	' Dim bread : Set bread = (New BreadClassicApi)( "xyz123kdkdjf", "djfkalfd3983" )
	Public Default Function construct( key, secret )
	
		api_key = key
		api_secret = secret
		Set construct = Me
	
	End Function

	' Look up a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function getTransaction( tx_id )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		Set getTransaction = makeRequest( "GET", "/transactions/" & tx_id, payload )
		
	End Function
	
	' Authorize a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function authorizeTransaction( tx_id )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		payload.Add "type", "authorize"
		
		Set authorizeTransaction = makeRequest( "POST", "/transactions/actions/" & tx_id, payload )
		
	End Function
	
	' Update a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @param	Dictionary		payload			The request payload
	' @return	Dictionary						The api JSON response
	Public Function updateTransaction( tx_id, payload )
	
		Set updateTransaction = makeRequest( "PUT", "/transactions/" & tx_id, payload )
		
	End Function
	
	' Settle a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function settleTransaction( tx_id )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		payload.Add "type", "settle"
		
		Set settleTransaction = makeRequest( "POST", "/transactions/actions/" & tx_id, payload )
		
	End Function
	
	' Cancel a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function cancelTransaction( tx_id )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		payload.Add "type", "cancel"
		
		Set cancelTransaction = makeRequest( "POST", "/transactions/actions/" & tx_id, payload )
		
	End Function
	
	' Refund a transaction
	'
	' @param	string			tx_id			The bread transaction id
	' @return	Dictionary						The api JSON response
	Public Function refundTransaction( tx_id )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		
		payload.Add "type", "refund"
		
		Set refundTransaction = makeRequest( "POST", "/transactions/actions/" & tx_id, payload )
		
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
		http.setRequestHeader "Authorization", dct_settings("bread_classic_auth")
		
		If dct_settings("debug_mode") = "on" Then
			Set bread_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set bread_log = bread_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-bread-api.inc"), 8, True)
			bread_log.WriteLine( "-------------------------------" )
			bread_log.WriteLine( "Request Url: " & request_url )
			bread_log.WriteLine( "Method: " &  method )
			bread_log.WriteLine( "Authorization: " & dct_settings("bread_classic_auth") )
			bread_log.WriteLine( "Payload: " & jsonHelper.Encode( payload ) )
		End If	
			
		http.Send jsonHelper.Encode( payload )

		If dct_settings("debug_mode") = "on" Then
			bread_log.WriteLine( "Response: " & http.responseText )
			bread_log.Close
		End If
		
		Set makeRequest = jsonHelper.Decode( http.responseText )
		
	End Function
	
End Class

%>