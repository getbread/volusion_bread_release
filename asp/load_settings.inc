<%
Set fso_settings  = Server.CreateObject("Scripting.FileSystemObject")
Set file_settings = fso_settings.OpenTextFile(Server.MapPath("/v/bread/dashboard/settings.inc"))
Set dct_settings  = CreateObject("Scripting.Dictionary")
Dim settings_line

dct_settings.RemoveAll
Do While file_settings.AtEndOfStream <> True
	settings_line = Split( file_settings.ReadLine, "|" )
	dct_settings.Add settings_line(0), settings_line(1)
Loop
file_settings.Close

%>