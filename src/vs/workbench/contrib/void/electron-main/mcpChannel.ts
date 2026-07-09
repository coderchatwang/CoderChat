/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// registered in app.ts
// can't make a service responsible for this, because it needs
// to be connected to the main process and node dependencies

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { MCPConfigFileJSON, MCPConfigFileEntryJSON, MCPServer, RawMCPToolCall, MCPToolErrorResponse, MCPServerEventResponse, MCPToolCallParams, removeMCPToolNamePrefix } from '../common/mcpServiceTypes.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPUserStateOfName } from '../common/voidSettingsTypes.js';
import { spawn } from 'child_process';
import * as path from '../../../../base/common/path.js';
import { basename } from '../../../../base/common/path.js';
import { isWindows, isMacintosh, isLinux, OS, IProcessEnvironment } from '../../../../base/common/platform.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { getSystemShell } from '../../../../base/node/shell.js';

const getClientConfig = (serverName: string) => {
	return {
		name: `${serverName}-client`,
		version: '0.1.0',
		// debug: true,
	}
}

type MCPServerNonError = MCPServer & { status: Omit<MCPServer['status'], 'error'> }
type MCPServerError = MCPServer & { status: 'error' }



type ClientInfo = {
	_client: Client, // _client is the client that connects with an mcp client. We're calling mcp clients "server" everywhere except here for naming consistency.
	mcpServerEntryJSON: MCPConfigFileEntryJSON,
	mcpServer: MCPServerNonError,
} | {
	_client?: undefined,
	mcpServerEntryJSON: MCPConfigFileEntryJSON,
	mcpServer: MCPServerError,
}

type InfoOfClientId = {
	[clientId: string]: ClientInfo
}

/**
 * Get the full environment including shell environment variables.
 * This always resolves the shell environment regardless of how the app was launched.
 * On Windows, this uses PowerShell to get user environment variables.
 * On macOS/Linux, it spawns a login shell to get the environment.
 */
/**
 * Error information for shell environment resolution
 */
interface ShellEnvError {
	platform: 'windows' | 'macos' | 'linux'
	error: string
	suggestion: string
	missingEnvVars?: string[]
}

/**
 * Result of shell environment resolution
 */
interface ShellEnvResult {
	env: Record<string, string>
	error?: ShellEnvError
}

async function getFullShellEnv(): Promise<ShellEnvResult> {
	const env: Record<string, string> = { ...process.env } as Record<string, string>

	// On Windows, get user environment variables via PowerShell
	if (isWindows) {
		try {
			const { execSync } = await import('child_process')
			const result = execSync('powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariables(\'User\') | ConvertTo-Json -Compress"', {
				encoding: 'utf-8',
				timeout: 10000
			})

			const userEnv = JSON.parse(result)
			if (userEnv && typeof userEnv === 'object') {
				// Merge user environment, with special handling for PATH
				for (const [key, value] of Object.entries(userEnv)) {
					if (typeof value === 'string') {
						if (key.toUpperCase() === 'PATH') {
							// Append user PATH to existing PATH
							env[key] = env[key] ? `${env[key]}${path.delimiter}${value}` : value
						} else {
							env[key] = value
						}
					}
				}
			}
			console.log('[MCP] Successfully merged Windows user environment variables')
			return { env }
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : String(e)
			console.warn('[MCP] Failed to get Windows user environment:', errorMsg)
				return {
					env,
					error: {
						platform: 'windows',
						error: errorMsg,
						suggestion: 'Please check if PowerShell is available, or try configuring the required environment variables in system environment variables.\n' +
							'You can check by:\n' +
							'1. Open "System Properties" -> "Advanced" -> "Environment Variables"\n' +
							'2. Ensure the PATH variable includes the required tool paths\n' +
							'3. Restart CoderChat for the environment variables to take effect'
					}
				}
		}
	}
	// On macOS and Linux, always spawn a login shell to get the full environment
	// This ensures consistent behavior in both development and production environments
	else if (isMacintosh || isLinux) {
		try {
			const shellEnvResult = await doResolveUnixShellEnv()
			const shellEnv = shellEnvResult.env
			if (shellEnv && typeof shellEnv === 'object') {
				// Merge shell environment, with special handling for PATH
				for (const [key, value] of Object.entries(shellEnv)) {
					if (typeof value === 'string') {
						if (key.toUpperCase() === 'PATH') {
							// Use shell PATH as it's more complete
							env[key] = value
						} else if (env[key] === undefined) {
							// Only add if not already set
							env[key] = value
						}
					}
				}
			}
			console.log('[MCP] Successfully resolved Unix shell environment')
			// If there was a partial error during shell env resolution, include it
			return { env, error: shellEnvResult.error }
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : String(e)
			console.warn('[MCP] Failed to resolve Unix shell environment:', errorMsg)
			return {
				env,
				error: {
					platform: isMacintosh ? 'macos' : 'linux',
					error: errorMsg,
					suggestion: 'Unable to get Shell environment variables. This may be because:\n' +
						'1. Shell configuration files (e.g., ~/.bashrc, ~/.zshrc) have errors\n' +
						'2. Shell startup timeout (time-consuming operations in configuration files)\n' +
						'3. Permission issues\n\n' +
						'Suggestions:\n' +
						'- Run "echo $PATH" in terminal to check if PATH is correct\n' +
						'- Check Shell configuration files for syntax errors\n' +
						'- Try launching CoderChat from terminal'
				}
			}
		}
	}

	return { env }
}

