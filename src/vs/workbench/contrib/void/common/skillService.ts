/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js'
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js'
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js'
import { IFileService } from '../../../../platform/files/common/files.js'
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js'
import { IPathService } from '../../../services/path/common/pathService.js'
import { IProductService } from '../../../../platform/product/common/productService.js'
import { Event, Emitter } from '../../../../base/common/event.js'
import { URI } from '../../../../base/common/uri.js'
import { VSBuffer } from '../../../../base/common/buffer.js'
import { IChannel } from '../../../../base/parts/ipc/common/ipc.js'
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js'
import { IEditorService } from '../../../services/editor/common/editorService.js'
import { SkillInfo, SkillFrontMatter, SkillServiceState, SkillLocation, AddSkillResult, DeleteSkillResult } from './skillServiceTypes.js'

export interface ISkillService {
	readonly _serviceBrand: undefined
	readonly state: SkillServiceState
	onDidChangeState: Event<void>
	/** 获取所有技能列表（不合并，用于设置页面显示） */
	getSkills(): SkillInfo[]
	/** 获取合并后的技能列表（项目级优先，用于聊天区菜单） */
	getMergedSkills(): SkillInfo[]
	refreshSkills(): Promise<void>
	waitForInit(): Promise<void>
	ensureGitignore(folderUri: URI): Promise<void>
	ensureProjectSkillDir(folderUri: URI): Promise<void>
	ensureGlobalSkillDir(): Promise<void>
	addSkill(zipPath: string, location: SkillLocation): Promise<AddSkillResult>
	deleteSkill(skillPath: string, location: SkillLocation): Promise<DeleteSkillResult>
	/** 打开技能的 SKILL.md 文件进行编辑 */
	openSkillFile(skillPath: string): Promise<void>
}

export const ISkillService = createDecorator<ISkillService>('skillService')

const SKILL_DIR_NAME = '.coderchat-editor'
const SKILLS_FOLDER_NAME = 'skills'
const SKILL_FILE_NAME = 'SKILL.md'

class SkillService extends Disposable implements ISkillService {
	_serviceBrand: undefined

	private readonly _onDidChangeState = new Emitter<void>()
	public readonly onDidChangeState = this._onDidChangeState.event

	state: SkillServiceState = {
		skills: [],
		mergedSkills: [],
		error: undefined,
	}

	private _initPromise: Promise<void> | undefined
	private _projectFileWatcherStore: DisposableStore | undefined
	private _globalFileWatcherStore: DisposableStore | undefined

	private readonly channel: IChannel

	constructor(
		@IFileService private readonly fileService: IFileService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@IPathService private readonly pathService: IPathService,
		@IProductService private readonly productService: IProductService,
		@IMainProcessService private readonly mainProcessService: IMainProcessService,
		@IEditorService private readonly editorService: IEditorService,
	) {
		super()
		this.channel = this.mainProcessService.getChannel('void-channel-skill')
		this._initPromise = this._initialize()
		this._register(
			this.workspaceContextService.onDidChangeWorkspaceFolders(async () => {
				await this.refreshSkills()
				// 重新注册项目级文件监听
				await this._registerProjectFileWatchers()
			})
		)
	}

	private async _initialize() {
		await this.refreshSkills()
		// 添加文件监听
		await this._registerProjectFileWatchers()
		await this._registerGlobalFileWatchers()
	}

	public async ensureGitignore(folderUri: URI): Promise<void> {
		const gitignoreUri = URI.joinPath(folderUri, '.gitignore')
		
		try {
			// 检查 .gitignore 文件是否存在
			const exists = await this._fileExists(gitignoreUri)
			
			if (exists) {
				// 读取文件内容
				const content = await this.fileService.readFile(gitignoreUri)
				const contentStr = content.value.toString()
				
				// 检查是否已包含 .coderchat-editor/ 配置
				const lines = contentStr.split('\n')
				const hasConfig = lines.some(line => line.trim() === '.coderchat-editor/' || line.trim() === '.coderchat-editor')
				
				if (!hasConfig) {
					// 在末尾添加 .coderchat-editor/
					const newContent = contentStr.endsWith('\n') 
						? contentStr + '.coderchat-editor/\n'
						: contentStr + '\n.coderchat-editor/\n'
					
					await this.fileService.writeFile(gitignoreUri, VSBuffer.fromString(newContent))
				}
			}
		} catch (e) {
			// 忽略错误，不影响主流程
			console.warn('[SkillService] Error checking/updating .gitignore:', e)
		}
	}

