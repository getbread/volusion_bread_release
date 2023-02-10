<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->

<%
Set jsonHelper = New VbsJson
Set output     = Server.CreateObject("Scripting.Dictionary")

output.Add "success", True
output.Add "environment", dct_settings("bread_env")
output.Add "api_key", dct_settings("bread_api_key")
output.Add "customCSS", dct_settings("bread_button_css")
output.Add "disable_autoload", dct_settings("disable_autoload")
output.Add "disable_product_checkout", dct_settings("bread_disable_product_checkout")
output.Add "disable_cart_checkout", dct_settings("bread_disable_cart_checkout")

Response.Write jsonHelper.Encode( output )
%>