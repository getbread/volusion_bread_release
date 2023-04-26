<%

Dim setup_file_path : setup_file_path = (base_path & "settings.inc")
Dim css_file_path : css_file_path = (RegexReplace(base_path, "\w+\\$", "") & "css\styles.css")
Dim dct_setup : Set dct_setup = CreateObject("Scripting.Dictionary")
Dim setup_errors

Call Load_Settings()

' Update Settings File
If LCase(Request.ServerVariables("REQUEST_METHOD")) = "post" And RegexMatchString(script_path, "setup.asp$") Then
	Call Save_Settings()
End If

Call Load_Settings()

Sub Load_Settings()

	dct_setup.RemoveAll
	
	Dim file_setup : Set file_setup = fso.OpenTextFile(setup_file_path)

	' read each line from the config file into dct_setup
	' lines: password (hashed), domain, sitename, apilogin, apikey
	Dim line
	Do While file_setup.AtEndOfStream <> True

		line = Split(file_setup.ReadLine, "|")
		dct_setup.Add line(0), line(1)

	Loop
	file_setup.Close
	
	If Not dct_setup.Exists("domain") Then
		dct_setup.Add "domain", Request.ServerVariables("SERVER_NAME")  
	End If
	
End Sub

Sub Save_Settings()

	Dim file_setup : Set file_setup = fso.CreateTextFile(setup_file_path, True)
	
	If Request.Form("update_password") = "on" Then
		
		If StrComp(Request.Form("password"), Request.Form("verify_password")) = 0 Then
			dct_setup("password") = MD5(Request.Form("password"))
		Else
			setup_errors = setup_errors & "<p>Passwords do not match</p>"
		End If
 
	End If
	
	file_setup.WriteLine("password|" & dct_setup("password"))
	file_setup.WriteLine("storename|" & Request.Form("storename"))
	
	If RegexMatchString(Request.Form("api_string"), "Login=(.+)&.*EncryptedPassword=(.+)&") Then
		file_setup.WriteLine("domain|" & RegexGetString(Request.Form("api_string"), "//(.+?)/"))
		file_setup.WriteLine("apilogin|" & RegexGetString(Request.Form("api_string"), "Login=(.+?)&"))
		file_setup.WriteLine("apipassword|" & RegexGetString(Request.Form("api_string"), "EncryptedPassword=(.+?)&"))
	Else
		file_setup.WriteLine("domain|" & Request.Form("domain"))
		file_setup.WriteLine("apilogin|" & Request.Form("apilogin"))
		file_setup.WriteLine("apipassword|" & Request.Form("apipassword"))
	End If

	file_setup.WriteLine("merchantfrom|" & Request.Form("merchantfrom"))
	file_setup.WriteLine("merchantemail|" & Request.Form("merchantemail"))

	' Bread Settings
	file_setup.WriteLine("bread_classic_api_key|" & Request.Form("bread_classic_api_key"))
	file_setup.WriteLine("bread_classic_api_secret|" & Request.Form("bread_classic_api_secret"))
	file_setup.WriteLine("bread_env|" & Request.Form("bread_env"))
	file_setup.WriteLine("bread_tenant|" & Request.Form("bread_tenant"))
	file_setup.WriteLine("bread_version|" & Request.Form("bread_version"))
	file_setup.WriteLine("bread_platform_api_key|" & Request.Form("bread_platform_api_key"))
	file_setup.WriteLine("bread_platform_api_secret|" & Request.Form("bread_platform_api_secret"))
	file_setup.WriteLine("bread_platform_integration_key|" & Request.Form("bread_platform_integration_key"))
	file_setup.WriteLine("bread_platform_auth|" & Request.Form("bread_platform_auth"))
	file_setup.WriteLine("bread_classic_auth|" & Request.Form("bread_classic_auth"))
	file_setup.WriteLine("bread_product_min|" & Request.Form("bread_product_min"))
	file_setup.WriteLine("bread_product_max|" & Request.Form("bread_product_max"))
	file_setup.WriteLine("bread_enable_sku_filter|" & Request.Form("bread_enable_sku_filter"))
	file_setup.WriteLine("bread_sku_filter_list|" & Request.Form("bread_sku_filter_list"))
	file_setup.WriteLine("bread_payment_method_id|" & Request.Form("bread_payment_method_id"))
	file_setup.WriteLine("bread_payment_settle|" & Request.Form("bread_payment_settle"))
	file_setup.WriteLine("bread_disable_product_checkout|" & Request.Form("bread_disable_product_checkout"))
	file_setup.WriteLine("bread_disable_cart_checkout|" & Request.Form("bread_disable_cart_checkout"))
	file_setup.WriteLine("bread_disable_product_button|" & Request.Form("bread_disable_product_button"))
	file_setup.WriteLine("bread_disable_cart_button|" & Request.Form("bread_disable_cart_button"))
	file_setup.WriteLine("bread_button_css|" & Thank_Volusion( Request.Form("bread_button_css") ) )
	file_setup.WriteLine("debug_mode|" & Request.Form("debug_mode"))
	file_setup.WriteLine("disable_autoload|" & Request.Form("disable_autoload"))
	file_setup.WriteLine("ajax_line_items_mode|" & Request.Form("ajax_line_items_mode"))
	file_setup.WriteLine("completed_order_status|" & Request.Form("completed_order_status"))
	
	file_setup.Close

	Call Save_Custom_CSS()

End Sub 

Function Load_Custom_CSS()

	If fso.FileExists(css_file_path) = False Then 
		Load_Custom_CSS = ""
		Exit Function
	End If

	Dim file_css : Set file_css = fso.OpenTextFile(css_file_path)
	Dim css : css = ""

	If file_css.AtEndOfStream = False Then 
		css = file_css.ReadAll()
	End If

	file_css.Close

	Load_Custom_CSS = css

End Function

Function Thank_Volusion( SomeString )

	Thank_Volusion = SomeString
	Thank_Volusion = Replace( Thank_Volusion, "_vs_", "top" )
	Thank_Volusion = Replace( Thank_Volusion, "_url_", "url" )
	Thank_Volusion = Replace( Thank_Volusion, "url[", "url(" )

End Function

Sub Save_Custom_CSS()

	Dim file_css : Set file_css = fso.CreateTextFile(css_file_path, True)
	file_css.Write("" & Thank_Volusion( Request.Form("bread_css") ) )
	file_css.Close

End Sub
%>