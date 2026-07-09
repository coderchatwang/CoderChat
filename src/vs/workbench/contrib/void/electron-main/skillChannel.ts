/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// Skill Channel - handles Node.js operations for skill management (ZIP extraction, file operations)
// registered in app.ts

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js'
import { Event, Emitter } from '../../../../base/common/event.js'
import { extract } from '../../../../base/node/zip.js'
import { CancellationToken } from '../../../../base/common/cancellation.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { mkdir, rm, stat, readdir, readFile, writeFile, chmod } from 'fs/promises'
import { randomUUID } from 'crypto'
import { SkillLocation } from '../common/skillServiceTypes.js'

export interface AddSkillParams {
	zipPath: string
	location: SkillLocation
	projectFolderPath?: string
	globalSkillDir?: string
}

export interface AddSkillResult {
	success: boolean
	skillName: string
	error?: string
}

export interface DeleteSkillParams {
	skillPath: string
	location: SkillLocation
}

export interface DeleteSkillResult {
	success: boolean
	error?: string
}

const SKILL_DIR_NAME = '.coderchat-editor'
const SKILLS_FOLDER_NAME = 'skills'
const SKILL_FILE_NAME = 'SKILL.md'

export class SkillChannel implements IServerChannel {

	private readonly _onDidAddSkill = new Emitter<{ skillName: string, location: SkillLocation }>()
	private readonly _onDidDeleteSkill = new Emitter<{ skillName: string, location: SkillLocation }>()

	readonly onDidAddSkill = this._onDidAddSkill.event
	readonly onDidDeleteSkill = this._onDidDeleteSkill.event

	constructor() { }

	// browser uses this to listen for changes
	listen(_: unknown, event: string): Event<any> {
		if (event === 'onDidAddSkill') return this._onDidAddSkill.event
		if (event === 'onDidDeleteSkill') return this._onDidDeleteSkill.event
		throw new Error(`Event not found: ${event}`)
	}

	// browser uses this to call
	async call(_: unknown, command: string, params: any): Promise<any> {
		try {
			if (command === 'addSkill') {
				return await this._addSkill(params as AddSkillParams)
			}
			else if (command === 'deleteSkill') {
				return await this._deleteSkill(params as DeleteSkillParams)
			}
			else {
				throw new Error(`SkillChannel: command "${command}" not recognized.`)
			}
		}
		catch (e) {
			console.error('SkillChannel: Call Error:', e)
			return { success: false, error: String(e) }
		}
	}

	private async _addSkill(params: AddSkillParams): Promise<AddSkillResult> {
		const { zipPath, location, projectFolderPath, globalSkillDir } = params

		try {
			// 1. Create temp directory for extraction
			const tempDir = join(tmpdir(), `skill-extract-${randomUUID()}`)
			await mkdir(tempDir, { recursive: true })

			// 2. Extract ZIP to temp directory
			await extract(zipPath, tempDir, { overwrite: true }, CancellationToken.None)

			// 2.1 Fix permissions on extracted files to ensure they are readable
			await this._fixDirectoryPermissions(tempDir)

			// 3. Validate skill package
			const validation = await this._validateSkill(tempDir)
			if (!validation.valid) {
				await rm(tempDir, { recursive: true, force: true })
				return { success: false, skillName: '', error: validation.error || 'Invalid skill package.' }
			}

			const skillName = validation.skillName!

			// 4. Get target directory
			const targetDir = this._getTargetSkillDir(location, projectFolderPath, globalSkillDir)
			if (!targetDir) {
				await rm(tempDir, { recursive: true, force: true })
				return { success: false, skillName, error: location === 'project' ? 'No workspace folder opened for project-level skill.' : 'Could not determine global skill directory.' }
			}

			// 5. Check if skill already exists
			const skillTargetPath = join(targetDir, skillName)
			const skillExists = await this._directoryExists(skillTargetPath)
			if (skillExists) {
				await rm(tempDir, { recursive: true, force: true })
				return { success: false, skillName, error: `Skill "${skillName}" already exists. Please delete it first or use a different name.` }
			}

			// 6. Create target directory
			await mkdir(skillTargetPath, { recursive: true })

			// 7. Copy extracted files to target
			const sourceSkillDir = await this._findSkillSourceDir(tempDir, skillName)
			await this._copyDirectory(sourceSkillDir, skillTargetPath)

			// 8. Clean up temp directory
			await rm(tempDir, { recursive: true, force: true })

			// 9. Fire event
			this._onDidAddSkill.fire({ skillName, location })

			console.log(`[SkillChannel] Successfully added skill: ${skillName} (${location})`)
			return { success: true, skillName }

		} catch (e) {
			console.error('[SkillChannel] Error adding skill:', e)
			return { success: false, skillName: '', error: String(e) }
		}
	}

