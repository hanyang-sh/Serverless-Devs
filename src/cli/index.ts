import program, { Command } from 'commander';
import { CommandError } from '../error';
import CliManager from './cli-manager';

const description = `Directly use serverless devs to use components, develop and manage applications without yaml configuration.

    Example:
        $ s cli fc-api listServices
        $ s cli fc-api listFunctions --service-name my-service
        $ s cli fc-api deploy -p "{/"function/": /"function-name/"}"
    `;


const cliCommand = program
    .name('s cli')
    .usage('s cli [component] [method] [options]')
    .option('-a, --aliasName [name]', 'Specify the key name')
    .option('-p, --props [json-string]', 'The json string of props')
    .helpOption('-h, --help', 'Display help for command')
    .description(description).addHelpCommand(false);

const subCommandName = process.argv[2];
if (subCommandName && !['-h', '--help'].includes(subCommandName)) {
    const execCommand = new Command(subCommandName);
    const customerCommandDescription = "Subcommand execution analysis.";
    execCommand.usage("[subcommand] -- [method] [params]");
    execCommand.description(customerCommandDescription).addHelpCommand(true)
    program.addCommand(execCommand);
}

(async () => {
    if ((process.argv.length == 2) || (process.argv.length == 3 && ['-h', '--help'].includes(process.argv[2]))) {
        program.help();
    } else {
        const tempCommand = process.argv[3]
        let start = false;
        const processArgv: string[] = [];
        let params: string[] = [];
        let lastArgs = undefined;
        for (let i = 0; i < process.argv.length; i++) {
            if (!start || (['-a', '--aliasName', '-p', '--props'].includes(lastArgs) || ['-a', '--aliasName', '-p', '--props'].includes(process.argv[i]))) {
                processArgv.push(process.argv[i]);
            } else {
                params.push(process.argv[i]);
            }
            if (process.argv[i] === tempCommand) {
                start = true;
                if (['-h', '--help'].includes(tempCommand)) {
                    processArgv.pop()
                    processArgv.push("cli-help-options")
                }
            }
            lastArgs = process.argv[i]
        }
        if (params.length !== 0) {
            process.env.temp_params = params.join(' ');
        }

        process.argv = processArgv;
        cliCommand.parse(process.argv)
        const [component, command] = program.args;
        const { aliasName, props } = program as any;
        const cliManager = new CliManager({ command, component, aliasName, props });
        cliManager.init();

    }
})().catch(err => {
    throw new CommandError(err.message);
});
