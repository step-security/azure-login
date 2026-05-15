import * as core from '@actions/core';
import * as fs from 'fs';
import axios, { isAxiosError } from 'axios';
import { cleanupAzCLIAccounts, cleanupAzPSAccounts, setUserAgent } from './common/Utils';
import { AzPSLogin } from './PowerShell/AzPSLogin';
import { LoginConfig } from './common/LoginConfig';
import { AzureCliLogin } from './Cli/AzureCliLogin';

async function validateSubscription(): Promise<void> {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    let repoPrivate: boolean | undefined;

    if (eventPath && fs.existsSync(eventPath)) {
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        repoPrivate = eventData?.repository?.private;
    }

    const upstream = 'Azure/login';
    const action = process.env.GITHUB_ACTION_REPOSITORY;
    const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

    core.info('');
    core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
    core.info(`Secure drop-in replacement for ${upstream}`);
    if (repoPrivate === false) core.info('\u001b[32m✓ Free for public repositories\u001b[0m');
    core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
    core.info('');

    if (repoPrivate === false) return;

    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const body: Record<string, string> = { action: action || '' };
    if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;

    try {
        await axios.post(
            `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
            body,
            { timeout: 3000 }
        );
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
            core.error('\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m');
            core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
            process.exit(1);
        }
        core.info('Timeout or API not reachable. Continuing to next step.');
    }
}

async function main() {
    try {
        await validateSubscription();
        setUserAgent();
        const preCleanup: string = process.env.AZURE_LOGIN_PRE_CLEANUP;
        if ('true' == preCleanup) {
            await cleanupAzCLIAccounts();
            if (core.getInput('enable-AzPSSession').toLowerCase() === "true") {
                await cleanupAzPSAccounts();
            }
        }

        // prepare the login configuration
        var loginConfig = new LoginConfig();
        await loginConfig.initialize();
        await loginConfig.validate();

        // login to Azure CLI
        var cliLogin = new AzureCliLogin(loginConfig);
        await cliLogin.login();

        //login to Azure PowerShell
        if (loginConfig.enableAzPSSession) {
            var psLogin: AzPSLogin = new AzPSLogin(loginConfig);
            await psLogin.login();
        }
    }
    catch (error) {
        core.setFailed(`Login failed with ${error}. Double check if the 'auth-type' is correct. Refer to https://github.com/Azure/login#readme for more information.`);
        core.debug(error.stack);
    }
}

main();

