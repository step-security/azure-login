import * as path from 'path';
import { LoginConfig } from '../common/LoginConfig';
import { psEscapeSingleQuoted as q } from '../common/Utils';

export interface AzPSLoginInvocation {
    methodName: string;
    args: string[];
    env: Record<string, string>;
}

export default class AzPSScriptBuilder {

    static readonly ENV_SP_SECRET        = 'AZURE_LOGIN_ACTION__SP_SECRET';
    static readonly ENV_FEDERATED_TOKEN  = 'AZURE_LOGIN_ACTION__FEDERATED_TOKEN';

    static getScriptPath(): string {
        return path.join(__dirname, 'AzPSLogin.ps1');
    }

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

<<<<<<< ours
    static async getAzPSLoginScript(loginConfig: LoginConfig) {
        let loginMethodName = "";
        let commands = "";

        if (loginConfig.environment.toLowerCase() == "azurestack") {
            commands += `Add-AzEnvironment -Name '${q(loginConfig.environment)}' -ARMEndpoint '${q(loginConfig.resourceManagerEndpointUrl)}' | out-null;`;
||||||| base
    // Doubles single quotes for safe interpolation into a PowerShell '...' literal.
    private static escapePSSingleQuoted(value: string): string {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value).split("'").join("''");
    }

    static async getAzPSLoginScript(loginConfig: LoginConfig) {
        let loginMethodName = "";
        let commands = "";

        if (loginConfig.environment.toLowerCase() == "azurestack") {
            commands += `Add-AzEnvironment -Name '${loginConfig.environment}' -ARMEndpoint '${AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.resourceManagerEndpointUrl)}' | out-null;`;
=======
    static async getAzPSLoginInvocation(loginConfig: LoginConfig): Promise<AzPSLoginInvocation> {
        const args: string[] = [
            '-File',        AzPSScriptBuilder.getScriptPath(),
            '-Environment', loginConfig.environment,
            '-AuthType',    loginConfig.authType,
        ];
        const env: Record<string, string> = {};
        let methodName: string;

        if (loginConfig.tenantId) {
            args.push('-Tenant', loginConfig.tenantId);
        }
        if (loginConfig.subscriptionId) {
            args.push('-Subscription', loginConfig.subscriptionId);
        }
        if (loginConfig.environment.toLowerCase() === 'azurestack') {
            args.push('-ArmEndpoint', loginConfig.resourceManagerEndpointUrl);
        }
        if (loginConfig.maxContextPopulation) {
            args.push('-MaxContextPopulation', loginConfig.maxContextPopulation);
>>>>>>> theirs
        }

        if (loginConfig.authType === LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL) {
            args.push('-ApplicationId', loginConfig.servicePrincipalId);
            if (loginConfig.servicePrincipalSecret) {
                env[AzPSScriptBuilder.ENV_SP_SECRET] = loginConfig.servicePrincipalSecret;
                methodName = 'service principal with secret';
            } else {
                await loginConfig.getFederatedToken();
                env[AzPSScriptBuilder.ENV_FEDERATED_TOKEN] = loginConfig.federatedToken;
                methodName = 'OIDC';
            }
        } else {
            if (loginConfig.servicePrincipalId) {
                args.push('-ApplicationId', loginConfig.servicePrincipalId);
                methodName = 'user-assigned managed identity';
            } else {
                methodName = 'system-assigned managed identity';
            }
        }

<<<<<<< ours
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
||||||| base
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
        let servicePrincipalSecret: string = AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.servicePrincipalSecret);
        let servicePrincipalId: string = AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.servicePrincipalId);
        let loginCmdlet = `$psLoginSecrets = ConvertTo-SecureString '${servicePrincipalSecret}' -AsPlainText -Force; `;
        loginCmdlet += `$psLoginCredential = New-Object System.Management.Automation.PSCredential('${servicePrincipalId}', $psLoginSecrets); `;

        let cmdletSuffix = "-Credential $psLoginCredential";
        loginCmdlet += AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);

        return loginCmdlet;
    }

    private static async loginWithOIDC(loginConfig: LoginConfig) {
        await loginConfig.getFederatedToken();
        let servicePrincipalId: string = AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.servicePrincipalId);
        let federatedToken: string = AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.federatedToken);
        let cmdletSuffix = `-ApplicationId '${servicePrincipalId}' -FederatedToken '${federatedToken}'`;
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    private static loginWithSystemAssignedIdentity(loginConfig: LoginConfig): string {
        let cmdletSuffix = "";
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    static loginWithUserAssignedIdentity(loginConfig: LoginConfig): string {
        let servicePrincipalId: string = AzPSScriptBuilder.escapePSSingleQuoted(loginConfig.servicePrincipalId);
        let cmdletSuffix = `-AccountId '${servicePrincipalId}'`;
        return AzPSScriptBuilder.psLoginCmdlet(loginConfig.authType, loginConfig.environment, loginConfig.tenantId, loginConfig.subscriptionId, cmdletSuffix);
    }

    private static psLoginCmdlet(authType:string, environment:string, tenantId:string, subscriptionId:string, cmdletSuffix:string){
        let loginCmdlet = `Connect-AzAccount `;
        if(authType === LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL){
            loginCmdlet += "-ServicePrincipal ";
        }else{
            loginCmdlet += "-Identity ";
        }
        loginCmdlet += `-Environment '${environment}' `;
        if(tenantId){
            loginCmdlet += `-Tenant '${AzPSScriptBuilder.escapePSSingleQuoted(tenantId)}' `;
        }
        if(subscriptionId){
            loginCmdlet += `-Subscription '${AzPSScriptBuilder.escapePSSingleQuoted(subscriptionId)}' `;
        }
        loginCmdlet += `${cmdletSuffix} -InformationAction Ignore | out-null;`;
        return loginCmdlet;
=======
        return { methodName, args, env };
>>>>>>> theirs
    }
}

