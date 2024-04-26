/**
 * When a merchant saves their Bread Pay/RBC PayPlan settings, this operator shares those updated settings
 * with Volusion and with the core_plugin_backend API. 
 */


$(function () {
    $("#date_start").datepicker();
    $("#date_end").datepicker();
    $('[data-toggle="tooltip"]').tooltip();
    $("#api_url").on("change paste", function () {

        var a = document.createElement("a");
        a.href = $(this).val();

        var params = {};
        a.search.replace("?", "").split("&").forEach(function (param) {
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

function thank_volusion(string) {
    return string
        .replace(/top/g, '_vs_')
        .replace(/url/g, '_url_')
        .replace(/_url_\(/g, '_url_[')
        ;
}

$(document).on('submit', 'form', function (e) {
    // ensures user is logged in as refreshing the page 
    // is needed to move from login page to the settings form
    if ($("#logout").length === 1) {
        e.preventDefault();
    };

    $.getJSON('/v/bread/asp/tenantSettings.asp', function (tenant_settings) {
        sessionStorage.setItem("domain_sandbox", tenant_settings.domain_sandbox);
        sessionStorage.setItem("domain_production", tenant_settings.domain_production);
        sessionStorage.setItem("cpb_url_sandbox", tenant_settings.cpb_url_sandbox);
        sessionStorage.setItem("cpb_url_production", tenant_settings.cpb_url_production);
    })

    let storeId = window.location.href;
    // Sometimes the url used for storeId ends with /setup.asp. Somestimes it doesn't. 
    // If it does, we remove it for uniformity
    if (storeId.endsWith("setup.asp")) {
        storeId = storeId.substring(0, storeId.length - 9);
    };

    const environment = $('#bread_env').val();
    const disable_product_button = $("#bread_disable_product_button").prop("checked");
    const disable_cart_button = $("#bread_disable_cart_button").prop("checked");
    const bread_embedded_checkout = $("#bread_embedded_checkout").prop("checked");
    const bread_sku_filter_list = $("#bread_sku_filter_list").val();
    const bread_product_min = $("#bread_product_min").val();
    const bread_payment_settle = $("#bread_payment_settle").prop("checked");
    const platform_auth = $("#bread_platform_auth").val();
    const platform_api_key = $("#bread_platform_api_key").val();
    const integration_key = $("#bread_platform_integration_key").val();
    const bread_platform_api_secret = $("#bread_platform_api_secret").val();
    const bread_enable_sku_filter = $("#bread_enable_sku_filter").val();

    const domain_sandbox = sessionStorage.getItem("domain_sandbox");
    const domain_production = sessionStorage.getItem("domain_production");
    const cpb_url_sandbox = sessionStorage.getItem("cpb_url_sandbox");
    const cpb_url_production = sessionStorage.getItem("cpb_url_production");


    let settings_request_data = {
        StoreId: storeId,
        PluginType: "volusion",
        EnableProductButton: disable_product_button,
        EnableCartButton: disable_cart_button,
        EnableEmbeddedCheckout: bread_embedded_checkout,
        Production: null,
        SkuFilterMode: "",
        SkuFilter: bread_sku_filter_list,
        MinCartValue: parseFloat(bread_product_min),
        SettlementMode: bread_payment_settle === true ? "CHECKOUT" : "CAPTURE",
        BreadApiKeySandbox: "",
        SandboxIntegrationKey: "",
        BreadSecretKeySandbox: "",
        BreadApiKey: "",
        IntegrationKey: "",
        BreadSecretKey: ""
    };

    if (bread_enable_sku_filter === "Off") {
        settings_request_data.SkuFilterMode = "NONE";
    } else {
        settings_request_data.SkuFilterMode = bread_enable_sku_filter.toUpperCase();
    };

    let auth_url;
    let core_plugin_backend_baseurl;

    if (environment === "sandbox") {
        auth_url = `${domain_sandbox}/auth/service/authorize`
        settings_request_data.BreadApiKeySandbox = platform_api_key;
        settings_request_data.SandboxIntegrationKey = integration_key;
        settings_request_data.BreadSecretKeySandbox = bread_platform_api_secret;
        settings_request_data.BreadApiKey = "";
        settings_request_data.IntegrationKey = "";
        settings_request_data.BreadSecretKey = "";
        settings_request_data.Production = false;
        core_plugin_backend_baseurl = cpb_url_sandbox + "/settings?storeId=";
    } else {
        auth_url = `${domain_production}/auth/service/authorize`
        settings_request_data.BreadApiKey = platform_api_key;
        settings_request_data.IntegrationKey = integration_key;
        settings_request_data.BreadSecretSandbox = bread_platform_api_secret;
        settings_request_data.BreadApiKeySandbox = "";
        settings_request_data.SandboxIntegrationKey = "";
        settings_request_data.BreadSecretKeySandbox = "";
        settings_request_data.Production = true;
        core_plugin_backend_baseurl = cpb_url_production + "/settings?storeId=";
    };

    $.ajax({
        method: "POST",
        headers: {
            "Authorization": `${platform_auth}`,
        },
        url: auth_url,
    }).then(response => {
        $.ajax({
            method: "POST",
            ContentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: {
                "Authorization": `Bearer ${response.token}`,
            },
            url: core_plugin_backend_baseurl + storeId,
            data: JSON.stringify(settings_request_data),
        }).then(() => {
            var form = $(this);
            var bread_css = form.find('#bread_css');
            var bread_button_css = form.find('#bread_button_css');

            /* Work around bug in volusion firewall that blocks css, which volusion can't fix (surprised?) */
            if (bread_css.length) {
                bread_css.val(thank_volusion(bread_css.val()));
            }
            if (bread_button_css.length) {
                bread_button_css.val(thank_volusion(bread_button_css.val()));
            }

            e.currentTarget.submit()
        });
    });
});
