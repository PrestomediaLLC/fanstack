import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';

async function run() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (command === 'init') {
		await initCommand();
	} else if (command === 'generate' || command === 'gen') {
		const isWatch = args.includes('--watch');
		await generateCommand({ watch: isWatch });
	} else {
		console.log(`
@prestomedia/fanstack CLI
-------------------------
Usage:
  fan init              Configure fanstack inside your Firebase functions directory
  fan generate [flags]  Generate backend routers and frontend Angular services
  fan gen [flags]       Alias for generate

Flags:
  --watch               Watch for changes in action files and regenerate continuously
		`);
	}
}

run().catch((err) => {
	console.error('💥 Fatal Fanstack Error:', err);
	process.exit(1);
});
