<!--#include file="load_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->

<%
Set jsonHelper = New VbsJson
Set output     = Server.CreateObject("Scripting.Dictionary")

output.Add "success", True
output.Add "environment", dct_settings("bread_env")
output.Add "platform_api_key", dct_settings("bread_platform_api_key")
output.Add "platform_auth", dct_settings("bread_platform_auth")
output.Add "integration_key", dct_settings("bread_platform_integration_key")
output.Add "disable_autoload", dct_settings("disable_autoload")
output.Add "bread_product_min", dct_settings("bread_product_min")
output.Add "bread_product_max", dct_settings("bread_product_max")
output.Add "disable_product_button", dct_settings("bread_disable_product_button")
output.Add "disable_cart_button", dct_settings("bread_disable_cart_button")
output.Add "disable_category_button", dct_settings("bread_disable_category_button")
output.Add "bread_payment_method_id", dct_settings("bread_payment_method_id")
output.Add "bread_enable_sku_filter", dct_settings("bread_enable_sku_filter")
output.Add "bread_sku_filter_list", dct_settings("bread_sku_filter_list")
output.Add "bread_embedded_checkout", dct_settings("bread_embedded_checkout")
output.Add "bread_replace_checkout_button", dct_settings("bread_replace_checkout_button")
output.Add "bopis_contact_firstname", dct_settings("bopis_contact_firstname")
output.Add "bopis_contact_lastname", dct_settings("bopis_contact_lastname")
output.Add "bopis_contact_additionalname", dct_settings("bopis_contact_additionalname")
output.Add "bopis_contact_phone", dct_settings("bopis_contact_phone")
output.Add "bopis_contact_email", dct_settings("bopis_contact_email")
output.Add "bopis_address_1", dct_settings("bopis_address_1")
output.Add "bopis_address_2", dct_settings("bopis_address_2")
output.Add "bopis_address_locality", dct_settings("bopis_address_locality")
output.Add "bopis_address_region", dct_settings("bopis_address_region")
output.Add "bopis_address_postalcode", dct_settings("bopis_address_postalcode")
output.Add "bread_payment_settle", dct_settings("bread_payment_settle")

Response.Write jsonHelper.Encode( output )
%>