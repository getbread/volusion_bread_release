<%
 Function RegExGetString(Source, Pattern)

	On Error Resume Next

    Dim myRegExp
    Dim myMatches
	Dim myMatch
    Dim retval
	
	Set myRegExp = Server.CreateObject("VBScript.RegExp")
    
    myRegExp.IgnoreCase = True
    myRegExp.Global = True
    myRegExp.Pattern = Pattern
    
    Set myMatches = myRegExp.Execute(Source)
	
	retVal = ""
	If myMatches.Count > 0 Then
		Set myMatch = myMatches(0)
		retval = myMatch.SubMatches(0)
	End If
	
    ' Cleanup
    Set myRegExp = Nothing
    Set myMatches = Nothing
    
    RegExGetString = retval
	
End Function

Function RegExMatchString(Source, Pattern)

	On Error Resume Next

    Dim myRegExp
    Dim myMatches
    Dim retval
	
	Set myRegExp = CreateObject("VBScript.RegExp")
    
    myRegExp.IgnoreCase = True
    myRegExp.Global = True
    myRegExp.Pattern = Pattern
    
    Set myMatches = myRegExp.Execute(Source)
    retval = (myMatches.Count > 0)
    
    ' Cleanup
    Set myRegExp = Nothing
    Set myMatches = Nothing
    
    RegExMatchString = retval

End Function

Function RegExReplace(Source, Pattern, Replace)

    On Error Resume Next

    Dim myRegExp
    Dim retval
    
    Set myRegExp = CreateObject("VBScript.RegExp")

    myRegExp.IgnoreCase = True
    myRegExp.Global = True
    myRegExp.Pattern = Pattern

    retval = myRegExp.Replace("" & Source, Replace)
    
    Set myRegExp = Nothing
    
    RegExReplace = retval
    
End Function    


%>