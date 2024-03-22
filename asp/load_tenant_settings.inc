<%
Set fso_tenant_settings  = Server.CreateObject("Scripting.FileSystemObject")
Set file_tenant_settings = fso_tenant_settings.OpenTextFile(Server.MapPath("/v/bread/dashboard/tenant_settings.inc"))
Set tnt_settings  = CreateObject("Scripting.Dictionary")
Dim tenant_settings_line

tnt_settings.RemoveAll
Do While file_tenant_settings.AtEndOfStream <> True
	tenant_settings_line = Split( file_tenant_settings.ReadLine, "|" )
	tnt_settings.Add tenant_settings_line(0), tenant_settings_line(1)
Loop
file_tenant_settings.Close

%>