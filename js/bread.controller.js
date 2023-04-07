/** 
 * 
 * This controlller determines which vesrion - classic/platform - of Bread the store
 * uses and redirects them to the appropriate script accordingly
 * 
*/

(function ($) {

    $(document).ready(function () {

        const versionDirect = function () {
            // Retreves user's classic or platform setting and redirects to the appropriate JS script file
            const breadVersion = sessionStorage.getItem("bread-version");
            let script = document.createElement("script");
            script.type = "text/javascript";

            if (breadVersion === "classic") {
                script.src = "/v/bread/js/breadClassic.controller.js";
            } else {
                script.src = "/v/bread/js/breadPlatform.controller.js";
            };
            document.head.appendChild(script);
        };

        $.getJSON('/v/bread/asp/breadSettings.asp', function (settings) {
            if (settings.success) {
                sessionStorage.setItem("bread-version", settings.bread_version);
                versionDirect();
            }
        });
    });
})(window.$jQueryModern || jQuery);