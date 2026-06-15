import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

export async function initCommand() {
	const cwd = process.cwd();

	// 1. Confirm we are sitting in the root of a Firebase functions folder
	const hasPackage = fs.existsSync(path.join(cwd, 'package.json'));
	const hasFirebaseInCurrent = fs.existsSync(path.join(cwd, 'firebase.json'));
	const hasFirebaseInParent = fs.existsSync(path.join(cwd, '../firebase.json'));

	// Trap 1: They ran it in the top-level Firebase workspace
	if (hasFirebaseInCurrent) {
		console.error(
			'❌ Error: It looks like you are in the Firebase root directory. Please run `cd functions` first.',
		);
		process.exit(1);
	}

	// Trap 2: They are somewhere else entirely
	if (!hasPackage || !hasFirebaseInParent) {
		console.error(
			'❌ Error: `fan init` must be run specifically inside your Firebase "functions" directory.',
		);
		process.exit(1);
	}

	// 2. Check for pre-existing configurations
	const tsConfigPath = path.join(cwd, 'tsconfig.json');
	if (!fs.existsSync(tsConfigPath)) {
		console.error(
			'❌ Error: FAN Stack requires a TypeScript-configured Firebase Functions environment. No tsconfig.json found. Please run `firebase init functions` and select TypeScript.',
		);
		process.exit(1);
	}

	// 3. Check for pre-existing configurations
	const configPath = path.join(cwd, 'fan.config.json');
	const fanFolder = path.join(cwd, 'src/fan'); // <-- Updated to check inside src/

	if (fs.existsSync(configPath) || fs.existsSync(fanFolder)) {
		console.error(
			'⚠️ Fanstack looks like it is already initialized or a "/fan" directory already exists here.',
		);
		process.exit(1);
	}

	// 3. Auto-detect Angular project path by parsing angular.json
	let defaultAngularPath = '../src/app/core/services'; // Safe fallback
	const angularJsonPath = path.join(cwd, '../angular.json');

	if (fs.existsSync(angularJsonPath)) {
		try {
			const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

			// Get the default project, or fallback to the first project in the config
			const projectName = angularJson.defaultProject || Object.keys(angularJson.projects || {})[0];

			if (projectName && angularJson.projects[projectName]) {
				const projectConfig = angularJson.projects[projectName];
				// sourceRoot is usually 'src' or 'projects/app-name/src'
				const sourceRoot = projectConfig.sourceRoot || `${projectConfig.root}/src`;

				// Construct the dynamic path!
				defaultAngularPath = `../${sourceRoot}/app/core/services`.replace(/\/+/g, '/');
			}
		} catch (e) {
			// If angular.json is malformed, just silently swallow the error and use the fallback
		}
	}

	// 4. Prompt user for relative Angular destination folder
	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'angularPath',
			message:
				'Enter the relative path to your Angular project directory where generation artifacts should go. You can change this later in the fan.config.json file:',
			default: defaultAngularPath,
			validate: (input: string) => (input.trim().length > 0 ? true : 'Path cannot be empty.'),
		},
	]);

	const targetAngularPath = answers.angularPath.trim();

	// 5. Write Configuration
	const configData = {
		angularServicePath: targetAngularPath,
	};
	fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
	console.log('✅ Created fan.config.json');

	// 6. Scaffolding folders & writing templates
	// Calculate the library root path dynamically from the dist folder position
	const __filename = fileURLToPath(import.meta.url);
	const templateSourceDir = path.resolve(path.dirname(__filename), '../../templates');

	const directoriesToScaffold = [
		'src/fan',
		'src/fan/middleware',
		'src/fan/interfaces',
		'src/fan/actions',
		'src/fan/actions/example',
		'src/fan/templates',
	];

	for (const dir of directoriesToScaffold) {
		fs.mkdirSync(path.join(cwd, dir), { recursive: true });
	}

	// Copy operations from internal template records
	writeTemplate(
		path.join(templateSourceDir, 'action-context.ts'),
		path.join(cwd, 'src/fan/action-context.ts'),
	);
	writeTemplate(path.join(templateSourceDir, 'fanstack.ts'), path.join(cwd, 'src/fan/fanstack.ts'));
	writeTemplate(
		path.join(templateSourceDir, 'middleware/index.ts'),
		path.join(cwd, 'src/fan/middleware/index.ts'),
	);
	writeTemplate(
		path.join(templateSourceDir, 'middleware/require-auth.ts'),
		path.join(cwd, 'src/fan/middleware/require-auth.ts'),
	);
	writeTemplate(
		path.join(templateSourceDir, 'middleware/connect-to-database.ts'),
		path.join(cwd, 'src/fan/middleware/connect-to-database.ts'),
	);
	writeTemplate(
		path.join(templateSourceDir, 'middleware/read-environment.ts'),
		path.join(cwd, 'src/fan/middleware/read-environment.ts'),
	);
	writeTemplate(
		path.join(templateSourceDir, 'middleware/read-user-profile.ts'),
		path.join(cwd, 'src/fan/middleware/read-user-profile.ts'),
	);

	// Create sample implementation interfaces and actions
	fs.writeFileSync(
		path.join(cwd, 'src/fan/interfaces/say-hello.ts'),
		`export interface SayHelloPayload {\n  name: string;\n}\n\nexport interface SayHelloResponse {\n  greeting: string;\n}`,
		'utf8',
	);
	fs.writeFileSync(
		path.join(cwd, 'src/fan/fan-actions.gen.ts'),
		`import { ActionContext } from './action-context';\n\nexport const runAction = async (actionName: string, payload: any, context: ActionContext): Promise<any> => {\n  throw new Error('Router not generated. Run \`fan generate\` first.');\n};`,
		'utf8',
	);
	fs.writeFileSync(
		path.join(cwd, 'src/fan/actions/example/say-hello.action.ts'),
		`import { ActionContext } from '../../action-context';\nimport { SayHelloPayload, SayHelloResponse } from '../../interfaces/say-hello';\n\nexport const action = async (payload: SayHelloPayload, ctx: ActionContext): Promise<SayHelloResponse> => {\n  return {\n    greeting: \`Hello, \${payload.name}! Generated via Fanstack.\`\n  };\n};`,
		'utf8',
	);

	// Write out the base helper template to be compiled into the frontend bundle
	writeTemplate(
		path.join(templateSourceDir, 'func-service-base.ts'),
		path.join(cwd, 'src/fan/templates/func-service-base.ts'),
	);

	// Write integration example to functions root next to their main index file
	writeTemplate(
		path.join(templateSourceDir, 'index-example.ts'),
		path.join(cwd, 'src/fan-index-example.ts'),
	);

	// 7. Update tsconfig.json to exclude frontend templates
	try {
		const tsConfigRaw = fs.readFileSync(tsConfigPath, 'utf8');
		const tsConfig = JSON.parse(tsConfigRaw);

		// Ensure the exclude array exists
		if (!tsConfig.exclude) {
			tsConfig.exclude = [];
		}

		// Inject the exclusion if it isn't already there
		const templatePath = 'src/fan/templates/**';
		if (!tsConfig.exclude.includes(templatePath)) {
			tsConfig.exclude.push(templatePath);
			fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf8');
			console.log('✅ Updated tsconfig.json to exclude Angular templates.');
		}
	} catch (err) {
		// Fallback for when tsconfig.json contains comments or is malformed
		console.warn('\n⚠️  Notice: Could not automatically update tsconfig.json.');
		console.warn(
			'Please manually add "src/fan/templates/**" to the "exclude" array in your functions/tsconfig.json to prevent backend build errors.\n',
		);
	}

	console.log('🎉 Fanstack structure successfully initialized!');
}

function writeTemplate(src: string, dest: string) {
	if (fs.existsSync(src)) {
		fs.copyFileSync(src, dest);
	} else {
		fs.writeFileSync(dest, '// Fanstack Auto-generated Placeholder File\n', 'utf8');
	}
}
