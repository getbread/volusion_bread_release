<!--#include file="global.inc"-->
<!--#include file="../asp/load_tenant_settings.inc"-->
<%

Dim login_error

If LCase(Request.ServerVariables("REQUEST_METHOD")) = "post" Then

	' check password
	Session("isauthorized") = (MD5(Request.Form("password")) = dct_setup("password"))
	
	' always authorize if the setup password is blank
	If IsEmpty(dct_setup("password")) Then 
		Session("isauthorized") = True
		Response.Redirect "setup.asp"
	End If
	
	If Session("isauthorized") Then Response.Redirect base_url
	
	' set login error text
	login_error = "Invalid Password"
	
End If

%>

<% If tnt_settings("tenant_prefix") = "rbc" Then %>
	<!--#include file="_rbcheader.inc"-->
<% Elseif tnt_settings("tenant_prefix") = "bread" Then %>
	<!--#include file="_breadpayheader.inc"-->
<% End If %>

<div class="row">
	<div class="col-md-4 col-md-offset-4">
		<h2>Log In</h2>
		<% If login_error > "" Then %>
			<div class="alert alert-danger">
				<% = login_error %>
			</div>
		<% End If %>
		<div class="panel panel-default">
			<div class="panel-body">
				<form action="login.asp" method="POST">

					<div class="form-group">
						<input type="password" class="form-control" id="password" name="password" placeholder="Enter Password">
					</div>
					
					<button type="submit" class="btn btn-default btn-block">Log In</button>

				</form>
			</div>
		</div>
	</div>
</div>

<!--#include file="_footer.inc"-->