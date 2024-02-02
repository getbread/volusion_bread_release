const fs = require('fs');
const yaml = require('js-yaml');

const config = yaml.load(fs.readFileSync('./config/config.yml', 'utf-8'));

const tenant_prefix = config["tenant_prefix"];
const tenant_name =config["tenant_name"]
const domain_sandbox = config["platform_domain_sandbox_api"];
const domain_production = config["platform_domain_production_api"];
const sdk_sandbox = config["sdk_sandbox"];
const sdk_production = config["sdk_production"];
const currency = config["currency"]

const settings = `tenant_prefix|${tenant_prefix}\ntenant_name|${tenant_name}\ndomain_sandbox|${domain_sandbox}\ndomain_production|${domain_production}\nsdk_sandbox|${sdk_sandbox}\nsdk_production|${sdk_production}\ncurrency|${currency}\n`;

fs.appendFileSync(`./dashboard/tenant_settings.inc`, settings);
