<%

CONST API_URL_BASE = "http://{{DOMAIN}}/net/WebService.aspx?Login={{LOGIN}}&EncryptedPassword={{APIPASSWORD}}&EDI_Name={{EDINAME}}"

' Fetch Volusion orders 100 at a time until the queue is empty.
Function Volusion_Get_Orders()

	Dim url : url = Api_GetUrl("Generic\Orders") & "&SELECT_Columns=*"
	
	Set Volusion_Get_Orders = Submit_Api_Request(url)

End Function

Function Volusion_Get_Customer(customer_id) 

	Dim url : url = Api_GetUrl("Generic\Customers") & "&SELECT_Columns=*&WHERE_Column=CustomerID&WHERE_Value=" & customer_id
	
	Set Volusion_Get_Customer = Submit_Api_Request(url)

End Function

Function Volusion_Get_Product(product_id) 

	Dim url : url = Api_GetUrl("Generic\Products") & "&SELECT_Columns=*&WHERE_Column=p.ProductID&WHERE_Value=" & product_id
	
	Set Volusion_Get_Product = Submit_Api_Request(url)

End Function

Function Volusion_Get_ChildProducts(product_code)

	Dim url : url = Api_GetUrl("Generic\Products") & "&SELECT_Columns=*&WHERE_Column=p.IsChildOfProductCode&WHERE_Value=" & product_code

	Set Volusion_Get_ChildProducts = Submit_Api_Request(url)

End Function

Function Api_GetUrl(edi_name) 

	Dim url : url = API_URL_BASE
	url = Replace(url, "{{DOMAIN}}", dct_setup("domain"))
	url = Replace(url, "{{LOGIN}}", dct_setup("apilogin"))
	url = Replace(url, "{{APIPASSWORD}}", dct_setup("apipassword"))
	url = Replace(url, "{{EDINAME}}", edi_name)
	
	Api_GetUrl = url

End Function

Function Submit_Api_Request(url)

	Dim xmlDoc : Set xmlDoc = Server.CreateObject("MSXML2.DOMDocument.3.0")
	xmlDoc.setProperty "ServerHTTPRequest", True
	xmlDoc.async = False
	
	xmlDoc.Load(url)
	
	Set Submit_Api_Request = xmlDoc

End Function
%>