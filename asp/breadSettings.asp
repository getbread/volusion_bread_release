<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->

<%
Set jsonHelper = New VbsJson
Set output     = Server.CreateObject("Scripting.Dictionary")

output.Add "success", True
output.Add "environment", dct_settings("bread_env")
output.Add "classic_api_key", dct_settings("bread_classic_api_key")
output.Add "platform_api_key", dct_settings("bread_platform_api_key")
output.Add "integration_key", dct_settings("bread_platform_integration_key")
output.Add "bread_tenant", dct_settings("bread_tenant")
output.Add "bread_version", dct_settings("bread_version")
output.Add "customCSS", dct_settings("bread_button_css")
output.Add "disable_autoload", dct_settings("disable_autoload")
output.Add "disable_product_checkout", dct_settings("bread_disable_product_checkout")
output.Add "disable_cart_checkout", dct_settings("bread_disable_cart_checkout")

Response.Write jsonHelper.Encode( output )
%>