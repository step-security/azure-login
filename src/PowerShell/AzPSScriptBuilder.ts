import { LoginConfig } from '../common/LoginConfig';
import { psEscapeSingleQuoted as q } from '../common/Utils';

export default class AzPSScriptBuilder {

    static getImportLatestModuleScript(moduleName: string): string {
        let script = `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            $latestModulePath = (Get-Module -Name '${q(moduleName)}' -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1).Path
            Import-Module -Name $latestModulePath
            $output['Success'] = $true
            $output['Result'] = $latestModulePath
        }
        catch {
            $output['Success'] = $false
            $output['Error'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;

        return script;
    }

    static async getAzPSLoginScript(loginConfig: LoginConfig) {
        let loginMethodName = "";
        let commands = "";

        if (loginConfig.environment.toLowerCase() == "azurestack") {
            commands += `Add-AzEnvironment -Name '${q(loginConfig.environment)}' -ARMEndpoint '${q(loginConfig.resourceManagerEndpointUrl)}' | out-null;`;
        }
        if (loginConfig.authType === LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL) {
            if (loginConfig.servicePrincipalSecret) {
                commands += AzPSScriptBuilder.loginWithSecret(loginConfig);
                loginMethodName = 'service principal with secret';
            } else {
                commands += await AzPSScriptBuilder.loginWithOIDC(loginConfig);
                loginMethodName = "OIDC";
            }
        } else {
            if (loginConfig.servicePrincipalId) {
                commands += AzPSScriptBuilder.loginWithUserAssignedIdentity(loginConfig);
                loginMethodName = 'user-assigned managed identity';
            } else {
                commands += AzPSScriptBuilder.loginWithSystemAssignedIdentity(loginConfig);
                loginMethodName = 'system-assigned managed identity';
            }
        }

        let script = `try {
            $ErrorActionPreference = "Stop"
            $WarningPreference = "SilentlyContinue"
            $output = @{}
            ${commands}
            $output['Success'] = $true
            $output['Result'] = ""
        }
        catch {
            $output['Success'] = $false
            $output['Error'] = $_.exception.Message
        }
        return ConvertTo-Json $output`;

        return [loginMethodName, script];
    }

    private static loginWithSecret(loginConfig: LoginConfig): string {
        let loginCmdlet = `$psLoginSecrets = ConvertTo-SecureString '${q(loginConfig.servicePrincipalSecret)}' -AsPlainText -Force; `;
        loginCmdlet += `$psLoginCredential = New-Object System.Management.Automation.PSCredential('${q(loginConfig.servicePrincipalId)}', $psLoginSecrets); `;

        let cmdletSuffix = "-Credential $psLoginCredential";
        loginCmdlet += AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);

        return loginCmdlet;
    }

    private static async loginWithOIDC(loginConfig: LoginConfig) {
        await loginConfig.getFederatedToken();
        let cmdletSuffix = `-ApplicationId '${q(loginConfig.servicePrincipalId)}' -FederatedToken '${q(loginConfig.federatedToken)}'`;
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    private static loginWithSystemAssignedIdentity(loginConfig: LoginConfig): string {
        let cmdletSuffix = "";
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    static loginWithUserAssignedIdentity(loginConfig: LoginConfig): string {
        let cmdletSuffix = `-AccountId '${q(loginConfig.servicePrincipalId)}'`;
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    private static psLoginCmdlet(authType:string, environment:string, tenantId:string, subscriptionId:string, cmdletSuffix:string){
        let loginCmdlet = `Connect-AzAccount `;
        if(authType === LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL){
            loginCmdlet += "-ServicePrincipal ";
        }else{
            loginCmdlet += "-Identity ";
        }
        loginCmdlet += `-Environment '${q(environment)}' `;
        if(tenantId){
            loginCmdlet += `-Tenant '${q(tenantId)}' `;
        }
        if(subscriptionId){
            loginCmdlet += `-Subscription '${q(subscriptionId)}' `;
        }
        loginCmdlet += `${cmdletSuffix} -InformationAction Ignore | out-null;`;
        return loginCmdlet;
    }
}

