import { Command } from 'commander';
import { ConfigLoader } from '../../config/loader';

export function createInitCommand(): Command {
  const command = new Command('init')
    .description('Initialize testgen configuration file')
    .action(async () => {
      try {
        const configLoader = new ConfigLoader();
        await configLoader.initConfig();
        console.log('Configuration file created successfully!');
        console.log(
          'You can now customize it according to your project needs.'
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'Configuration file already exists'
        ) {
          console.error('Error: Configuration file already exists');
          process.exit(1);
        }
        console.error(
          'Error creating configuration file:',
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });

  return command;
}
