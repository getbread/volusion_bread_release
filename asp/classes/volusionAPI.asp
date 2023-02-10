<%

Dim webRootPath:	webRootPath = Server.MapPath("/")
Dim vspfilesPath:	vspfilesPath = webRootPath & "\v\vspfiles"
Dim breadPath:		breadPath = webRootPath & "\v\bread"

' Volusion API Wrapper Class
'
' @see: http://helpcenter.volusion.com/developers/intro/developer-resources
' @example:
'
' 	Dim volusion : Set volusion = (New VolusionApi)( "domain.com", "email@domain.com", "accessToken" )
'
Class VolusionApi

	Private api_domain
	Private api_login
	Private api_password
	Private api_debug
	
	' Initialize Class
	Private Sub Class_Initialize
		
	End Sub

	' Convenience constructor for passing in initialization parameters
	'
	' @param	string			key			The api key
	' @param	string			secret		The api secret key
	'
	Public Default Function construct( domain, login, password )
	
		api_domain = domain
		api_login = login
		api_password = password
		api_debug = False
		
		If dct_settings("debug_mode") = "on" Then
			api_debug = True
		End If
		
		Set construct = Me
	
	End Function	
	
	' Get a product by sku
	'
	' @param	string			sku			The product sku
	' @return	xml							The api response
	Public Function getProductBySku( sku )
		
		Set getProductBySku = read( "Generic\Products", "SELECT_Columns=*&WHERE_Column=p.ProductCode&WHERE_Value=" & sku )
		
	End Function
	
	' Get a customer by email
	'
	' @param	string			email		The customer email
	' @return	xml							The api response
	Public Function getCustomerByEmail( email )
	
		Set getCustomerByEmail = read( "Generic\Customers", "SELECT_Columns=*&WHERE_Column=EmailAddress&WHERE_Value=" & email )
		
	End Function
	
	' Get some records
	'
	' @param	xml			record			The xml payload
	' @return	xml							The api response
	'
	' Example: 
	'
	'	Dim customers : Set customers = volusion.read( "Generic\Customers", "SELECT...")
	'
	Public Function read( edi_name, params )
		
		Set read = makeRequest( "GET", "&EDI_Name=" & edi_name & "&" & params, "" )
		
	End Function
	
	' Insert a record
	'
	' @param	string		root_el			The root record type
	' @param	Array		records			An array of records
	' @return	xml							The api response
	'
	' Example:
	'
	'	Set customer = Server.CreateObject("Scripting.Dictionary")
	'	
	'	customer.Add "EmailAddress", "email@domain.com"
	'	customer.Add "FirstName", "John"
	'	customer.Add "LastName", "Doe"
	'
	'	volusion.insert( "Customers", Array( customer ) )
	'
	Public Function insert( root_el, records )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		payload.Add root_el, records
		
		Set insert = makeRequest( "INSERT", "", dict2xml(payload) )
		
	End Function
	
	' Update a record
	'
	' @param	string		root_el			The root record type
	' @param	Array		records			An array of records
	' @return	xml							The api response
	'
	' Example:
	'
	'	Set customer = Server.CreateObject("Scripting.Dictionary")
	'	
	'	customer.Add "EmailAddress", "email@domain.com"
	'	customer.Add "FirstName", "Johnny"
	'	customer.Add "LastName", "Cash"
	'
	'	volusion.update( "Customers", Array( customer ) )
	'
	Public Function update( root_el, records )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		payload.Add root_el, records
		
		Set update = makeRequest( "UPDATE", "", dict2xml(payload) )
		
	End Function
	
	' Delete a record
	'
	' @param	string		root_el			The root record type
	' @param	Array		records			An array of records
	' @return	xml							The api response
	'
	' Example:
	'
	' Example:
	'
	'	Set customer = Server.CreateObject("Scripting.Dictionary")
	'	
	'	customer.Add "EmailAddress", "email@domain.com"
	'
	'	volusion.delete( "Customers", Array( customer ) )
	'
	Public Function delete( root_el, records )
	
		Dim payload : Set payload = Server.CreateObject("Scripting.Dictionary")
		payload.Add root_el, records
		
		Set delete = makeRequest( "DELETE", "", dict2xml(payload) )
		
	End Function


	Public Function createOrderSession( customer_id, order_id )
		'' Request login page to save redirect on volusion side
		Dim Cookie: Cookie = Request.ServerVariables("HTTP_COOKIE")
		Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
		httpRequest.Open "GET", orderFinishedUrl & order_id, False
		httpRequest.SetRequestHeader "Cookie", Cookie
		httpRequest.Send

		'' Create user session on volusion
		Dim userIP: userIP = getUserIP()
		Dim sessionToken : sessionToken = RandomString(32, "hex")
		Dim sql: sql = "INSERT INTO Session_Tokens (session_token, ip_address, customerid, datetime_issued) VALUES ('"&sessionToken&"', '"&userIP&"', '"&customer_id&"', GETDATE())"
		Set result = sqlQuery(sql)

		createOrderSession = sessionToken
	End Function
	
	' Execute a SQL query
	'
	' @param 	string		sql				The sql to execute
	' @return	XmlDoc
	Public Function sqlQuery(sql)

		Dim file_name
		Dim dest_sql_path
		Dim source_xsd_path
		Dim dest_xsd_path

		file_name = RandomString(20, False)

		dest_sql_path     = vspfilesPath & "\schema\Generic\" & file_name & ".sql"

		Set fs            = Server.CreateObject("Scripting.FileSystemObject")
		Set dest_sql_file = fs.OpenTextFile(dest_sql_path, 2, true)
		dest_sql_file.WriteLine(sql)
		dest_sql_file.Close
		Set dest_sql_file = Nothing

		source_xsd_path   = breadPath & "\asp\schema\generic.xsd"
		dest_xsd_path     = vspfilesPath & "\schema\Generic\" & file_name & ".xsd"
		fs.CopyFile source_xsd_path, dest_xsd_path

		Set sqlQuery = makeRequest( "GET", "&API_Name=Generic\" & file_name, "" )

		fs.DeleteFile dest_xsd_path
		fs.DeleteFile dest_sql_path
		Set fs          = Nothing

	End Function

	' Internal api request helper
	'
	' @param	string			method			The request method (GET,INSERT,UPDATE,DELETE)
	' @param	string			params			Additional api url params
	' @param	string			payload			An xml document to post
	' @return	XmlDoc							The request response
	Private Function makeRequest( method, params, payload )
	
		Dim xmlDoc
		Dim request_url : request_url = api_domain & "/net/WebService.aspx?Login=" & api_login & "&EncryptedPassword=" & api_password
		Dim apiMethod : apiMethod = "POST"
		
		If method = "INSERT" Then
			request_url = request_url & "&Import=Insert"
			
		ElseIf method = "UPDATE" Then
			request_url = request_url & "&Import=Update"
			
		ElseIf method = "DELETE" Then
			request_url = request_url & "&Import=Delete"
			
		Else
			apiMethod = "GET"
			
		End If
		
		If params <> "" Then
			request_url = request_url & params
		End If
		
		If apiMethod = "POST" Then
		
			Dim xml_post : Set xml_post = server.createobject("Msxml2.serverXmlHttp")
			Dim xml_payload : xml_payload = "<?xml version=""1.0"" encoding=""UTF-8""?><Import>" & payload & "</Import>"
			
			xml_post.open "POST", request_url, False
			xml_post.setRequestHeader "Content-Type", "application/x-www-form-urlencoded; charset=utf-8"
			xml_post.setRequestHeader "Content-Action", "Volusion_API"
			xml_post.setTimeouts 100000, 100000, 600000, 9999999
			Server.ScriptTimeout = 10800
			
			If api_debug Then
				Set fso_log = Server.CreateObject("Scripting.FileSystemObject")
				Set file_log = fso_log.OpenTextFile(Server.MapPath("/v/bread/asp/log-volusion-api.inc"), 8, True)			
				file_log.WriteLine( "POST to url: " & request_url )
				file_log.WriteLine( xml_payload )
			End If
			
			xml_post.send xml_payload
			
			If api_debug Then
				file_log.WriteLine( "Server Response:" )
				file_log.WriteLine( xml_post.responseText )
				file_log.WriteLine( "" )
				file_log.Close
			End If
			
			Set makeRequest = xml_post.responseXML
			
		Else
		
			Set xmlDoc = Server.CreateObject("MSXML2.DOMDocument.3.0")
			xmlDoc.setProperty "ServerHTTPRequest", True
			xmlDoc.async = False
			xmlDoc.Load( request_url )
			
			If api_debug Then
				Set fso_log = Server.CreateObject("Scripting.FileSystemObject")
				Set file_log = fso_log.OpenTextFile(Server.MapPath("/v/bread/asp/log-volusion-api.inc"), 8, True)			
				file_log.WriteLine( "GET from url: " & request_url )
				file_log.WriteLine( "Server Response:" )
				file_log.WriteLine( xmlDoc.xml )
				file_log.WriteLine( "" )
				file_log.Close
			End If
			
			Set makeRequest = xmlDoc
			
		End If
		
	End Function
	
	' Create an xml string from dictionary values
	'
	' @param	Dictionary		dict		
	' @return	string
	Public Function dict2xml( dict )	
		dict2xml = ""
		Dim vtype
		
		For Each key In dict.Keys
			vtype = VarType(dict(key))

			' array value
			If vtype >= 8192 Then
				For Each item In dict(key)
					dict2xml = dict2xml & "<" & key & ">" & dict2xml(item) & "</" & key & ">"
				Next
			
			' dictionary value
			ElseIf vtype = 13 Then
				dict2xml = dict2xml & "<" & key & ">" & dict2xml(dict(key)) & "</" & key & ">"
				Exit Function

			' null value
			ElseIf vtype = 1 Then
				dict2xml = dict2xml & "<" & key & "></" & key & ">"				

			' scalar value
			Else
				dict2xml = dict2xml & "<" & key & ">" & CStr( dict(key) ) & "</" & key & ">"
			End If
		Next

	End Function

	' Random string generator (for temporary file names creation)
	'
	' @param int strLen     The length of the string to generate
	' @return string
	Public Function RandomString(strLen, key)

		Dim str, min, max, characters

		Const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		Const SYMBOLS = "`1234567890-=qwertyuiop[]asdfghjkl;'\<zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}ASDFGHJKL:""|>ZXCVBNM<>?"
		Const HEX_DIGITS = "1234567890ABCDEF"

		If key = "hex" Then
			characters = HEX_DIGITS
		ElseIf key Then
			characters = SYMBOLS
		Else
			characters = LETTERS
		End If

		min = 1
		max = Len(characters)

		Randomize
		For i = 1 To strLen
			str = str & Mid( characters, Int((max-min+1)*Rnd+min), 1 )
		Next

		RandomString = str
	End Function

	''''''''''''''''''''''''''''''''''''
	'' Get user IP from server variables
	''
	'' return string
	''''''''''''''''''''''''''''''''''''
	Public Function getUserIP()
	    Dim strIP : strIP = Request.ServerVariables("HTTP_X_REAL_IP")
	    If strIP = "" Then strIP = Request.ServerVariables("HTTP_X_FORWARDED_FOR")
	    Dim commaPos : commaPos = InStr(strIP, ",")
	    If commaPos > 0 Then strIP = Mid(strIP, 1, commaPos-1)
	    getUserIP = strIP
	End Function	
	
End Class

%>