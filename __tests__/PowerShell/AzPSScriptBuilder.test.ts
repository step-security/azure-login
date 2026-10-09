import AzPSScriptBuilder from "../../src/PowerShell/AzPSScriptBuilder";
import { LoginConfig } from "../../src/common/LoginConfig";

describe("Building the Az PS login invocation", () => {

    function setEnv(name: string, value: string) {
        process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
    }

    function cleanEnv() {
        for (const envKey in process.env) {
            if (envKey.startsWith('INPUT_')) {
                delete process.env[envKey];
            }
        }
    }

    beforeEach(() => {
        cleanEnv();
    });

    test('getImportLatestModuleScript still emits the interpolated module-import script', () => {
        expect(AzPSScriptBuilder.getImportLatestModuleScript("TestModule")).toContain("(Get-Module -Name 'TestModule' -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1).Path");
        expect(AzPSScriptBuilder.getImportLatestModuleScript("TestModule")).toContain("Import-Module -Name $latestModulePath");
    });

    test('getScriptPath resolves to AzPSLogin.ps1 next to the compiled module', () => {
        expect(AzPSScriptBuilder.getScriptPath()).toMatch(/AzPSLogin\.ps1$/);
    });

    test('SP + secret: values ride as pwsh params; secret rides via env var', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ methodName, args, env }) => {
            expect(methodName).toBe('service principal with secret');
            expect(args[0]).toBe('-File');
            expect(args[1]).toMatch(/AzPSLogin\.ps1$/);
            expect(args).toEqual(expect.arrayContaining([
                '-Environment', 'azurecloud',
                '-AuthType', 'SERVICE_PRINCIPAL',
                '-Tenant', 'tenant-id',
                '-Subscription', 'subscription-id',
                '-ApplicationId', 'client-id',
            ]));
            expect(env[AzPSScriptBuilder.ENV_SP_SECRET]).toBe('client-secret');
            expect(env[AzPSScriptBuilder.ENV_FEDERATED_TOKEN]).toBeUndefined();
        });
    });

    test('SP + OIDC: federated token rides via env var; no client secret', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('tenant-id', 'tenant-id');
        setEnv('subscription-id', 'subscription-id');
        setEnv('client-id', 'client-id');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        jest.spyOn(loginConfig, 'getFederatedToken').mockImplementation(async () => { loginConfig.federatedToken = "fake-token"; });

        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ methodName, args, env }) => {
            expect(methodName).toBe('OIDC');
            expect(args).toEqual(expect.arrayContaining([
                '-Tenant', 'tenant-id',
                '-Subscription', 'subscription-id',
                '-ApplicationId', 'client-id',
            ]));
            expect(env[AzPSScriptBuilder.ENV_FEDERATED_TOKEN]).toBe('fake-token');
            expect(env[AzPSScriptBuilder.ENV_SP_SECRET]).toBeUndefined();
        });
    });

    test('system-assigned MI: no ApplicationId param, no env vars', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('subscription-id', 'subscription-id');
        setEnv('auth-type', 'IDENTITY');

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ methodName, args, env }) => {
            expect(methodName).toBe('system-assigned managed identity');
            expect(args).toEqual(expect.arrayContaining([
                '-AuthType', 'IDENTITY',
                '-Subscription', 'subscription-id',
            ]));
            expect(args).not.toContain('-ApplicationId');
            expect(Object.keys(env)).toHaveLength(0);
        });
    });

    test('system-assigned MI without subscription id: subscription param omitted', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('auth-type', 'IDENTITY');

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ methodName, args }) => {
            expect(methodName).toBe('system-assigned managed identity');
            expect(args).not.toContain('-Subscription');
        });
    });

    test('user-assigned MI: ApplicationId param present, no env vars', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'IDENTITY');
        setEnv('client-id', 'client-id');

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ methodName, args, env }) => {
            expect(methodName).toBe('user-assigned managed identity');
            expect(args).toEqual(expect.arrayContaining([
                '-AuthType', 'IDENTITY',
                '-ApplicationId', 'client-id',
            ]));
            expect(Object.keys(env)).toHaveLength(0);
        });
    });

