<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Dashboard</title>
		<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
		<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap-theme.min.css">
		<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.css" />
		<!--[if lt IE 9]>
		  <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
		  <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
		<![endif]-->
		<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,300italic,400italic,500italic,700italic" rel="stylesheet" type="text/css">
		<link rel="stylesheet" href="./css/rbc_styles.css" />	
	</head>
	<body>
		
		<nav class="navbar navbar-default navbar-fixed-top">
			<div class="container">
				<div class="navbar-header">
					<img src="./images/rbc_payplan_logo.png" />
				</div>
				<% If Session("isauthorized") = True Then %>
				<ul class="nav navbar-nav">
					<li><a href="<% = base_url%>?action=setup">Settings</a></li>
					<li id="logout"><a href="<% = base_url%>?action=logout">Log Out</a></li>
				</ul>
				<% End If %>
			</div>
		</nav>

		<div class="container">