/**
 * Resolve Unix shell environment by spawning a login shell.
 * This is similar to VSCode's implementation in shellEnv.ts
 */
/**
 * Check if a command exists in PATH
 */
function findCommandInPath(command: string, env: Record<string, string>): { found: boolean; paths: string[]; triedPaths: string[] } {
	const pathValue = env['PATH'] || env['Path'] || ''
	const pathSeparator = isWindows ? ';' : ':'
	const paths = pathValue.split(pathSeparator).filter(p => p.trim())
	const triedPaths: string[] = []

	// On Windows, try with .exe, .cmd, .bat extensions
	const extensions = isWindows ? ['', '.exe', '.cmd', '.bat'] : ['']

	for (const dir of paths) {
		for (const ext of extensions) {
			const fullPath = path.join(dir, command + ext)
			triedPaths.push(fullPath)
		}
	}

	return {
		found: false, // We can't actually check file existence here without fs
		paths,
		triedPaths
	}
}

/**
 * Create a helpful error message for command not found
 */
function createCommandNotFoundError(command: string, env: Record<string, string>): string {
	const pathValue = env['PATH'] || env['Path'] || ''
	const pathSeparator = isWindows ? ';' : ':'
	const paths = pathValue.split(pathSeparator).filter(p => p.trim())

	let message = `Command "${command}" not found in PATH.\n\n`
	message += `Current PATH environment variable contains the following directories:\n`
	paths.forEach((p, i) => {
		message += `  ${i + 1}. ${p}\n`
	})
	message += `\nSuggestions:\n`
	message += `1. Confirm that ${command} is correctly installed\n`
	message += `2. Add the directory containing ${command} to the PATH environment variable\n`
	if (isMacintosh || isLinux) {
		message += `3. Run "which ${command}" in terminal to check its location\n`
		message += `4. Check if PATH is correctly set in ~/.bashrc, ~/.zshrc or other Shell configuration files\n`
	} else if (isWindows) {
		message += `3. Run "where ${command}" in CMD/PowerShell to check its location\n`
		message += `4. Add to PATH via "System Properties" -> "Environment Variables"\n`
	}

	return message
}

