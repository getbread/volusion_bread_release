<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->

<%
Set jsonHelper = New VbsJson
Set output     = Server.CreateObject("Scripting.Dictionary")

output.Add "success", True
output.Add "environment", dct_settings("bread_env")
output.Add "classic_api_key", dct_settings("bread_classic_api_key")
output.Add "platform_api_key", dct_settings("bread_platform_api_key")
output.Add "platform_auth", dct_settings("bread_platform_auth")
output.Add "integration_key", dct_settings("bread_platform_integration_key")
output.Add "bread_tenant", dct_settings("bread_tenant")
output.Add "bread_version", dct_settings("bread_version")
output.Add "customCSS", dct_settings("bread_button_css")
output.Add "disable_autoload", dct_settings("disable_autoload")
output.Add "disable_product_checkout", dct_settings("bread_disable_product_checkout")
output.Add "disable_cart_checkout", dct_settings("bread_disable_cart_checkout")
output.Add "bread_product_min", dct_settings("bread_product_min")
output.Add "bread_product_max", dct_settings("bread_product_max")
output.Add "disable_product_button", dct_settings("bread_disable_product_button")
output.Add "disable_cart_button", dct_settings("bread_disable_cart_button")
output.Add "bread_payment_method_id", dct_settings("bread_payment_method_id")
output.Add "bread_enable_sku_filter", dct_settings("bread_enable_sku_filter")
output.Add "bread_sku_filter_list", dct_settings("bread_sku_filter_list")
output.Add "bread_embedded_checkout", dct_settings("bread_embedded_checkout")

Response.Write jsonHelper.Encode( output )
%>