import fs from 'fs';
import path from 'path';

const filePath = path.resolve('bin/fan-stack.js');
if (fs.existsSync(filePath)) {
	// 0o755 gives read/write/execute to owner, read/execute to group and others
	fs.chmodSync(filePath, 0o755);
	console.log('✏️  Successfully marked bin/fan-stack.js as executable.');
} else {
	console.error('❌ Could not find bin/fan-stack.js to modify permissions.');
}