async function doResolveUnixShellEnv(): Promise<ShellEnvResult> {
	const runAsNode = process.env['ELECTRON_RUN_AS_NODE']
	const noAttach = process.env['ELECTRON_NO_ATTACH_CONSOLE']

	const mark = generateUuid().replace(/-/g, '').substring(0, 12)
	const regex = new RegExp(mark + '({.*})' + mark)

	const env: IProcessEnvironment = {
		...process.env,
		ELECTRON_RUN_AS_NODE: '1',
		ELECTRON_NO_ATTACH_CONSOLE: '1',
		VSCODE_RESOLVING_ENVIRONMENT: '1'
	}

	const systemShell = await getSystemShell(OS, env)

	return new Promise((resolve) => {
		// Handle popular non-POSIX shells
		const name = basename(systemShell)
		let command: string
		let shellArgs: string[]

		if (/^(?:pwsh|powershell)(?:-preview)?$/.test(name)) {
			// PowerShell
			command = `& '${process.execPath}' -p '''${mark}'' + JSON.stringify(process.env) + ''${mark}'''`
			shellArgs = ['-Login', '-Command']
		} else if (name === 'nu') {
			// Nushell
			command = `^'${process.execPath}' -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`
			shellArgs = ['-i', '-l', '-c']
		} else if (name === 'xonsh') {
			// Xonsh
			command = `import os, json; print("${mark}", json.dumps(dict(os.environ)), "${mark}")`
			shellArgs = ['-i', '-l', '-c']
		} else {
			// Default POSIX shells (bash, zsh, sh, etc.)
			command = `'${process.execPath}' -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`
			if (name === 'tcsh' || name === 'csh') {
				shellArgs = ['-ic']
			} else {
				shellArgs = ['-i', '-l', '-c']
			}
		}

		console.log(`[MCP] Resolving shell environment using: ${systemShell}`)

		const child = spawn(systemShell, [...shellArgs, command], {
			detached: true,
			stdio: ['ignore', 'pipe', 'pipe'],
			env
		})

		// Set a timeout
		const timeout = setTimeout(() => {
			child.kill()
			resolve({
				env: {},
				error: {
					platform: isMacintosh ? 'macos' : 'linux',
					error: 'Shell environment resolution timeout (10 seconds)',
					suggestion: 'Shell startup timeout, possible causes:\n' +
						'1. Time-consuming operations in Shell configuration files (~/.bashrc, ~/.zshrc, etc.)\n' +
						'2. Interactive commands in Shell configuration files (e.g., prompting for input)\n' +
						'3. Infinite loops in Shell initialization scripts\n\n' +
						'Suggestions:\n' +
						'- Check and optimize Shell configuration files\n' +
						'- Run "time $SHELL -i -c exit" in terminal to test Shell startup time\n' +
						'- Temporarily rename configuration files (e.g., ~/.bashrc -> ~/.bashrc.bak) to test if it\'s a configuration issue'
				}
			})
		}, 10000)

		child.on('error', err => {
			clearTimeout(timeout)
			resolve({
				env: {},
				error: {
					platform: isMacintosh ? 'macos' : 'linux',
					error: `Failed to start Shell: ${err.message}`,
					suggestion: `Unable to start Shell "${systemShell}".\n\n` +
						`Suggestions:\n` +
						`1. Confirm that the Shell exists and is executable\n` +
						`2. Check if the SHELL environment variable is correctly set\n` +
						`3. Try running "${systemShell}" in terminal to check if it works properly`
				}
			})
		})

		const buffers: Buffer[] = []
		child.stdout.on('data', b => buffers.push(b))

		const stderr: Buffer[] = []
		child.stderr.on('data', b => stderr.push(b))

		child.on('close', (code, signal) => {
			clearTimeout(timeout)

			const raw = Buffer.concat(buffers).toString('utf8')
			const stderrStr = Buffer.concat(stderr).toString('utf8')

			if (code || signal) {
				console.warn(`[MCP] Shell exited with code ${code}, signal ${signal}`)
				console.warn(`[MCP] stderr: ${stderrStr}`)
				resolve({
					env: {},
					error: {
						platform: isMacintosh ? 'macos' : 'linux',
						error: `Shell exited abnormally (code: ${code}, signal: ${signal})`,
						suggestion: `Shell "${systemShell}" exited abnormally.\n\n` +
							`Error output:\n${stderrStr || '(none)'}\n\n` +
							`Suggestions:\n` +
							`1. Check if Shell configuration files have syntax errors\n` +
							`2. Run "${systemShell} -l" in terminal to test if it works properly\n` +
							`3. Check if any environment variables are causing the Shell to crash`
					}
				})
				return
			}

			const match = regex.exec(raw)
			const rawStripped = match ? match[1] : '{}'

			try {
				const resolvedEnv = JSON.parse(rawStripped)

				// Restore original values for special variables
				if (runAsNode) {
					resolvedEnv['ELECTRON_RUN_AS_NODE'] = runAsNode
				} else {
					delete resolvedEnv['ELECTRON_RUN_AS_NODE']
				}

				if (noAttach) {
					resolvedEnv['ELECTRON_NO_ATTACH_CONSOLE'] = noAttach
				} else {
					delete resolvedEnv['ELECTRON_NO_ATTACH_CONSOLE']
				}

				delete resolvedEnv['VSCODE_RESOLVING_ENVIRONMENT']
				delete resolvedEnv['XDG_RUNTIME_DIR']

				resolve({ env: resolvedEnv })
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err)
				console.warn('[MCP] Failed to parse shell environment:', errorMsg)
				console.warn('[MCP] Raw output:', raw.substring(0, 500))
				resolve({
					env: {},
					error: {
						platform: isMacintosh ? 'macos' : 'linux',
						error: `Failed to parse Shell environment output: ${errorMsg}`,
						suggestion: `Unable to parse environment variables returned by Shell.\n\n` +
							`This may be due to:\n` +
							`1. Abnormal output format from Shell configuration files\n` +
							`2. Unexpected content output during Shell startup\n\n` +
							`Suggestions:\n` +
							`- Check echo/printf statements in Shell configuration files\n` +
							`- Run "${systemShell} -l -c 'echo \$PATH'" in terminal to test output`
					}
				})
			}
		})
	})
}

