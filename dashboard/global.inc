<%

' Force HTTPS
If Request.ServerVariables("HTTPS") = "off" and Request.ServerVariables("HTTP_X_FORWARDED_PROTO") <> "https" Then
	
	Dim script_name : script_name = Request.ServerVariables("SCRIPT_NAME")
	Dim query_string : query_string = Request.ServerVariables("QUERY_STRING")
	Dim redir_url : redir_url = Request.ServerVariables("URL")
	
	If InStr(1, script_name, "Default.asp") > 0 Then redir_url = Replace(redir_url, "Default.asp", "")
	If query_string <> "" Then query_string = "?" & query_string
	
	Response.Redirect "https://" & Request.ServerVariables("SERVER_NAME") & redir_url & query_string
	 
End If

Randomize Timer

' start new session
Session.Timeout = 10
If IsEmpty(Session("uuid")) Then Session("uuid") = UUID
If IsEmpty(Session("isauthorized")) Then Session("isauthorized") = False

' Gets the script location on the host file system (works for vbs & asp)
Dim script_path
If IsEmpty(Server) Then
	script_path = WScript.ScriptFullName
Else
	script_path = Server.MapPath(Request.ServerVariables("SCRIPT_NAME"))
End If

' Initialize global FSO and get base application path
Dim fso : Set fso = Server.CreateObject("Scripting.FileSystemObject")
Dim base_path : base_path = fso.GetParentFolderName(script_path) & "\"
Dim base_url : base_url = RegexGetString(Request.ServerVariables("URL"), "(.+/)\w+\.asp")

' generate GUID to use as session id
Function UUID()
   Dim i, RndNum
   For i = 0 to 7
      RndNum = CLng(rnd * "&HFFFF")
      If i = 3 Then RndNum = (RndNum And "&HFFF") Or "&H4000"
      If i = 4 Then RndNum = (RndNum And "&H3FFF") Or "&H8000"
      UUID = UUID + String(4 - Len(Hex(RndNum)), "0") + LCase(Hex(RndNum))
      If i=1 Or i=2 Or i=3 Or i=4 Then UUID = UUID + "-"
   Next
End Function

%>

<!--#include file="md5.inc"-->
<!--#include file="regex.inc"-->
<!--#include file="setup.inc"-->

<%

If RegexMatchString(script_path, "(default|login).asp$") = False And Session("isauthorized") = False Then
	Response.Redirect "default.asp"
End If
%>