<<<<<<< ours
});
||||||| base
    const INJECT_RAW      = "abc' ; Start-Process calc ; $x='";
    const INJECT_ESCAPED  = "abc'' ; Start-Process calc ; $x=''";

    test('SECURITY: tenant-id single quote is escaped (SP+secret path)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        let creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': INJECT_RAW,
            'subscriptionId': 'subscription-id'
        }
        setEnv('creds', JSON.stringify(creds));

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-Tenant '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-Tenant '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: subscription-id single quote is escaped (SP+secret path)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        let creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': INJECT_RAW
        }
        setEnv('creds', JSON.stringify(creds));

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-Subscription '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-Subscription '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: client-id single quote is escaped (SP+secret path, PSCredential)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        let creds = {
            'clientId': INJECT_RAW,
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id'
        }
        setEnv('creds', JSON.stringify(creds));

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`New-Object System.Management.Automation.PSCredential('${INJECT_ESCAPED}',`);
            expect(loginScript).not.toContain(`New-Object System.Management.Automation.PSCredential('${INJECT_RAW}',`);
        });
    });

    test('SECURITY: client-id single quote is escaped (OIDC path)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('tenant-id', 'tenant-id');
        setEnv('subscription-id', 'subscription-id');
        setEnv('client-id', INJECT_RAW);
        setEnv('auth-type', 'SERVICE_PRINCIPAL');

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        jest.spyOn(loginConfig, 'getFederatedToken').mockImplementation(async () => { loginConfig.federatedToken = "fake-token"; });
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-ApplicationId '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-ApplicationId '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: client-id single quote is escaped (user-assigned MI path)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'IDENTITY');
        setEnv('client-id', INJECT_RAW);

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-AccountId '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-AccountId '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: tenant-id and subscription-id single quotes are escaped (system-assigned MI path)', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('tenant-id', INJECT_RAW);
        setEnv('subscription-id', INJECT_RAW);
        setEnv('auth-type', 'IDENTITY');

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-Tenant '${INJECT_ESCAPED}'`);
            expect(loginScript).toContain(`-Subscription '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-Tenant '${INJECT_RAW}'`);
            expect(loginScript).not.toContain(`-Subscription '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: resourceManagerEndpointUrl single quote is escaped (AzureStack path)', () => {
        setEnv('environment', 'azurestack');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        let creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id',
            'resourceManagerEndpointUrl': INJECT_RAW
        }
        setEnv('creds', JSON.stringify(creds));

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([_, loginScript]) => {
            expect(loginScript).toContain(`-ARMEndpoint '${INJECT_ESCAPED}'`);
            expect(loginScript).not.toContain(`-ARMEndpoint '${INJECT_RAW}'`);
        });
    });

    test('SECURITY: escapePSSingleQuoted handles null/undefined without throwing', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('auth-type', 'IDENTITY');

        let loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSSCriptBuilder.getAzPSLoginScript(loginConfig).then(([loginMethod, loginScript]) => {
            expect(loginScript).toContain("Connect-AzAccount -Identity -Environment 'azurecloud'");
            expect(loginMethod).toBe('system-assigned managed identity');
        });
    });

});
=======
    test('AzureStack: ArmEndpoint passed as param', () => {
        setEnv('environment', 'azurestack');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id',
            'resourceManagerEndpointUrl': 'https://management.azurestack.local/'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args }) => {
            expect(args).toEqual(expect.arrayContaining([
                '-ArmEndpoint', 'https://management.azurestack.local/',
            ]));
        });
    });

    test('max-context-population set: value passed as -MaxContextPopulation param', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        setEnv('max-context-population', '-1');
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args }) => {
            expect(args).toEqual(expect.arrayContaining([
                '-MaxContextPopulation', '-1',
            ]));
        });
    });

    test('max-context-population unset: -MaxContextPopulation param omitted', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args }) => {
            expect(args).not.toContain('-MaxContextPopulation');
        });
    });

    test('SECURITY: adversarial ArmEndpoint travels as a discrete argv element', () => {
        setEnv('environment', 'azurestack');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const nasty = "https://mgmt.local/' ; Start-Process calc ; $x='";
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id',
            'resourceManagerEndpointUrl': nasty
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args }) => {
            const armIndex = args.indexOf('-ArmEndpoint');
            expect(armIndex).toBeGreaterThan(-1);
            expect(args[armIndex + 1]).toBe(nasty);
            const otherArgs = args.filter((_, i) => i !== armIndex + 1);
            expect(otherArgs.some(a => a.includes(nasty))).toBe(false);
        });
    });

    // Structural safety: no matter how nasty a value is, it can never be re-parsed
    // as PowerShell code because it's a distinct argv element / env var, not a
    // substring inside a script literal.
    const NASTY_VALUES = [
        "abc' ; Start-Process calc ; $x='",
        'abc"; whoami ; #',
        "abc\nStart-Process calc",
    ];

    test.each(NASTY_VALUES)('SECURITY: adversarial tenant value %j travels as a discrete argv element', (nasty) => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const creds = {
            'clientId': 'client-id',
            'clientSecret': 'client-secret',
            'tenantId': nasty,
            'subscriptionId': 'subscription-id'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args }) => {
            const tenantIndex = args.indexOf('-Tenant');
            expect(tenantIndex).toBeGreaterThan(-1);
            expect(args[tenantIndex + 1]).toBe(nasty);
            const otherArgs = args.filter((_, i) => i !== tenantIndex + 1);
            expect(otherArgs.some(a => a.includes(nasty))).toBe(false);
        });
    });

    test('SECURITY: adversarial client-secret rides in env var only, never in argv', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'true');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const nasty = "abc' ; Start-Process calc ; $x='";
        const creds = {
            'clientId': 'client-id',
            'clientSecret': nasty,
            'tenantId': 'tenant-id',
            'subscriptionId': 'subscription-id'
        };
        setEnv('creds', JSON.stringify(creds));

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args, env }) => {
            expect(env[AzPSScriptBuilder.ENV_SP_SECRET]).toBe(nasty);
            expect(args.some(a => a.includes(nasty))).toBe(false);
        });
    });

    test('SECURITY: federated token rides in env var only, never in argv', () => {
        setEnv('environment', 'azurecloud');
        setEnv('enable-AzPSSession', 'true');
        setEnv('allow-no-subscriptions', 'false');
        setEnv('tenant-id', 'tenant-id');
        setEnv('subscription-id', 'subscription-id');
        setEnv('client-id', 'client-id');
        setEnv('auth-type', 'SERVICE_PRINCIPAL');
        const nasty = "abc' ; Start-Process calc ; $x='";

        const loginConfig = new LoginConfig();
        loginConfig.initialize();
        jest.spyOn(loginConfig, 'getFederatedToken').mockImplementation(async () => { loginConfig.federatedToken = nasty; });

        return AzPSScriptBuilder.getAzPSLoginInvocation(loginConfig).then(({ args, env }) => {
            expect(env[AzPSScriptBuilder.ENV_FEDERATED_TOKEN]).toBe(nasty);
            expect(args.some(a => a.includes(nasty))).toBe(false);
        });
    });

});
>>>>>>> theirs