export class MCPChannel implements IServerChannel {

	private readonly infoOfClientId: InfoOfClientId = {}
	private readonly _refreshingServerNames: Set<string> = new Set()

	// Cached shell environment and error info
	private _shellEnvResult: ShellEnvResult | undefined

	// mcp emitters
	private readonly mcpEmitters = {
		serverEvent: {
			onAdd: new Emitter<MCPServerEventResponse>(),
			onUpdate: new Emitter<MCPServerEventResponse>(),
			onDelete: new Emitter<MCPServerEventResponse>(),
		}
	} satisfies {
		serverEvent: {
			onAdd: Emitter<MCPServerEventResponse>,
			onUpdate: Emitter<MCPServerEventResponse>,
			onDelete: Emitter<MCPServerEventResponse>,
		}
	}

	constructor() {
		console.log('[MCP] MCPChannel initialized in electron-main process')
		console.log('[MCP] Platform:', isWindows ? 'Windows' : isMacintosh ? 'macOS' : 'Linux')
		console.log('[MCP] process.env PATH:', process.env.PATH)
	}

	// browser uses this to listen for changes
	listen(_: unknown, event: string): Event<any> {

		// server events
		if (event === 'onAdd_server') return this.mcpEmitters.serverEvent.onAdd.event;
		else if (event === 'onUpdate_server') return this.mcpEmitters.serverEvent.onUpdate.event;
		else if (event === 'onDelete_server') return this.mcpEmitters.serverEvent.onDelete.event;
		// else if (event === 'onLoading_server') return this.mcpEmitters.serverEvent.onChangeLoading.event;

		// tool call events

		// handle unknown events
		else throw new Error(`Event not found: ${event}`);
	}

	// browser uses this to call (see this.channel.call() in mcpConfigService.ts for all usages)
	async call(_: unknown, command: string, params: any): Promise<any> {
		try {
			if (command === 'refreshMCPServers') {
				await this._refreshMCPServers(params)
			}
			else if (command === 'refreshMCPServer') {
				await this._refreshMCPServer(params.serverName, params.serverConfig, params.isOn)
			}
			else if (command === 'closeAllMCPServers') {
				await this._closeAllMCPServers()
			}
			else if (command === 'toggleMCPServer') {
				await this._toggleMCPServer(params.serverName, params.isOn)
			}
			else if (command === 'callTool') {
				const p: MCPToolCallParams = params
				const response = await this._safeCallTool(p.serverName, p.toolName, p.params)
				return response
			}
			else {
				throw new Error(`Void sendLLM: command "${command}" not recognized.`)
			}
		}
		catch (e) {
			console.error('mcp channel: Call Error:', e)
		}
	}

	// server functions


