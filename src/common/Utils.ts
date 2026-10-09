import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as crypto from 'crypto';
import { AzPSConstants, AzPSUtils } from '../PowerShell/AzPSUtils';

/**
 * Escapes a value for safe interpolation inside a PowerShell single-quoted
 * string. PowerShell single-quoted strings treat every char literally except
 * `'` itself, which must be doubled to be included.
 */
export function psEscapeSingleQuoted(value: string): string {
    return String(value ?? '').replace(/'/g, "''");
}

export function setUserAgent(): void {
    let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
    let actionName = 'AzureLogin';
<<<<<<< 6f46613db7f1f0858ca1a70d54678e31eaa298d9
    process.env.AZURE_HTTP_USER_AGENT = (!!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT} ` : '') + `GITHUBACTIONS/${actionName}@v2_${usrAgentRepo}_${process.env.RUNNER_ENVIRONMENT}_${process.env.GITHUB_RUN_ID}`;
    process.env.AZUREPS_HOST_ENVIRONMENT = (!!process.env.AZUREPS_HOST_ENVIRONMENT ? `${process.env.AZUREPS_HOST_ENVIRONMENT} ` : '') + `GITHUBACTIONS/${actionName}@v2_${usrAgentRepo}_${process.env.RUNNER_ENVIRONMENT}_${process.env.GITHUB_RUN_ID}`;
=======
    let actionRef = process.env.GITHUB_ACTION_REF || 'unknown';
    process.env.AZURE_HTTP_USER_AGENT = (!!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT} ` : '') + `GITHUBACTIONS/${actionName}@${actionRef}_${usrAgentRepo}_${process.env.RUNNER_ENVIRONMENT}_${process.env.GITHUB_RUN_ID}`;
    process.env.AZUREPS_HOST_ENVIRONMENT = (!!process.env.AZUREPS_HOST_ENVIRONMENT ? `${process.env.AZUREPS_HOST_ENVIRONMENT} ` : '') + `GITHUBACTIONS/${actionName}@${actionRef}_${usrAgentRepo}_${process.env.RUNNER_ENVIRONMENT}_${process.env.GITHUB_RUN_ID}`;
>>>>>>> a7d70f4fc3e18369ddd4e955e032ae3637ebc0cd
}

export async function cleanupAzCLIAccounts(): Promise<void> {
    let azPath = await io.which("az", true);
    core.debug(`Azure CLI path: ${azPath}`);
    core.info("Clearing azure cli accounts from the local cache.");
    await exec.exec(`"${azPath}"`, ["account", "clear"]);  
}

export async function cleanupAzPSAccounts(): Promise<void> {
    let psPath: string = await io.which(AzPSConstants.PowerShell_CmdName, true);
    core.debug(`PowerShell path: ${psPath}`);
    core.debug("Importing Azure PowerShell module.");
    AzPSUtils.setPSModulePathForGitHubRunner();
    await AzPSUtils.importLatestAzAccounts();
    core.info("Clearing azure powershell accounts from the local cache.");
    await exec.exec(`"${psPath}"`, ["-Command", "Clear-AzContext", "-Scope", "Process"]);
    await exec.exec(`"${psPath}"`, ["-Command", "Clear-AzContext", "-Scope", "CurrentUser", "-Force", "-ErrorAction", "SilentlyContinue"]);
}