	public async ensureProjectSkillDir(folderUri: URI): Promise<void> {
		const skillDir = URI.joinPath(folderUri, SKILL_DIR_NAME, SKILLS_FOLDER_NAME)
		
		try {
			// 检查 skill 目录是否存在
			const exists = await this._directoryExists(skillDir)
			
			if (!exists) {
				// 创建 .coderchat-editor/skills 目录
				// 需要先创建父目录 .coderchat-editor
				const parentDir = URI.joinPath(folderUri, SKILL_DIR_NAME)
				const parentExists = await this._directoryExists(parentDir)
				
				if (!parentExists) {
					await this.fileService.createFolder(parentDir)
				}
				
				await this.fileService.createFolder(skillDir)
			}
		} catch (e) {
			// 忽略错误，不影响主流程
			console.warn('[SkillService] Error creating skill directory:', e)
		}
	}

	public async ensureGlobalSkillDir(): Promise<void> {
		const globalSkillDir = await this._getGlobalSkillDir()
		
		try {
			// 检查全局 skill 目录是否存在
			const exists = await this._directoryExists(globalSkillDir)
			
			if (!exists) {
				// 创建全局 skills 目录
				// 需要先创建父目录 (用户数据目录/.coderchat-editor 或 .coderchat-editor-dev)
				const appName = this.productService.dataFolderName
				const userHome = await this.pathService.userHome()
				const parentDir = URI.joinPath(userHome, appName)
				const parentExists = await this._directoryExists(parentDir)
				
				if (!parentExists) {
					await this.fileService.createFolder(parentDir)
				}
				
				await this.fileService.createFolder(globalSkillDir)
			}
		} catch (e) {
			// 忽略错误，不影响主流程
			console.warn('[SkillService] Error creating global skill directory:', e)
		}
	}

	private async _fileExists(uri: URI): Promise<boolean> {
		try {
			await this.fileService.stat(uri)
			return true
		} catch (e) {
			return false
		}
	}

	private async _registerProjectFileWatchers() {
		// 取消之前的项目级文件监听
		if (this._projectFileWatcherStore) {
			this._projectFileWatcherStore.dispose()
			this._projectFileWatcherStore = undefined
		}

		// 创建新的 DisposableStore 来管理项目级监听
		this._projectFileWatcherStore = new DisposableStore()

		// 监听项目级 skill 目录
		const workspaceFolders = this.workspaceContextService.getWorkspace().folders
		for (const folder of workspaceFolders) {
			// 确保 skill 目录存在
			await this.ensureProjectSkillDir(folder.uri)
			
			const projectSkillDir = URI.joinPath(folder.uri, SKILL_DIR_NAME, SKILLS_FOLDER_NAME)
			try {
				if (await this._directoryExists(projectSkillDir)) {
					this._projectFileWatcherStore.add(this.fileService.watch(projectSkillDir))
				}
			} catch (e) {
				// 目录不存在，忽略
			}
		}

		// 文件变化时刷新
		this._projectFileWatcherStore.add(this.fileService.onDidFilesChange(async (e) => {
			const workspaceFolders = this.workspaceContextService.getWorkspace().folders
			let shouldRefresh = false

			// 检查是否是项目级 skill 相关文件变化
			for (const folder of workspaceFolders) {
				const projectSkillDir = URI.joinPath(folder.uri, SKILL_DIR_NAME, SKILLS_FOLDER_NAME)
				if (e.affects(projectSkillDir)) {
					shouldRefresh = true
					break
				}
			}

			if (shouldRefresh) {
				await this.refreshSkills()
			}
		}))
	}

