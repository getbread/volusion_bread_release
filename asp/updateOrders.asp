<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->
<!--#include file="./classes/breadPlatformApi.asp"-->


<%

Dim jsonHelper : Set jsonHelper = New VbsJson
Dim breadPlatform : Set breadPlatform = (New BreadPlatformApi)( dct_settings("bread_platform_api_key"), dct_settings("bread_platform_api_secret") )
Dim tx_id : tx_id = Request.Form("tx_id")
Dim amount : amount = Request.Form("amount")
Dim order_status : order_status = Request.Form("order_status")
Dim externalID : externalID = Request.Form("externalID")

If tx_id = "" Then
	Response.Write "{ ""success"": false, ""message"": ""tx_id missing"" }"
	Response.End
End If

' Always send an order ID number to Bread
Set update = breadPlatform.updateTransaction( tx_id, externalID )

' Determine the new status of the order and
' update the Bread Merchant Portal accordingly

If order_status = "Cancelled" Then

Set cancel = breadPlatform.cancelTransaction( tx_id, amount )

Response.Write "Order Updated"
Response.End

Elseif order_status = "Returned" Then

Set refund = breadPlatform.refundTransaction( tx_id, amount )

Response.Write "Order Updated"
Response.End

Elseif order_status = "Shipped" Then

Set settle = breadPlatform.settleTransaction( tx_id, amount )

Response.Write "Order Updated"
Response.End

End If

%>