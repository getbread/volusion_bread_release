<%
Class SMTP

    Public smtpServer
	Public smtpEmail
	Public smtpPassword
    Public EmailSubject
    Public EmailFrom
    Public EmailTo
    Public TextBody
    Public HTMLBody
	Public Template
    
    Public Sub Send()
	
		If dct_settings("debug_mode") = "on" Then
			Set email_fso = Server.CreateObject("Scripting.FileSystemObject")
			Set email_log = email_fso.OpenTextFile(Server.MapPath("/v/bread/asp/log-smtp-api.inc"), 8, True)
			email_log.WriteLine( "------------------------" )
			email_log.WriteLine( "Sending Email to " &  EmailTo & " ..." )
		End If
		
		Set objMail = CreateObject("CDO.Message")
		
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserver") = smtpServer
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 1
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = 2525 
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpusessl") = 0
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendusername") = smtpEmail
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendpassword") = smtpPassword
		objMail.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpconnectiontimeout") = 5 
		objMail.Configuration.Fields.Update 
        
		On Error Resume Next
		
		objMail.Subject = EmailSubject
		objMail.htmlBody = HTMLBody
		objMail.From = EmailFrom
		objMail.To = EmailTo
		objMail.Send
		
		If Err.Number = 0 Then
			If dct_settings("debug_mode") = "on" Then
				email_log.WriteLine( "Sent." )
			End If
		Else
			If dct_settings("debug_mode") = "on" Then
				email_log.WriteLine( "Error: " & Err.Description )
			End If		
		End If
		
		If dct_settings("debug_mode") = "on" Then
			email_log.Close
		End If	
		
        Set objMail = Nothing
		
    End Sub
	
	' Load an email template into the html body, performing replacements as needed
	' 
	' @param	string			TemplateFile			The filename of the email in the email_templates folder
	' @param	Dictionary		Replacements			A dictionary of replacements to make in the email template
	' @return	string
	'
	Public Function LoadTemplate( TemplateFile, Replacements )
	
		Set fs = Server.CreateObject("Scripting.FileSystemObject")
		Set file = fs.OpenTextFile(Server.MapPath("/v/vspFiles/email_templates/" & TemplateFile & ".asp"))
		Dim EmailContent : EmailContent = file.readAll
		file.Close
		
		For Each key in Replacements.Keys		
			EmailContent = Replace( EmailContent, "$(" & key & ")", Replacements(key) )
		Next
		
		HTMLBody = EmailContent
		LoadTemplate = EmailContent
	
	End Function
	
End Class
%>