	private async _registerGlobalFileWatchers() {
		// 取消之前的全局级文件监听
		if (this._globalFileWatcherStore) {
			this._globalFileWatcherStore.dispose()
			this._globalFileWatcherStore = undefined
		}

		// 创建新的 DisposableStore 来管理全局级监听
		this._globalFileWatcherStore = new DisposableStore()

		// 确保全局 skill 目录存在
		await this.ensureGlobalSkillDir()

		// 监听全局级 skill 目录
		const globalSkillDir = await this._getGlobalSkillDir()
		try {
			if (await this._directoryExists(globalSkillDir)) {
				this._globalFileWatcherStore.add(this.fileService.watch(globalSkillDir))
			}
		} catch (e) {
			// 目录不存在，忽略
		}

		// 文件变化时刷新
		this._globalFileWatcherStore.add(this.fileService.onDidFilesChange(async (e) => {
			// 检查是否是全局 skill 目录变化
			const globalSkillDir = await this._getGlobalSkillDir()
			if (e.affects(globalSkillDir)) {
				await this.refreshSkills()
			}
		}))
	}

	private async _directoryExists(uri: URI): Promise<boolean> {
		try {
			const stat = await this.fileService.stat(uri)
			return stat.isDirectory
		} catch (e) {
			return false
		}
	}

	private async _getGlobalSkillDir(): Promise<URI> {
		const appName = this.productService.dataFolderName
		const userHome = await this.pathService.userHome()
		// 用户数据目录已经是 .coderchat-editor 或 .coderchat-editor-dev
		// skills 目录应该直接在用户数据目录下
		return URI.joinPath(userHome, appName, SKILLS_FOLDER_NAME)
	}

	public async refreshSkills(): Promise<void> {
		// 所有技能列表（不合并）
		const allSkills: SkillInfo[] = []
		// 使用 Map 按 skill name 去重，项目级 skill 覆盖全局级同名 skill（用于聊天区菜单）
		const mergedSkillInfoOfSkillName = new Map<string, SkillInfo>()
		const errors: string[] = []

		console.log('[SkillService] refreshSkills called')

		// 1. 先读取全局级 skills
		try {
			const globalSkillDir = await this._getGlobalSkillDir()
			console.log('[SkillService] Global skill dir:', globalSkillDir.fsPath)
			const globalSkills = await this._readSkillsFromDirectory(globalSkillDir, 'global')
			console.log('[SkillService] Global skills found:', globalSkills.length, globalSkills.map(s => s.name))
			// 添加到所有技能列表
			allSkills.push(...globalSkills)
			// 添加到合并列表
			for (const skill of globalSkills) {
				mergedSkillInfoOfSkillName.set(skill.name, skill)
			}
		} catch (e) {
			console.warn('[SkillService] Error reading global skills:', e)
		}

		// 2. 再读取项目级 skills
		const workspaceFolders = this.workspaceContextService.getWorkspace().folders
		console.log('[SkillService] Workspace folders:', workspaceFolders.map(f => f.uri.fsPath))
		
		for (const folder of workspaceFolders) {
			try {
				const projectSkillDir = URI.joinPath(folder.uri, SKILL_DIR_NAME, SKILLS_FOLDER_NAME)
				console.log('[SkillService] Project skill dir:', projectSkillDir.fsPath)
				const projectSkills = await this._readSkillsFromDirectory(projectSkillDir, 'project')
				console.log('[SkillService] Project skills found:', projectSkills.length, projectSkills.map(s => s.name))
				// 添加到所有技能列表
				allSkills.push(...projectSkills)
				// 添加到合并列表（项目级 skill 覆盖同名全局级 skill）
				for (const skill of projectSkills) {
					mergedSkillInfoOfSkillName.set(skill.name, skill)
				}
			} catch (e) {
				console.warn('[SkillService] Error reading project skills:', e)
			}
		}

		const mergedSkills = Array.from(mergedSkillInfoOfSkillName.values())
		console.log('[SkillService] Total skills:', allSkills.length, 'Merged skills:', mergedSkills.length)
		
		this.state = {
			skills: allSkills,
			mergedSkills,
			error: errors.length > 0 ? errors.join('\n') : undefined,
		}
		this._onDidChangeState.fire()
	}

