/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { execSync } from 'child_process';
import { spawn } from 'cross-spawn'
// Added lines below
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function doesPathExist(filePath) {
	try {
		const stats = fs.statSync(filePath);

		return stats.isFile();
	} catch (err) {
		if (err.code === 'ENOENT') {
			return false;
		}
		throw err;
	}
}

/*

This function finds `globalDesiredPath` given `localDesiredPath` and `currentPath`

Diagram:

...basePath/
└── void/
	├── ...currentPath/ (defined globally)
	└── ...localDesiredPath/ (defined locally)

*/
function findDesiredPathFromLocalPath(localDesiredPath, currentPath) {

	// walk upwards until currentPath + localDesiredPath exists
	while (!doesPathExist(path.join(currentPath, localDesiredPath))) {
		const parentDir = path.dirname(currentPath);

		if (parentDir === currentPath) {
			return undefined;
		}

		currentPath = parentDir;
	}

	// return the `globallyDesiredPath`
	const globalDesiredPath = path.join(currentPath, localDesiredPath)
	return globalDesiredPath;
}

// hack to refresh styles automatically
function saveStylesFile() {
	setTimeout(() => {
		try {
			const pathToCssFile = findDesiredPathFromLocalPath('./src/vs/workbench/contrib/void/browser/react/src2/styles.css', __dirname);

			if (pathToCssFile === undefined) {
				console.error('[scope-tailwind] Error finding styles.css');
				return;
			}

			// Or re-write with the same content:
			const content = fs.readFileSync(pathToCssFile, 'utf8');
			fs.writeFileSync(pathToCssFile, content, 'utf8');
			console.log('[scope-tailwind] Force-saved styles.css');
		} catch (err) {
			console.error('[scope-tailwind] Error saving styles.css:', err);
		}
	}, 6000);
}

// Run scope-tailwind synchronously and wait for completion
function runScopeTailwindSync() {
	try {
		console.log('🔨 Running scope-tailwind...');
		execSync(
			'npx scope-tailwind ./src -o src2/ -s void-scope -c styles.css -p "void-"',
			{ stdio: 'inherit', cwd: __dirname }
		);
		console.log('✅ scope-tailwind completed');
		return true;
	} catch (err) {
		console.error('❌ scope-tailwind failed:', err);
		return false;
	}
}

// Run tsup synchronously
function runTsupSync() {
	try {
		console.log('🔨 Running tsup...');
		execSync('npx tsup', { stdio: 'inherit', cwd: __dirname });
		console.log('✅ tsup completed');
		return true;
	} catch (err) {
		console.error('❌ tsup failed:', err);
		return false;
	}
}

const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

