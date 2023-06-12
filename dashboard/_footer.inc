		</div>

		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"></script>
		<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>
		<script>
			$(function() {
				$("#date_start").datepicker();
				$("#date_end").datepicker();
				$('[data-toggle="tooltip"]').tooltip();
				$("#api_url").on("change paste", function() {

					var a = document.createElement("a");
					a.href = $(this).val();

					var params = {};
					a.search.replace("?", "").split("&").forEach(function(param) {
						var p = param.split("=");
						params[p[0].toLowerCase()] = decodeURIComponent(p[1]);
					});

					$("#domain").val(a.hostname);
					
					if ("login" in params) {
						$("#apilogin").val(params.login);
					}

					if ("encryptedpassword" in params) {
						$("#apipassword").val(params.encryptedpassword);
					}

				});
			});
			var thank_volusion = function( string ) {
				return string
					.replace(/top/g,'_vs_')
					.replace(/url/g,'_url_')
					.replace(/_url_\(/g,'_url_[')
					;
			}
			$(document).on('submit', 'form', function(e) {
				var form = $(this);
				var bread_css = form.find('#bread_css');
				var bread_button_css = form.find('#bread_button_css');
				
				/* Work around bug in volusion firewall that blocks css, which volusion can't fix (surprised?) */
				if ( bread_css.length ) {
					bread_css.val( thank_volusion( bread_css.val() ) );
				}
				if ( bread_button_css.length ) {
					bread_button_css.val( thank_volusion( bread_button_css.val() ) );
				}
				
			});
		</script> 
		<script src="./../js/refreshBread.js" type="text/javascript"></script>
	</body>
</html>