	private async _refreshMCPServers(params: { mcpConfigFileJSON: MCPConfigFileJSON, userStateOfName: MCPUserStateOfName, addedServerNames: string[], removedServerNames: string[], updatedServerNames: string[] }) {

		console.log('[MCP] _refreshMCPServers called with:', {
			added: params.addedServerNames,
			removed: params.removedServerNames,
			updated: params.updatedServerNames
		})

		const {
			mcpConfigFileJSON,
			userStateOfName,
			addedServerNames,
			removedServerNames,
			updatedServerNames,
		} = params

		const { mcpServers: mcpServersJSON } = mcpConfigFileJSON

		const allChanges: { type: 'added' | 'removed' | 'updated', serverName: string }[] = [
			...addedServerNames.map(n => ({ serverName: n, type: 'added' }) as const),
			...removedServerNames.map(n => ({ serverName: n, type: 'removed' }) as const),
			...updatedServerNames.map(n => ({ serverName: n, type: 'updated' }) as const),
		]

		await Promise.all(
			allChanges.map(async ({ serverName, type }) => {

				// check if already refreshing
				if (this._refreshingServerNames.has(serverName)) return
				this._refreshingServerNames.add(serverName)

				const prevServer = this.infoOfClientId[serverName]?.mcpServer;

				// close and delete the old client
				if (type === 'removed' || type === 'updated') {
					await this._closeClient(serverName)
					delete this.infoOfClientId[serverName]
					this.mcpEmitters.serverEvent.onDelete.fire({ response: { prevServer, name: serverName, } })
				}

				// create a new client
				if (type === 'added' || type === 'updated') {
					const clientInfo = await this._createClient(mcpServersJSON[serverName], serverName, userStateOfName[serverName]?.isOn)
					this.infoOfClientId[serverName] = clientInfo
					this.mcpEmitters.serverEvent.onAdd.fire({ response: { newServer: clientInfo.mcpServer, name: serverName, } })
				}
			})
		)

		allChanges.forEach(({ serverName, type }) => {
			this._refreshingServerNames.delete(serverName)
		})

	}

	/**
	 * Refresh a single MCP server with fresh environment variables.
	 * This clears the cached shell environment and re-creates the client.
	 */
	private async _refreshMCPServer(serverName: string, serverConfig: MCPConfigFileEntryJSON, isOn: boolean) {
		console.log(`[MCP] Refreshing server "${serverName}" with fresh environment variables`)

		// Check if already refreshing
		if (this._refreshingServerNames.has(serverName)) {
			console.log(`[MCP] Server "${serverName}" is already being refreshed`)
			return
		}
		this._refreshingServerNames.add(serverName)

		// Clear the cached shell environment to get fresh environment variables
		this._shellEnvResult = undefined
		console.log('[MCP] Cleared cached shell environment')

		const prevServer = this.infoOfClientId[serverName]?.mcpServer

		// Close and delete the old client
		if (this.infoOfClientId[serverName]) {
			await this._closeClient(serverName)
			delete this.infoOfClientId[serverName]
			this.mcpEmitters.serverEvent.onDelete.fire({ response: { prevServer, name: serverName } })
		}

		// Create a new client with fresh environment
		const clientInfo = await this._createClient(serverConfig, serverName, isOn)
		this.infoOfClientId[serverName] = clientInfo
		this.mcpEmitters.serverEvent.onAdd.fire({ response: { newServer: clientInfo.mcpServer, name: serverName } })

		this._refreshingServerNames.delete(serverName)
	}

