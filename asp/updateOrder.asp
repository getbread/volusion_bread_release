<!--#include file="load_settings.inc"-->
<!--#include file="./classes/volusionApi.asp"-->

<%

Dim volusion : Set volusion = (New VolusionApi)( "http://" & dct_settings("domain"), dct_settings("apilogin"), dct_settings("apipassword") )

Set getData = volusion.read("Generic\Orders", "SELECT_Columns=*")

Set fso_log = Server.CreateObject("Scripting.FileSystemObject")
Set file_log = fso_log.OpenTextFile(Server.MapPath("/v/bread/asp/log-volusion-api.inc"), 8, True)			
file_log.WriteLine("Data: " + getData.xml)
file_log.Close

Response.Write getData.xml

%>