if (isWatch) {
	// Check if we need an initial build
	const needsBuild = !fs.existsSync('src2') || !fs.existsSync('out')
	
	if (needsBuild) {
		console.log('🔨 Initial build required (src2 or out directory missing)...');
		if (runScopeTailwindSync() && runTsupSync()) {
			console.log('✅ Initial build completed successfully.');
		} else {
			console.error('❌ Initial build failed.');
			process.exit(1);
		}
	} else {
		// Check if CSS is properly compiled (not containing @tailwind directives)
		const cssPath = path.join(__dirname, 'src2', 'styles.css')
		if (fs.existsSync(cssPath)) {
			const cssContent = fs.readFileSync(cssPath, 'utf8')
			if (cssContent.includes('@tailwind base')) {
				console.log('⚠️  CSS not properly compiled, rebuilding...');
				if (runScopeTailwindSync() && runTsupSync()) {
					console.log('✅ Rebuild completed successfully.');
				} else {
					console.error('❌ Rebuild failed.');
					process.exit(1);
				}
			} else {
				console.log('✅ src2 directory exists with compiled CSS.');
			}
		} else {
			console.log('⚠️  styles.css not found in src2, rebuilding...');
			if (runScopeTailwindSync() && runTsupSync()) {
				console.log('✅ Rebuild completed successfully.');
			} else {
				console.error('❌ Rebuild failed.');
				process.exit(1);
			}
		}

		// Check if out directory has the required files
		const requiredModules = [
			'sidebar-tsx/index.js',
			'void-editor-widgets-tsx/index.js',
			'void-settings-tsx/index.js',
			'void-tooltip/index.js',
			'void-onboarding/index.js',
			'quick-edit-tsx/index.js',
			'diff/index.js'
		]
		const missingModules = requiredModules.filter(m => !fs.existsSync(path.join(__dirname, 'out', m)))
		if (missingModules.length > 0) {
			console.log(`⚠️  Missing output files: ${missingModules.join(', ')}`);
			console.log('🔨 Running tsup to generate output files...');
			if (runTsupSync()) {
				console.log('✅ Output files generated successfully.');
			} else {
				console.error('❌ Failed to generate output files.');
				process.exit(1);
			}
		} else {
			console.log('✅ out directory exists with all required files.');
		}
	}

	// Debounce timer to prevent multiple rapid builds
	let debounceTimer = null;
	let isBuilding = false;

	console.log('👀 Starting file watchers...');

	// Watch src directory for changes
	// When changes occur: 1) Run scope-tailwind first (sync), 2) Then run tsup
	// This ensures CSS is fully compiled before tsup bundles it
	const srcWatcher = chokidar.watch('./src', {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 300,
			pollInterval: 100
		}
	});

	// Also watch src2 for changes triggered by scope-tailwind (but ignore CSS during prefixify phase)
	const src2Watcher = chokidar.watch('./src2', {
		ignored: /(^|[\/\\])\../,
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 500, // Wait longer for src2 to ensure CSS compilation is done
			pollInterval: 100
		}
	});

	// Log when watchers are ready
	srcWatcher.on('ready', () => {
		console.log('✅ src watcher ready');
	});

	src2Watcher.on('ready', () => {
		console.log('✅ src2 watcher ready');
	});

	// Handle src changes - run scope-tailwind then tsup
	srcWatcher.on('change', (filePath) => {
		if (isBuilding) return;
		
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		
		debounceTimer = setTimeout(() => {
			isBuilding = true;
			console.log(`📁 Change detected in src: ${filePath}`);
			
			// Run scope-tailwind first (synchronously), then tsup
			if (runScopeTailwindSync()) {
				// Small delay to ensure all files are written
				setTimeout(() => {
					runTsupSync();
					isBuilding = false;
				}, 200);
			} else {
				isBuilding = false;
			}
		}, 500);
	});

	srcWatcher.on('add', (filePath) => {
		if (isBuilding) return;
		
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		
		debounceTimer = setTimeout(() => {
			isBuilding = true;
			console.log(`➕ File added in src: ${filePath}`);
			
			if (runScopeTailwindSync()) {
				setTimeout(() => {
					runTsupSync();
					isBuilding = false;
				}, 200);
			} else {
				isBuilding = false;
			}
		}, 500);
	});

	// Handle src2 changes - only run tsup (scope-tailwind already processed src)
	// But skip if we're currently building from src changes
	src2Watcher.on('change', (filePath) => {
		if (isBuilding) return;
		
		// If CSS file changed and doesn't contain @tailwind, it's ready for tsup
		if (filePath.endsWith('styles.css')) {
			const cssContent = fs.readFileSync(filePath, 'utf8');
			if (cssContent.includes('@tailwind base')) {
				console.log('⏳ CSS not yet compiled, waiting...');
				return;
			}
		}
		
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		
		debounceTimer = setTimeout(() => {
			console.log(`📁 Change detected in src2: ${filePath}`);
			runTsupSync();
		}, 300);
	});

	console.log('🔄 Watchers started! Watching src/ and src2/ directories.');
	console.log('   Press Ctrl+C to stop.');

	// Handle process termination
	process.on('SIGINT', () => {
		srcWatcher.close();
		src2Watcher.close();
		process.exit();
	});

} else {
	// Build mode
	console.log('📦 Building...');

	// Run scope-tailwind (includes CSS compilation via scopify function)
	if (runScopeTailwindSync()) {
		// Run tsup once
		runTsupSync();
		console.log('✅ Build complete!');
	} else {
		console.error('❌ Build failed!');
		process.exit(1);
	}
}