	private async _deleteSkill(params: DeleteSkillParams): Promise<DeleteSkillResult> {
		const { skillPath, location } = params

		try {
			// 1. Check if skill exists
			const skillExists = await this._directoryExists(skillPath)
			if (!skillExists) {
				return { success: false, error: `Skill not found at path: ${skillPath}` }
			}

			// 2. Delete skill directory
			await rm(skillPath, { recursive: true, force: true })

			// 3. Fire event
			const skillName = skillPath.split(/[/\\]/).pop() || ''
			this._onDidDeleteSkill.fire({ skillName, location })

			console.log(`[SkillChannel] Successfully deleted skill at: ${skillPath}`)
			return { success: true }

		} catch (e) {
			console.error('[SkillChannel] Error deleting skill:', e)
			return { success: false, error: String(e) }
		}
	}

	private async _findSkillName(tempDir: string): Promise<string | null> {
		// Look for SKILL.md in the root or first level subdirectories
		// A valid skill MUST contain a SKILL.md file
		const entries = await readdir(tempDir, { withFileTypes: true })

		// Check if SKILL.md exists in root
		const skillMdInRoot = entries.find(e => e.isFile() && e.name === SKILL_FILE_NAME)
		if (skillMdInRoot) {
			// Use the parent directory name as skill name (from ZIP filename)
			const parts = tempDir.split(/[/\\]/)
			return parts[parts.length - 1] || 'skill'
		}

		// Check subdirectories for SKILL.md
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const skillMdPath = join(tempDir, entry.name, SKILL_FILE_NAME)
				try {
					await stat(skillMdPath)
					return entry.name
				} catch {
					// SKILL.md not found in this directory, continue
				}
			}
		}

		// No SKILL.md found - this is not a valid skill
		return null
	}

	private async _validateSkill(tempDir: string): Promise<{ valid: boolean, skillName: string | null, error?: string }> {
		const skillName = await this._findSkillName(tempDir)
		if (!skillName) {
			return { valid: false, skillName: null, error: 'Invalid skill package. A skill must contain a SKILL.md file.' }
		}

		// Additional validation: check if SKILL.md has required frontmatter
		const sourceSkillDir = await this._findSkillSourceDir(tempDir, skillName)
		const skillMdPath = join(sourceSkillDir, SKILL_FILE_NAME)
		try {
			const content = await readFile(skillMdPath, 'utf-8')
			// Check for YAML frontmatter
			if (!content.startsWith('---')) {
				return { valid: false, skillName, error: 'Invalid SKILL.md file. It must start with YAML frontmatter (---).' }
			}
			// Check for closing frontmatter
			const frontMatterEnd = content.indexOf('\n---', 4)
			if (frontMatterEnd === -1) {
				return { valid: false, skillName, error: 'Invalid SKILL.md file. YAML frontmatter must be closed with ---.' }
			}
		} catch (e) {
			return { valid: false, skillName, error: `Failed to read SKILL.md: ${e}` }
		}

		return { valid: true, skillName }
	}

	private async _findSkillSourceDir(tempDir: string, skillName: string): Promise<string> {
		// Check if skill files are in root
		const skillMdPath = join(tempDir, SKILL_FILE_NAME)
		try {
			await stat(skillMdPath)
			return tempDir
		} catch {
			// SKILL.md not in root
		}

		// Look in subdirectory
		const skillDir = join(tempDir, skillName)
		try {
			await stat(skillDir)
			return skillDir
		} catch {
			// Not found, return tempDir anyway
			return tempDir
		}
	}

	private _getTargetSkillDir(location: SkillLocation, projectFolderPath?: string, globalSkillDir?: string): string | null {
		if (location === 'project') {
			if (!projectFolderPath) {
				return null
			}
			return join(projectFolderPath, SKILL_DIR_NAME, SKILLS_FOLDER_NAME)
		} else {
			// Global skill directory - use the path passed from skillService
			if (!globalSkillDir) {
				return null
			}
			return globalSkillDir
		}
	}

	private async _directoryExists(path: string): Promise<boolean> {
		try {
			const s = await stat(path)
			return s.isDirectory()
		} catch {
			return false
		}
	}

	private async _copyDirectory(source: string, target: string): Promise<void> {
		await mkdir(target, { recursive: true })
		const entries = await readdir(source, { withFileTypes: true })

		for (const entry of entries) {
			const sourcePath = join(source, entry.name)
			const targetPath = join(target, entry.name)

			if (entry.isDirectory()) {
				await this._copyDirectory(sourcePath, targetPath)
			} else {
				const content = await readFile(sourcePath)
				await writeFile(targetPath, content)
			}
		}
	}

	/**
	 * Fix permissions on extracted files to ensure they are readable.
	 * This is necessary because ZIP files may contain files with incorrect permissions,
	 * especially when extracted to temp directories on macOS.
	 */
	private async _fixDirectoryPermissions(dirPath: string): Promise<void> {
		try {
			const entries = await readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const entryPath = join(dirPath, entry.name)

				if (entry.isDirectory()) {
					// Fix directory permissions: rwxr-xr-x (755)
					await chmod(entryPath, 0o755)
					await this._fixDirectoryPermissions(entryPath)
				} else {
					// Fix file permissions: rw-r--r-- (644)
					await chmod(entryPath, 0o644)
				}
			}
		} catch (e) {
			console.warn('[SkillChannel] Warning: Could not fix permissions:', e)
		}
	}
}