	private async _readSkillsFromDirectory(skillDir: URI, location: SkillLocation): Promise<SkillInfo[]> {
		const skills: SkillInfo[] = []

		try {
			console.log('[SkillService] _readSkillsFromDirectory:', skillDir.fsPath, 'location:', location)
			const stat = await this.fileService.stat(skillDir)
			console.log('[SkillService] stat result, isDirectory:', stat.isDirectory)
			if (!stat.isDirectory) {
				return skills
			}

			// 使用 resolve 方法获取目录内容
			const resolved = await this.fileService.resolve(skillDir)
			console.log('[SkillService] resolve result, children count:', resolved.children?.length || 0)
			if (!resolved.children || resolved.children.length === 0) {
				return skills
			}

			for (const child of resolved.children) {
				console.log('[SkillService] child:', child.name, 'isDirectory:', child.isDirectory)
				if (!child.isDirectory) {
					continue
				}

				const skillFilePath = URI.joinPath(child.resource, SKILL_FILE_NAME)
				try {
					const skillInfo = await this._readSkillFile(skillFilePath, child.name, location)
					console.log('[SkillService] skillInfo:', skillInfo)
					if (skillInfo) {
						skills.push(skillInfo)
					}
				} catch (e) {
					// 读取单个 skill 失败，跳过
					console.warn(`Failed to read skill from ${child.resource.fsPath}:`, e)
				}
			}
		} catch (e) {
			console.warn('[SkillService] Error in _readSkillsFromDirectory:', e)
		}

		return skills
	}

	private async _readSkillFile(skillFileUri: URI, defaultName: string, location: SkillLocation): Promise<SkillInfo | null> {
		try {
			const content = await this.fileService.readFile(skillFileUri)
			const contentStr = content.value.toString()

			// 解析 YAML frontmatter
			const frontMatter = this._parseFrontMatter(contentStr)

			return {
				name: frontMatter?.name || defaultName,
				description: frontMatter?.description || '',
				location,
				skillPath: URI.joinPath(skillFileUri, '..').fsPath,
			}
		} catch (e) {
			return null
		}
	}

	private _parseFrontMatter(content: string): SkillFrontMatter | null {
		const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
		if (!frontMatterMatch) {
			return null
		}

		const frontMatterStr = frontMatterMatch[1]
		const result: Partial<SkillFrontMatter> = {}

		// 简单的 YAML 解析（只支持简单的 key: value 格式）
		const lines = frontMatterStr.split('\n')
		for (const line of lines) {
			const colonIdx = line.indexOf(':')
			if (colonIdx === -1) {
				continue
			}
			const key = line.slice(0, colonIdx).trim()
			let value = line.slice(colonIdx + 1).trim()
			// 移除引号
			if ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1)
			}
			if (key === 'name' || key === 'description' || key === 'license') {
				(result as any)[key] = value
			}
		}

		return result.name ? result as SkillFrontMatter : null
	}

	public getSkills(): SkillInfo[] {
		return this.state.skills
	}

	public getMergedSkills(): SkillInfo[] {
		return this.state.mergedSkills
	}

	public async openSkillFile(skillPath: string): Promise<void> {
		try {
			const skillMdUri = URI.joinPath(URI.file(skillPath), SKILL_FILE_NAME)
			await this.editorService.openEditor({
				resource: skillMdUri,
				options: {
					pinned: true,
					revealIfOpened: true,
				}
			})
		} catch (error) {
			console.error('[SkillService] Error opening skill file:', error)
		}
	}

	public async waitForInit(): Promise<void> {
		if (this._initPromise) {
			await this._initPromise
		}
	}

	public async addSkill(zipPath: string, location: SkillLocation): Promise<AddSkillResult> {
		// Get project folder path if location is project
		const workspaceFolders = this.workspaceContextService.getWorkspace().folders
		const projectFolderPath = location === 'project' && workspaceFolders.length > 0
			? workspaceFolders[0].uri.fsPath
			: undefined

		// Get global skill directory path if location is global
		const globalSkillDir = location === 'global' ? (await this._getGlobalSkillDir()).fsPath : undefined

		const result = await this.channel.call<AddSkillResult>('addSkill', {
			zipPath,
			location,
			projectFolderPath,
			globalSkillDir
		})

		// Refresh skills after adding
		if (result.success) {
			await this.refreshSkills()
		}

		return result
	}

	public async deleteSkill(skillPath: string, location: SkillLocation): Promise<DeleteSkillResult> {
		const result = await this.channel.call<DeleteSkillResult>('deleteSkill', {
			skillPath,
			location
		})

		// Refresh skills after deleting
		if (result.success) {
			await this.refreshSkills()
		}

		return result
	}
}

registerSingleton(ISkillService, SkillService, InstantiationType.Eager)
