<% 
	If Session("isauthorized") = False Then
		Server.Transfer "login.asp"
	ElseIf LCase(Request.QueryString("action") = "setup") Then
		Server.Transfer "setup.asp"
	ElseIf LCase(Request.QueryString("action") = "logout") Then
		Session("isauthorized") = False
		Session.Contents.RemoveAll
		Session.Abandon
		Response.Redirect "./"
	Else
		Server.Transfer "setup.asp"
	End If
%>