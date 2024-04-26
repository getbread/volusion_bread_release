<!--#include file="load_tenant_settings.inc"-->
<!--#include file="./classes/jsonHelper.asp"-->

<%
Set jsonHelper = New VbsJson
Set output     = Server.CreateObject("Scripting.Dictionary")

output.Add "success", True
output.Add "tenant_prefix", tnt_settings("tenant_prefix")
output.Add "tenant_name", tnt_settings("tenant_name")
output.Add "domain_sandbox", tnt_settings("domain_sandbox")
output.Add "domain_production", tnt_settings("domain_production")
output.Add "sdk_sandbox", tnt_settings("sdk_sandbox")
output.Add "sdk_production", tnt_settings("sdk_production")
output.Add "currency", tnt_settings("currency")
output.Add "cpb_url_sandbox", tnt_settings("cpb_url_sandbox")
output.Add "cpb_url_production", tnt_settings("cpb_url_production")

Response.Write jsonHelper.Encode( output )
%>