	private async _createClientUnsafe(server: MCPConfigFileEntryJSON, serverName: string, isOn: boolean): Promise<ClientInfo> {

		const clientConfig = getClientConfig(serverName)
		const client = new Client(clientConfig)
		let transport: Transport;
		let info: MCPServerNonError;

		if (server.url) {
			// first try HTTP, fall back to SSE
			try {
				transport = new StreamableHTTPClientTransport(server.url);
				await client.connect(transport);
				console.log(`Connected via HTTP to ${serverName}`);
				const { tools } = await client.listTools()
				const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))
				info = {
					status: isOn ? 'success' : 'offline',
					tools: toolsWithUniqueName,
					command: server.url.toString(),
				}
			} catch (httpErr) {
				console.warn(`HTTP failed for ${serverName}, trying SSE…`, httpErr);
				transport = new SSEClientTransport(server.url);
				await client.connect(transport);
				const { tools } = await client.listTools()
				const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))
				console.log(`Connected via SSE to ${serverName}`);
				info = {
					status: isOn ? 'success' : 'offline',
					tools: toolsWithUniqueName,
					command: server.url.toString(),
				}
			}
		} else if (server.command) {
			// Get full shell environment if not cached
			if (!this._shellEnvResult) {
				this._shellEnvResult = await getFullShellEnv()
			}

			// Build environment with proper PATH handling
			const env: Record<string, string> = { ...this._shellEnvResult.env }

			// Merge server-specific environment variables
			// For PATH, we append server-defined paths to the existing PATH
			if (server.env) {
				for (const [key, value] of Object.entries(server.env)) {
					if (typeof value === 'string') {
						if (key.toUpperCase() === 'PATH') {
							// Append server PATH to existing PATH
							env[key] = env[key] ? `${env[key]}${path.delimiter}${value}` : value
						} else {
							env[key] = value
						}
					}
				}
			}

			console.log(`[MCP] Starting server "${serverName}" with command: ${server.command} ${server.args?.join(' ') || ''}`)

			// Try to start the MCP server with detailed error handling
			try {
				transport = new StdioClientTransport({
					command: server.command,
					args: server.args,
					env,
				});

				await client.connect(transport)
			} catch (connectErr) {
				// Create detailed error message
				const envError = this._shellEnvResult.error
				let errorMsg = `Failed to connect to MCP server "${serverName}".\n\n`
				errorMsg += `Command: ${server.command} ${server.args?.join(' ') || ''}\n\n`

				// Check if the command might not be in PATH
				const pathInfo = findCommandInPath(server.command, env)
				if (pathInfo.paths.length === 0) {
					errorMsg += `⚠️ PATH environment variable is empty!\n\n`
				} else {
					errorMsg += createCommandNotFoundError(server.command, env) + '\n\n'
				}

				// Add shell environment error if present
				if (envError) {
					errorMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
					errorMsg += `⚠️ Environment Variable Resolution Warning\n`
					errorMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
					errorMsg += `Error: ${envError.error}\n\n`
					errorMsg += `${envError.suggestion}\n\n`
				}

				// Add original error
				errorMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
				errorMsg += `Original Error:\n`
				errorMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
				errorMsg += `${connectErr instanceof Error ? connectErr.message : String(connectErr)}`

				throw new Error(errorMsg)
			}

			// Get the tools from the server
			const { tools } = await client.listTools()
			const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))

			// Create a full command string for display
			const fullCommand = `${server.command} ${server.args?.join(' ') || ''}`

			// Format server object
			info = {
				status: isOn ? 'success' : 'offline',
				tools: toolsWithUniqueName,
				command: fullCommand,
			}

		} else {
			throw new Error(`No url or command for server ${serverName}`);
		}


		return { _client: client, mcpServerEntryJSON: server, mcpServer: info }
	}

	private _addUniquePrefix(base: string) {
		return `${Math.random().toString(36).slice(2, 8)}_${base}`;
	}

	private async _createClient(serverConfig: MCPConfigFileEntryJSON, serverName: string, isOn = true): Promise<ClientInfo> {
		try {
			const c: ClientInfo = await this._createClientUnsafe(serverConfig, serverName, isOn)
			return c
		} catch (err) {
			console.error(`❌ Failed to connect to server "${serverName}":`, err)
			const fullCommand = !serverConfig.command ? '' : `${serverConfig.command} ${serverConfig.args?.join(' ') || ''}`
			const c: MCPServerError = { status: 'error', error: err + '', command: fullCommand, }
			return { mcpServerEntryJSON: serverConfig, mcpServer: c, }
		}
	}

	private async _closeAllMCPServers() {
		for (const serverName in this.infoOfClientId) {
			await this._closeClient(serverName)
			delete this.infoOfClientId[serverName]
		}
		console.log('Closed all MCP servers');
	}

	private async _closeClient(serverName: string) {
		const info = this.infoOfClientId[serverName]
		if (!info) return
		const { _client: client } = info
		if (client) {
			await client.close()
		}
		console.log(`Closed MCP server ${serverName}`);
	}


	private async _toggleMCPServer(serverName: string, isOn: boolean) {
		const prevServer = this.infoOfClientId[serverName]?.mcpServer
		// Handle turning on the server
		if (isOn) {
			// this.mcpEmitters.serverEvent.onChangeLoading.fire(getLoadingServerObject(serverName, isOn))
			const clientInfo = await this._createClientUnsafe(this.infoOfClientId[serverName].mcpServerEntryJSON, serverName, isOn)
			this.mcpEmitters.serverEvent.onUpdate.fire({
				response: {
					name: serverName,
					newServer: clientInfo.mcpServer,
					prevServer: prevServer,
				}
			})
		}
		// Handle turning off the server
		else {
			// this.mcpEmitters.serverEvent.onChangeLoading.fire(getLoadingServerObject(serverName, isOn))
			this._closeClient(serverName)
			delete this.infoOfClientId[serverName]._client

			this.mcpEmitters.serverEvent.onUpdate.fire({
				response: {
					name: serverName,
					newServer: {
						status: 'offline',
						tools: [],
						command: '',
						// Explicitly set error to undefined to reset the error state
						error: undefined,
					},
					prevServer: prevServer,
				}
			})
		}
	}

	// tool call functions

	private async _callTool(serverName: string, toolName: string, params: any): Promise<RawMCPToolCall> {
		const server = this.infoOfClientId[serverName]
		if (!server) throw new Error(`Server ${serverName} not found`)
		const { _client: client } = server
		if (!client) throw new Error(`Client for server ${serverName} not found`)

		const actualToolName = removeMCPToolNamePrefix(toolName)
		console.log(`[MCP] Calling tool "${actualToolName}" on server "${serverName}" with params:`, params)

		// Call the tool with the provided parameters
		const response = await client.callTool({
			name: actualToolName,
			arguments: params
		})

		console.log(`[MCP] Tool "${actualToolName}" response:`, response)

		const { content } = response as CallToolResult

		// Handle empty or invalid content
		if (!content || content.length === 0) {
			throw new Error(`Tool "${actualToolName}" returned empty content. Full response: ${JSON.stringify(response, null, 2)}`)
		}

		const returnValue = content[0]

		if (!returnValue) {
			throw new Error(`Tool "${actualToolName}" returned invalid content. Full response: ${JSON.stringify(response, null, 2)}`)
		}

		if (returnValue.type === 'text') {
			// handle text response

			if (response.isError) {
				throw new Error(`Tool call error: ${returnValue.text}`)
			}

			// handle success
			return {
				event: 'text',
				text: returnValue.text,
				toolName,
				serverName,
			}
		}

		// if (returnValue.type === 'audio') {
		// 	// handle audio response
		// }

		// if (returnValue.type === 'image') {
		// 	// handle image response
		// }

		// if (returnValue.type === 'resource') {
		// 	// handle resource response
		// }

		throw new Error(`Tool call error: We don\'t support ${returnValue.type} tool response yet for tool ${toolName} on server ${serverName}`)
	}

	// tool call error wrapper
	private async _safeCallTool(serverName: string, toolName: string, params: any): Promise<RawMCPToolCall> {
		try {
			const response = await this._callTool(serverName, toolName, params)
			return response
		} catch (err) {

			let errorMessage: string;

			// Handle Error instances (most common case)
			if (err instanceof Error) {
				errorMessage = err.message || err.stack || String(err);
			}
			// Handle MCP JSON-RPC error objects with code
			else if (typeof err === 'object' && err !== null && err['code']) {
				const code = err.code
				let codeDescription = ''
				if (code === -32700)
					codeDescription = 'Parse Error';
				else if (code === -32600)
					codeDescription = 'Invalid Request';
				else if (code === -32601)
					codeDescription = 'Method Not Found';
				else if (code === -32602)
					codeDescription = 'Invalid Parameters';
				else if (code === -32603)
					codeDescription = 'Internal Error';
				else
					codeDescription = `Error Code: ${code}`;
				const message = err['message'] || '';
				const data = err['data'] ? `\nData: ${JSON.stringify(err['data'], null, 2)}` : '';
				errorMessage = `${codeDescription}${message ? `: ${message}` : ''}${data}\nFull response:\n${JSON.stringify(err, null, 2)}`;
			}
			// Handle string errors
			else if (typeof err === 'string') {
				errorMessage = err;
			}
			// Handle other object types
			else if (typeof err === 'object' && err !== null) {
				// Try to extract meaningful information from the object
				const keys = Object.keys(err);
				if (keys.length === 0) {
					errorMessage = 'Unknown error (empty error object)';
				} else {
					errorMessage = JSON.stringify(err, null, 2);
				}
			}
			// Handle null/undefined
			else if (err === null || err === undefined) {
				errorMessage = 'Unknown error (null or undefined)';
			}
			// Handle other types
			else {
				errorMessage = String(err);
			}

			console.error(`MCP Tool Call Error [${serverName}/${toolName}]:`, err);

			const fullErrorMessage = `❌ Failed to call tool "${toolName}" on server "${serverName}": ${errorMessage}`;
			const errorResponse: MCPToolErrorResponse = {
				event: 'error',
				text: fullErrorMessage,
				toolName,
				serverName,
			}
			return errorResponse
		}
	}
}


