/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as nls from '../../../../../../../nls.js'
import { getNLSLanguage } from '../../../../../../../nls.js'
import { DefaultLang } from '../../../../common/voidSettingsTypes.js'

/**
 * 使用 VS Code NLS 系统的国际化实现
 * localize(key, defaultMessage, ...args) 会在构建时被替换为索引查找，
 * 运行时从 _VSCODE_NLS_MESSAGES 中获取当前语言的翻译文本。
 * 开发模式下（VSCODE_DEV）直接返回 defaultMessage。
 */
const localize = nls.localize

/**
 * 默认语言设置
 * 可选值: 'auto' | 'en' | 'zh'
 * - 'auto': 根据 VS Code NLS 语言自动选择（中文用中文默认，其他用英文默认）
 * - 'en': 强制使用英文默认值
 * - 'zh': 强制使用中文默认值
 *
 * 此值仅在初始化时从设置中读取一次，修改设置后需要重启生效
 */
let _DEFAULT_LANG: DefaultLang = 'auto'

/**
 * 初始化默认语言设置（从设置服务读取）
 * 此函数应在服务初始化后调用一次
 */
export const initDefaultLang = (lang: DefaultLang) => {
	console.log('[i18n] initDefaultLang called with:', lang)
	_DEFAULT_LANG = lang
	console.log('[i18n] _DEFAULT_LANG set to:', _DEFAULT_LANG)
}

/**
 * 获取当前的默认语言设置
 */
export const getDEFAULT_LANG = (): DefaultLang => {
	return _DEFAULT_LANG
}

/**
 * 根据当前设置解析实际使用的语言
 */
function resolveLang(): 'en' | 'zh' {
	if (_DEFAULT_LANG !== 'auto') {
		return _DEFAULT_LANG
	}
	// auto 模式：根据 VS Code NLS 语言选择
	const nlsLanguage = getNLSLanguage()
	// 中文语言代码：zh-cn, zh-tw, zh-hk, zh-sg, zh 等
	if (nlsLanguage?.toLowerCase().startsWith('zh')) {
		return 'zh'
	}
	// 其他语言默认使用英文
	return 'en'
}

/**
 * 所有语言的默认消息
 */
const defaultMessages = {
	en: {
		// 侧边栏标题
		chatTitle: 'Chat',

		// 思考/推理相关
		reasoning: 'Thinking',
		reasoningDisabled: 'Reasoning disabled',
		deepThinking: 'Deep thinking',
		expand: 'Expand',

		// 聊天模式相关
		chatModeNormal: 'Normal conversation',
		chatModeGather: 'Read files only, cannot edit',
		chatModeAgent: 'Edit files and use tools',

		// 图片相关
		uploadImageTitle: 'Upload image',
		dropImagePlaceholder: 'Drop images here',
		imageAlt: 'Image',
		imageMessage: 'Image message',

		// 工具执行相关
		toolError: 'Tool execution error',
		toolCancelled: 'Cancelled',

		// 文件相关
		currentFile: '(current file)',

		// 结果相关
		resultsCount: '{0}{1} results',

		// 错误相关
		lintErrors: 'Lint Errors',
		error: 'Error',
		lineRange: 'Line {0}-{1}',

		// 占位符
		editMessagePlaceholder: 'Edit your message...',

		// 工具状态 - 完成状态
		toolReadFileDone: 'File read',
		toolLsDirDone: 'Directory listed',
		toolGetDirTreeDone: 'Directory tree fetched',
		toolSearchPathnamesDone: 'File names searched',
		toolSearchForFilesDone: 'File contents searched',
		toolCreateFileOrFolderDone: 'File or folder created',
		toolDeleteFileOrFolderDone: 'File or folder deleted',
		toolEditFileDone: 'File edited',
		toolRewriteFileDone: 'File rewritten',
		toolRunCommandDone: 'Command executed',

		// 工具状态 - web_fetch
		toolWebFetchDone: 'Web page fetched',
		toolWebFetchProposed: 'Fetch web page',
		toolWebFetchRunning: 'Fetching web page',

		// 工具状态 - ask_user_question
		toolAskUserQuestionDone: 'Question answered',
		toolAskUserQuestionProposed: 'Ask question',
		toolAskUserQuestionRunning: 'Waiting for answer',

		// 工具状态 - 提议状态
		toolReadFileProposed: 'Read file',
		toolLsDirProposed: 'List directory',
		toolGetDirTreeProposed: 'Get directory tree',
		toolSearchPathnamesProposed: 'Search file names',
		toolSearchForFilesProposed: 'Search file contents',
		toolCreateFileOrFolderProposed: 'Create file or folder',
		toolDeleteFileOrFolderProposed: 'Delete file or folder',
		toolEditFileProposed: 'Edit file',
		toolRewriteFileProposed: 'Rewrite file',
		toolRunCommandProposed: 'Run command',

		// 工具别名
		toolNameReadFile: 'Read File',
		toolNameLsDir: 'List Directory',
		toolNameGetDirTree: 'Directory Tree',
		toolNameSearchPathnamesOnly: 'Search File Names',
		toolNameSearchForFiles: 'Search File Contents',
		toolNameSearchInFile: 'Search In File',
		toolNameReadLintErrors: 'Read Lint Errors',
		toolNameCreateFileOrFolder: 'Create File/Folder',
		toolNameDeleteFileOrFolder: 'Delete File/Folder',
		toolNameEditFile: 'Edit File',
		toolNameRewriteFile: 'Rewrite File',
		toolNameRunCommand: 'Run Command',
		toolNameRunPersistentCommand: 'Run Persistent Command',
		toolNameOpenPersistentTerminal: 'Open Persistent Terminal',
		toolNameKillPersistentTerminal: 'Kill Persistent Terminal',
		toolNameXmlEscape: 'XML Escape',
		toolNameAskUserQuestion: 'Ask User Question',
		toolNameWebFetch: 'Web Fetch',
		toolNameTodoWrite: 'Write Todo',
		toolNameTodoRead: 'Read Todo',
		toolNameSleepWait: 'Sleep Wait',
		toolNameSkill: 'Invoke Skill',
		toolNameNoTools: 'No tools available in current mode',

		// 工具状态 - 运行中状态
		toolReadFileRunning: 'Reading file',
		toolLsDirRunning: 'Listing directory',
		toolGetDirTreeRunning: 'Fetching directory tree',
		toolSearchPathnamesRunning: 'Searching file names',
		toolSearchForFilesRunning: 'Searching file contents',
		toolCreateFileOrFolderRunning: 'Creating file or folder',
		toolDeleteFileOrFolderRunning: 'Deleting file or folder',
		toolEditFileRunning: 'Editing file',
		toolRewriteFileRunning: 'Rewriting file',
		toolRunCommandRunning: 'Running command',

		// 用户问题相关
		userRefusedToAnswer: 'User refused to answer',
		needYourAnswer: 'Need your answer',
		multiSelectHint: 'Multiple selection allowed',
		singleSelectHint: 'Single selection',
		otherOption: 'Other...',
		customAnswerPlaceholder: 'Enter custom answer...',
		submit: 'Submit',
		cancel: 'Cancel',
		approve: 'Approve',
		autoApproveDesc: 'Auto approve {0}',
		invalidParams: 'Invalid parameters',
		copy: 'Copy',
		copyToClipboard: 'Copy to clipboard',
		copyInput: 'Copy input: {0}',
		copyJson: 'Copy JSON',
		mcpToolNotFound: 'MCP tool not found',
		truncatedAfter: 'Truncated after {0}',
		searchOnlyIn: 'Search only in {0}',
		resultsTruncated: 'Results truncated',
		resultsTruncatedRemaining: 'Results truncated ({0} remaining)',
		running: 'Running',
		completed: 'Completed',
		awaitingApproval: 'Awaiting approval',
		waitingForReply: 'Waiting...',
		useRegexSearch: 'Use regex search',
		noLintErrors: 'No lint errors found',
		runningIn: 'Running in {0}',
		escapedResult: 'Escaped result',
		escapeSuccess: 'Successfully escaped {0} characters. Original length: {1}, Escaped length: {2}',
		userAnswered: 'User has answered',
		checkpoint: 'Checkpoint',
		system: 'System',
		noFilesChanged: 'No files changed',
		filesChanged: '{0} files changed',
		rejectAll: 'Reject all',
		acceptAll: 'Accept all',
		rejectFile: 'Reject file changes',
		acceptFile: 'Accept file changes',
		changesInFile: '{0} changes',
		fullError: 'Full Error',
		disabledBecauseAnotherRunning: 'Disabled because another thread is running',

		// Todo 工具状态
		toolTodoWriteDone: 'Todo list updated',
		toolTodoWriteProposed: 'Update todo list',
		toolTodoWriteRunning: 'Updating todo list',
		toolTodoReadDone: 'Todo list read',
		toolTodoReadProposed: 'Read todo list',
		toolTodoReadRunning: 'Reading todo list',

		// Sleep 工具状态
		toolSleepWaitDone: 'Wait completed',
		toolSleepWaitProposed: 'Wait',
		toolSleepWaitRunning: 'Waiting',

		// Skill 工具状态
		toolSkillDone: 'Skill invoked',
		toolSkillProposed: 'Invoke skill',
		toolSkillRunning: 'Invoking skill',
		skillNotFound: 'Skill not found',
		skillContent: 'Skill content',

		// Todo 界面
		todoList: 'Todo List',
		todoPending: 'Pending',
		todoInProgress: 'In Progress',
		todoCompleted: 'Completed',
		todoFailed: 'Failed',
		todoPriorityHigh: 'High',
		todoPriorityMedium: 'Medium',
		todoPriorityLow: 'Low',
		todoNoTasks: 'No tasks',
		todoTaskCount: '{0} tasks',
		todoTaskStats: '{0} tasks, {1} completed',
		waitedSeconds: 'Waited {0} seconds',
		skipWait: 'Skip',
		waitSkipped: 'Wait skipped after {0} seconds',

		// 生成相关
		generating: 'Generating',

		// 设置相关
		openSettings: 'Open settings',

		// 输入框占位符
		inputPlaceholder: '@ mention, type instructions...',
		inputPlaceholderWithKey: 'Type @ to add CoderChat context, press {0} to add current file as context.',

		// 建议提示
		suggestedPrompt1: 'Summarize my codebase',
		suggestedPrompt2: 'How do types work in Rust?',
		suggestedPrompt3: 'Create a .voidrules file for me',

		// 线程列表
		previousThreads: 'Previous threads',
		suggestions: 'Suggestions',

		// 聊天模式名称
		chatModeNameChat: 'Chat',
		chatModeNameGather: 'Plan',
		chatModeNameAgent: 'Agent',

		// 分页
		partPage: '(part {0})',

		// 下拉筛选
		enterTextToFilter: 'Enter text to filter...',
		noResultsFound: 'No results found',

		// Diff编辑器
		noChangesFound: 'No changes found',
		showInlineViewOnly: 'Show inline view only',

		// 日期
		today: 'Today',
		yesterday: 'Yesterday',

		// 线程操作
		duplicateThread: 'Duplicate thread',
		deleteThread: 'Delete thread',
		confirm: 'Confirm',
		errorAccessingChatHistory: 'Error accessing chat history.',
		showMore: 'Show {0} more...',
		showLess: 'Show less',
		messagesCount: '{0} messages',

		// 复制按钮状态
		copyIdle: 'Copy',
		copyCopied: 'Copied!',
		copyError: 'Could not copy',

		// 应用块操作
		goToFile: 'Go to file',
		done: 'Done',
		applying: 'Applying',
		stop: 'Stop',
		applyAction: 'Apply',
		remove: 'Remove',
		keep: 'Keep',

		// Diff 导航
		diffOf: 'Diff {0} of {1}',
		noChangesYet: 'No changes yet',
		noChanges: 'No changes',

		// Markdown 渲染
		unknownTokenRendered: 'Unknown token rendered...',

		// 选区助手
		addToChat: 'Add to Chat',
		editInline: 'Edit Inline',
		disableSuggestions: 'Disable Suggestions?',

		// 快速编辑
		enterInstructions: 'Enter instructions...',

		// ======== Settings 界面 ========

		// Settings 标题
		settingsTitle: "CoderChat's Settings",
		seeOnboardingScreen: 'See onboarding screen?',
		models: 'Models',
		localProviders: 'Local Providers',
		mainProviders: 'Main Providers',
		compatibleApiProviders: 'Compatible API Providers',
		featureOptions: 'Feature Options',
		tools: 'Context Tools',
		mcpTools: 'MCP',
		skills: 'Skills',
		configuredSkills: 'Configured Skills',
		skillProject: 'Project Level',
		skillGlobal: 'Global Level',
		noSkillsAvailable: 'No skills configured',
		addSkill: 'Import Skill (ZIP)',
		selectSkillLevel: 'Select Skill Level',
		selectZipFile: 'Select ZIP Package',
		skillsDesc: 'Skills are reusable prompt templates that can be invoked during conversations. To create a new skill, create a folder with a SKILL.md file containing YAML frontmatter (name, description), then package it as a ZIP file and import it.',
		skillProjectDesc: 'Skill only available in current project',
		skillGlobalDesc: 'Skill available in all projects',
		editSkill: 'Edit',
		skillAddSuccess: 'Skill "{0}" added successfully',
		skillAddFailed: 'Failed to add skill: {0}',
		skillDeleteSuccess: 'Skill deleted successfully',
		skillDeleteFailed: 'Failed to delete skill: {0}',
		editor: 'Editor',
		metrics: 'Metrics',
		aiInstructions: 'AI Instructions',
		mcp: 'MCP',
		general: 'General',
		allSettings: 'All Settings',
		oneClickSwitch: 'One-Click Switch',
		importExport: 'Import/Export',
		builtInSettings: 'Built-in Settings',

		// Settings 描述
		localProvidersDesc: 'CoderChat can access any model that you host locally. We automatically detect your local models by default.',
		mainProvidersDesc: 'CoderChat can access models from Anthropic, OpenAI, OpenRouter, and more.',
		compatibleApiProvidersDesc: 'CoderChat supports API providers with compatible interfaces (OpenAI/Anthropic format). We recommend using this method to connect to coding-specific models like GML5 for optimal performance.',
		applySettingsDesc: 'Settings that control the behavior of the Apply button.',
		toolsDesc: 'Tools are functions that LLMs can call. Some tools require user approval.',
		editorSettingsDesc: 'Settings that control the visibility of CoderChat suggestions in the code editor.',
		scmSettingsDesc: 'Settings that control the behavior of the commit message generator.',
		metricsDesc: 'Very basic anonymous usage tracking helps us keep CoderChat running smoothly. You may opt out below. Regardless of this setting, CoderChat never sees your code, messages, or API keys.',
		oneClickSwitchDesc: 'Transfer your editor settings into CoderChat.',
		importExportDesc: "Transfer CoderChat's settings and chats in and out of CoderChat.",
		builtInSettingsDesc: 'IDE settings, keyboard settings, and theme customization.',
		mcpDesc: 'Use Model Context Protocol to provide Agent mode with more tools. After updating MCP environment variables, you need to restart the editor for changes to take effect.',

		// Settings 操作
		addAModel: 'Add a model',
		modelName: 'Model Name',
		providerName: 'Provider Name',
		pleaseSelectProvider: 'Please select a provider.',
		pleaseEnterModelName: 'Please enter a model name.',
		modelAlreadyExists: 'This model already exists.',
		providerNotConfigured: '{0} is not configured. Please configure it in the provider settings first.',
		added: 'Added',
		overrideModelDefaults: 'Override model defaults',
		detectedLocally: 'Detected locally',
		customModel: 'Custom model',
		advancedSettings: 'Advanced Settings',
		delete: 'Delete',
		showInDropdown: 'Show in Dropdown',
		hideFromDropdown: 'Hide from Dropdown',
		addToEnable: 'Add {0} to enable',

		// Add Model Dialog
		addModelDialogTitle: 'Add Model',
		addModelDialogDesc: 'Configure a new model for the selected provider.',
		advancedConfig: 'Advanced Configuration',
		advancedConfigDesc: 'Customize model capabilities and behavior (optional).',
		contextWindow: 'Context Window',
		contextWindowPlaceholder: '128000',
		reservedOutputTokens: 'Reserved Output Tokens',
		reservedOutputTokensPlaceholder: '4096',
		supportsSystemMessage: 'System Message Support',
		supportsSystemMessageNone: 'None',
		specialToolFormat: 'Tool Format',
		specialToolFormatNone: 'Default (XML)',
		supportsVision: 'Supports Vision',
		supportsFIM: 'Supports FIM (Autocomplete)',
		reasoningCapabilities: 'Reasoning Capabilities',
		canTurnOffReasoning: 'Can Turn Off Reasoning',
		canIOReasoning: 'Can Output Reasoning',
		basicConfig: 'Basic Configuration',

		// Edit Model Dialog
		editModelDialogTitle: 'Edit Model',
		editModelDialogDesc: 'Modify the model configuration parameters.',
		editModel: 'Edit Model',
		resetToDefaults: 'Reset to Defaults',
		unrecognizedModel: 'Unrecognized Model',

		// Model config status
		systemDefault: 'System default',
		notSet: 'Not set',

		// Settings 按钮
		importSettings: 'Import Settings',
		exportSettings: 'Export Settings',
		resetSettings: 'Reset Settings',
		importChats: 'Import Chats',
		exportChats: 'Export Chats',
		resetChats: 'Reset Chats',
		confirmReset: 'Confirm Reset',
		generalSettings: 'General Settings',
		keyboardSettings: 'Keyboard Settings',
		themeSettings: 'Theme Settings',
		openLogs: 'Open Logs',
		addMCPServer: 'Add MCP Server',
		save: 'Save',

		// Settings 开关状态
		enabled: 'Enabled',
		disabled: 'Disabled',
		sameAsChatModel: 'Same as Chat model',
		differentModel: 'Different model',
		autoAcceptLLMChanges: 'Auto-accept LLM changes',
		fixLintErrors: 'Fix lint errors',
		showSuggestionsOnSelect: 'Show suggestions on select',
		optOutRequiresRestart: 'Opt-out (requires restart)',
		disableSystemMessage: 'Disable system message',
		disableSystemMessageDesc: 'When disabled, CoderChat will not include anything in the system message except for content you specified above.',
		experimental: 'Experimental.',
		onlyWorksWithFIM: 'Only works with FIM models.*',
		fimModelRecommendation: 'We recommend using the largest qwen2.5-coder model you can with Ollama (try qwen2.5-coder:3b).',

		// Settings 应用方法
		outputSearchReplace: 'Output Search/Replace blocks',
		rewriteWholeFiles: 'Rewrite whole files',

		// Settings 刷新模型
		modelsAreUpToDate: '{0} Models are up-to-date!',
		providerNotFound: '{0} not found!',
		manuallyRefreshModels: 'Manually refresh {0} models.',
		refresh: 'Refresh',
		refreshMCP: 'Refresh MCP server with fresh environment variables',

		// ModelDropdown
		noModelsAvailable: 'No models available',
		noServersFound: 'No servers found',
		noToolsAvailable: 'No tools available',
		enableAModel: 'Enable a model',
		providerRequired: 'Provider required',

		// Auto-approve
		autoApprove: 'Auto-approve {0}',

		// Transfer
		transferring: 'Transferring',
		transferFrom: 'Transfer from {0}',
		settingsTransferred: 'Settings Transferred',
		command: 'Command:',

		// AI Instructions
		aiInstructionsDesc: 'System instructions to include with all AI requests.\nAlternatively, place a `.voidrules` file in the root of your workspace.',

		// Warning
		pleaseAddModel: 'Please add a model for {0} (Models section).',

		// JSON Debug
		showJsonDebug: 'Show JSON Debug',

		// Reset Visible On Send
		resetVisibleOnSend: 'Collapse messages on new message',
		resetVisibleOnSendDesc: 'When sending a new message, collapse to show only the last page of messages. Suitable for low-memory devices.',

		// Show All History Threads
		showAllHistoryThreads: 'Show all history threads',
		showAllHistoryThreadsDesc: 'When enabled, show all chat history threads regardless of project. When disabled, only show threads for the current project.',

		// Developer Mode
		developerMode: 'Developer Mode',
		developerModeDesc: 'Developer tools for debugging and troubleshooting.',
		enableMarkdownCache: 'Enable Markdown Chat Cache',
		enableMarkdownCacheDesc: 'Cache parsed Markdown tokens to improve performance when switching between chat threads.',
		enableMarkdownCacheRestart: 'Requires restart',

		// Default Language
		defaultLanguageDesc: 'CoderChat interface language. Changes require restart.',
		defaultLanguageAuto: 'Auto (follow system)',
		defaultLanguageEn: 'English',
		defaultLanguageZh: 'Chinese',

		// Assistant reply count
		assistantReply: 'Reply #{0}',

		// User message count
		userReply: 'Message #{0}',

		// Message creation time
		messageCreatedAt: '{0}',

		// LLM request duration
		llmRequestDuration: 'Response time',

		// 输入历史
		inputHistoryTitle: 'Input History',
		scrollToBottom: 'Jump to Latest Message',

		// 菜单
		menuTitle: 'Menu',

		// 提示弹窗
		alertDialogTitle: 'Notice',
		alertDialogFeatureNotReady: 'This feature is under development, stay tuned!',
		alertDialogConfirm: 'OK',

		// 导出会话
		exportChatTitle: 'Export Chat',
		exportChatNoThread: 'No active chat to export',
		exportChatNoMessages: 'No messages in current chat',
		exportChatNoData: 'Failed to get chat data',
		exportChatDefaultTitle: 'Chat',
		exportChatMarkdownTitle: 'Export Chat as Markdown',
		exportChatMarkdownSuccess: 'Chat exported successfully',
		exportChatSuccess: 'Chat exported successfully',

		// 导入会话
		importChatTitle: 'Import Chat',
		importChatSuccess: 'Chat imported successfully, switched to imported chat',
		importChatReadError: 'Failed to read chat file',
		importChatParseError: 'Failed to parse chat data',
		importChatInvalidData: 'Invalid chat data format',

		// 复制会话
		menuCopyChat: 'Copy Chat',
		copyChatNoThread: 'No active chat to copy',
		copyChatNoMessages: 'No messages in current chat',
		copyChatNoData: 'Failed to get chat data',
		copyChatSuccess: 'Chat copied successfully, switched to copied chat',

		// 导出会话菜单
		menuExportChat: 'Export Chat',
		menuExportAsMarkdown: 'Export as Markdown',
		menuExportAsChatshare: 'Export as .chatshare file',
		menuImportChat: 'Import Chat',

		// 渐进式渲染
		loading: 'Loading...',
		loadMoreMessages: 'Load {0} more messages',

		// Gather mode confirmation
		gatherModeTaskComplete: 'Switch to Agent mode to execute the plan?',
		gatherModeTaskCompleteDesc: 'Would you like to switch to Agent mode to execute the plan? You can ignore this prompt if the plan is not yet complete.',
		gatherModeSwitchToAgent: 'Execute plan',
		gatherModeContinueGather: 'Continue planning',

		// Workspace check
		workspaceCheckTitle: 'No workspace folder opened',
		workspaceCheckDesc: 'For a better AI experience, please open a workspace folder.',
		workspaceCheckOpen: 'Open Folder',
		workspaceCheckIgnore: 'Ignore',

		// Response Language
		responseLanguage: 'Response Language',
		responseLanguageDesc: 'Language for AI responses. Select a specific language or let AI auto-detect.',
		responseLanguagePromptDesc: 'Prompt text to instruct AI to respond in the selected language. Customize as needed.',
		responseLanguageAuto: 'Auto (follow conversation)',
		responseLanguageZh: 'Chinese',
		responseLanguageEn: 'English',
		responseLanguageJa: 'Japanese',
		responseLanguageKo: 'Korean',
		responseLanguageFr: 'French',
		responseLanguageDe: 'German',
		responseLanguageEs: 'Spanish',
		responseLanguageRu: 'Russian',
		responseLanguagePt: 'Portuguese',

		// Onboarding - Language Selection
		onboardingLanguageTitle: 'What language do you want to use to communicate with AI?',
		onboardingLanguageDesc: 'Select the language for AI responses. This can be changed later in Settings.',

		// Provider 展开/折叠
		expandProviders: 'Show {0} more providers',
		collapseProviders: 'Hide {0} providers',
	},
	zh: {
		// 侧边栏标题
		chatTitle: '聊天',

		// 思考/推理相关
		reasoning: '思考中',
		reasoningDisabled: '推理已禁用',
		deepThinking: '深度思考',
		expand: '展开',

		// 聊天模式相关
		chatModeNormal: '普通对话',
		chatModeGather: '仅读取文件，不可编辑',
		chatModeAgent: '编辑文件并使用工具',

		// 图片相关
		uploadImageTitle: '上传图片',
		dropImagePlaceholder: '拖放图片到这里',
		imageAlt: '图片',
		imageMessage: '图片消息',

		// 工具执行相关
		toolError: '工具执行错误',
		toolCancelled: '已取消',

		// 文件相关
		currentFile: '(当前文件)',

		// 结果相关
		resultsCount: '{0}{1} 个结果',

		// 错误相关
		lintErrors: '检查lint错误',
		error: '错误',
		lineRange: '第 {0}-{1} 行',

		// 占位符
		editMessagePlaceholder: '编辑您的消息...',

		// 工具状态 - 完成状态
		toolReadFileDone: '文件已读取',
		toolLsDirDone: '目录已列出',
		toolGetDirTreeDone: '目录树已获取',
		toolSearchPathnamesDone: '文件名已搜索',
		toolSearchForFilesDone: '文件内容已搜索',
		toolCreateFileOrFolderDone: '文件或文件夹已创建',
		toolDeleteFileOrFolderDone: '文件或文件夹已删除',
		toolEditFileDone: '文件已编辑',
		toolRewriteFileDone: '文件已重写',
		toolRunCommandDone: '命令已执行',

		// 工具状态 - web_fetch
		toolWebFetchDone: '网页已获取',
		toolWebFetchProposed: '获取网页',
		toolWebFetchRunning: '正在获取网页',

		// 工具状态 - ask_user_question
		toolAskUserQuestionDone: '问题已回答',
		toolAskUserQuestionProposed: '提问',
		toolAskUserQuestionRunning: '等待回答',

		// 工具状态 - 提议状态
		toolReadFileProposed: '读取文件',
		toolLsDirProposed: '列出目录',
		toolGetDirTreeProposed: '获取目录树',
		toolSearchPathnamesProposed: '搜索文件名',
		toolSearchForFilesProposed: '搜索文件内容',
		toolCreateFileOrFolderProposed: '创建文件或文件夹',
		toolDeleteFileOrFolderProposed: '删除文件或文件夹',
		toolEditFileProposed: '编辑文件',
		toolRewriteFileProposed: '重写文件',
		toolRunCommandProposed: '运行命令',

		// 工具别名
		toolNameReadFile: '读取文件',
		toolNameLsDir: '列出目录',
		toolNameGetDirTree: '目录树',
		toolNameSearchPathnamesOnly: '搜索文件名',
		toolNameSearchForFiles: '搜索文件内容',
		toolNameSearchInFile: '文件内搜索',
		toolNameReadLintErrors: '读取Lint错误',
		toolNameCreateFileOrFolder: '创建文件/文件夹',
		toolNameDeleteFileOrFolder: '删除文件/文件夹',
		toolNameEditFile: '编辑文件',
		toolNameRewriteFile: '重写文件',
		toolNameRunCommand: '运行命令',
		toolNameRunPersistentCommand: '运行持久命令',
		toolNameOpenPersistentTerminal: '打开持久终端',
		toolNameKillPersistentTerminal: '关闭持久终端',
		toolNameXmlEscape: 'XML转义',
		toolNameAskUserQuestion: '询问用户',
		toolNameWebFetch: '网页获取',
		toolNameTodoWrite: '写入待办',
		toolNameTodoRead: '读取待办',
		toolNameSleepWait: '等待',
		toolNameSkill: '调用技能',
		toolNameNoTools: '当前模式无可用工具',

		// 工具状态 - 运行中状态
		toolReadFileRunning: '正在读取文件',
		toolLsDirRunning: '正在列出目录',
		toolGetDirTreeRunning: '正在获取目录树',
		toolSearchPathnamesRunning: '正在搜索文件名',
		toolSearchForFilesRunning: '正在搜索文件内容',
		toolCreateFileOrFolderRunning: '正在创建文件或文件夹',
		toolDeleteFileOrFolderRunning: '正在删除文件或文件夹',
		toolEditFileRunning: '正在编辑文件',
		toolRewriteFileRunning: '正在重写文件',
		toolRunCommandRunning: '正在运行命令',

		// 用户问题相关
		userRefusedToAnswer: '用户拒绝回答',
		needYourAnswer: '需要您的回答',
		multiSelectHint: '可多选',
		singleSelectHint: '单选',
		otherOption: '其他...',
		customAnswerPlaceholder: '输入自定义答案...',
		submit: '提交',
		cancel: '取消',
		approve: '批准',
		autoApproveDesc: '自动批准 {0}',
		invalidParams: '无效参数',
		copy: '复制',
		copyToClipboard: '复制到剪贴板',
		copyInput: '复制输入: {0}',
		copyJson: '复制 JSON',
		mcpToolNotFound: '未找到 MCP 工具',
		truncatedAfter: '截断于 {0} 之后',
		searchOnlyIn: '仅在 {0} 中搜索',
		resultsTruncated: '结果已截断',
		resultsTruncatedRemaining: '结果已截断（剩余 {0} 个）',
		running: '运行中',
		completed: '已完成',
		awaitingApproval: '等待批准',
		waitingForReply: '等待中...',
		useRegexSearch: '使用正则表达式搜索',
		noLintErrors: '未发现lint错误',
		runningIn: '在 {0} 中运行',
		escapedResult: '已转义结果',
		escapeSuccess: '成功转义 {0} 个字符。原始长度: {1}, 转义后长度: {2}',
		userAnswered: '用户已回答',
		checkpoint: '检查点',
		system: '系统',
		noFilesChanged: '无文件变更',
		filesChanged: '{0} 个文件已变更',
		rejectAll: '全部拒绝',
		acceptAll: '全部接受',
		rejectFile: '拒绝文件变更',
		acceptFile: '接受文件变更',
		changesInFile: '{0} 处变更',
		fullError: '完整错误',
		disabledBecauseAnotherRunning: '因其他线程运行中而禁用',

		// Todo 工具状态
		toolTodoWriteDone: '待办列表已更新',
		toolTodoWriteProposed: '更新待办列表',
		toolTodoWriteRunning: '正在更新待办列表',
		toolTodoReadDone: '待办列表已读取',
		toolTodoReadProposed: '读取待办列表',
		toolTodoReadRunning: '正在读取待办列表',

		// Sleep 工具状态
		toolSleepWaitDone: '等待完成',
		toolSleepWaitProposed: '等待',
		toolSleepWaitRunning: '正在等待',

		// Skill 工具状态
		toolSkillDone: '技能已调用',
		toolSkillProposed: '调用技能',
		toolSkillRunning: '正在调用技能',
		skillNotFound: '未找到技能',
		skillContent: '技能内容',

		// Todo 界面
		todoList: '待办列表',
		todoPending: '待处理',
		todoInProgress: '进行中',
		todoCompleted: '已完成',
		todoFailed: '已失败',
		todoPriorityHigh: '高',
		todoPriorityMedium: '中',
		todoPriorityLow: '低',
		todoNoTasks: '暂无任务',
		todoTaskCount: '{0} 个任务',
		todoTaskStats: '{0} 个任务，已完成 {1} 个',
		waitedSeconds: '已等待 {0} 秒',
		skipWait: '跳过',
		waitSkipped: '等待在 {0} 秒后跳过',

		// 生成相关
		generating: '生成中',

		// 设置相关
		openSettings: '打开设置',

		// 输入框占位符
		inputPlaceholder: '@ 提及，输入指令...',
		inputPlaceholderWithKey: '输入 @ 添加CoderChat上下文，按 {0} 添加当前编辑文件为上下文。',

		// 建议提示
		suggestedPrompt1: '总结我的代码库',
		suggestedPrompt2: 'Rust 中的类型是如何工作的？',
		suggestedPrompt3: '为我创建一个 .voidrules 文件',

		// 线程列表
		previousThreads: '历史会话',
		suggestions: '建议',

		// 聊天模式名称
		chatModeNameChat: '聊天',
		chatModeNameGather: '计划',
		chatModeNameAgent: '智能体',

		// 分页
		partPage: '(第 {0} 部分)',

		// 下拉筛选
		enterTextToFilter: '输入文本以筛选...',
		noResultsFound: '未找到结果',

		// Diff编辑器
		noChangesFound: '未发现变更',
		showInlineViewOnly: '只显示内联视图',

		// 日期
		today: '今天',
		yesterday: '昨天',

		// 线程操作
		duplicateThread: '复制会话',
		deleteThread: '删除会话',
		confirm: '确认',
		errorAccessingChatHistory: '访问聊天历史出错。',
		showMore: '显示更多 {0} 个...',
		showLess: '显示更少',
		messagesCount: '{0} 条消息',

		// 复制按钮状态
		copyIdle: '复制',
		copyCopied: '已复制!',
		copyError: '无法复制',

		// 应用块操作
		goToFile: '跳转到文件',
		done: '完成',
		applying: '应用中',
		stop: '停止',
		applyAction: '应用',
		remove: '移除',
		keep: '保留',

		// Diff 导航
		diffOf: '差异 {0}/{1}',
		noChangesYet: '暂无变更',
		noChanges: '无变更',

		// Markdown 渲染
		unknownTokenRendered: '渲染了未知令牌...',

		// 选区助手
		addToChat: '添加到聊天',
		editInline: '内联编辑',
		disableSuggestions: '禁用建议？',

		// 快速编辑
		enterInstructions: '输入指令...',

		// ======== Settings 界面 ========

		// Settings 标题
		settingsTitle: 'CoderChat 设置',
		seeOnboardingScreen: '查看引导页面？',
		models: '模型',
		localProviders: '本地提供商',
		mainProviders: '主要提供商',
		compatibleApiProviders: '接口供应商',
		featureOptions: '功能选项',
		tools: '上下文工具',
		mcpTools: 'MCP',
		skills: '技能',
		configuredSkills: '已配置技能',
		skillProject: '项目级别',
		skillGlobal: '全局级别',
		noSkillsAvailable: '未配置技能',
		addSkill: '导入技能（ZIP压缩包）',
		selectSkillLevel: '选择技能级别',
		selectZipFile: '选择ZIP压缩包',
		skillsDesc: '技能是可在对话中调用的可重用提示模板。创建新技能的方法：创建一个包含 SKILL.md 文件的文件夹，SKILL.md 需包含 YAML frontmatter（name、description 字段），然后打包为 ZIP 文件导入。',
		skillProjectDesc: '技能仅在当前项目中可用',
		skillGlobalDesc: '技能在所有项目中可用',
		editSkill: '编辑',
		skillAddSuccess: '技能 "{0}" 添加成功',
		skillAddFailed: '添加技能失败: {0}',
		skillDeleteSuccess: '技能删除成功',
		skillDeleteFailed: '删除技能失败: {0}',
		editor: '编辑器',
		metrics: '统计',
		aiInstructions: 'AI 指令',
		mcp: 'MCP',
		general: '通用',
		allSettings: '所有设置',
		oneClickSwitch: '一键切换',
		importExport: '导入/导出',
		builtInSettings: '内置设置',

		// Settings 描述
		localProvidersDesc: 'CoderChat 可以访问您本地托管的任何模型。我们默认会自动检测您的本地模型。',
		mainProvidersDesc: 'CoderChat 可以访问来自 Anthropic、OpenAI、OpenRouter 等的模型。',
		compatibleApiProvidersDesc: 'CoderChat支持兼容格式的API接口提供商（OpenAI/Anthropic格式），推荐以此方式接入GML5等Coding Plan编程专用模型以保证使用效果。',
		applySettingsDesc: '控制应用按钮行为的设置。',
		toolsDesc: '工具是 LLM 可以调用的函数。某些工具需要用户批准。',
		editorSettingsDesc: '控制 CoderChat 建议在代码编辑器中可见性的设置。',
		scmSettingsDesc: '控制提交消息生成器行为的设置。',
		metricsDesc: '非常基础的匿名使用跟踪帮助我们保持 CoderChat 顺畅运行。您可以在下方选择退出。无论此设置如何，CoderChat 永远不会看到您的代码、消息或 API 密钥。',
		oneClickSwitchDesc: '将您的编辑器设置转移到 CoderChat。',
		importExportDesc: '将 CoderChat 的设置和聊天导入导出 CoderChat。',
		builtInSettingsDesc: 'IDE 设置、键盘设置和主题定制。',
		mcpDesc: '使用模型上下文协议为代理模式提供更多工具。更新MCP所需环境变量后需要重启编辑器使生效。',

		// Settings 操作
		addAModel: '添加模型',
		modelName: '模型名称',
		providerName: '提供商名称',
		pleaseSelectProvider: '请选择一个提供商。',
		pleaseEnterModelName: '请输入模型名称。',
		modelAlreadyExists: '该模型已存在。',
		providerNotConfigured: '{0} 尚未配置，请先在提供商设置中完成配置。',
		added: '已添加',
		overrideModelDefaults: '覆盖模型默认值',
		detectedLocally: '本地检测到',
		customModel: '自定义模型',
		advancedSettings: '高级设置',
		delete: '删除',
		showInDropdown: '在下拉菜单中显示',
		hideFromDropdown: '从下拉菜单中隐藏',
		addToEnable: '添加 {0} 以启用',

		// Add Model Dialog
		addModelDialogTitle: '添加模型',
		addModelDialogDesc: '为选定的提供商配置新模型。',
		advancedConfig: '高级配置',
		advancedConfigDesc: '自定义模型能力和行为（可选）。',
		contextWindow: '上下文窗口',
		contextWindowPlaceholder: '128000',
		reservedOutputTokens: '保留输出令牌',
		reservedOutputTokensPlaceholder: '4096',
		supportsSystemMessage: '系统消息支持',
		supportsSystemMessageNone: '无',
		specialToolFormat: '工具格式',
		specialToolFormatNone: '默认（XML）',
		supportsVision: '支持视觉',
		supportsFIM: '支持 FIM（自动补全）',
		reasoningCapabilities: '推理能力',
		canTurnOffReasoning: '可关闭推理',
		canIOReasoning: '可输出推理',
		basicConfig: '基本配置',

		// Edit Model Dialog
		editModelDialogTitle: '编辑模型',
		editModelDialogDesc: '修改模型的配置参数。',
		editModel: '编辑模型',
		resetToDefaults: '重置为默认值',
		unrecognizedModel: '未识别的模型',

		// Model config status
		systemDefault: '系统默认',
		notSet: '未设置',

		// Settings 按钮
		importSettings: '导入设置',
		exportSettings: '导出设置',
		resetSettings: '重置设置',
		importChats: '导入聊天',
		exportChats: '导出聊天',
		resetChats: '重置聊天',
		confirmReset: '确认重置',
		generalSettings: '通用设置',
		keyboardSettings: '键盘设置',
		themeSettings: '主题设置',
		openLogs: '打开日志',
		addMCPServer: '添加 MCP 服务器',
		save: '保存',

		// Settings 开关状态
		enabled: '已启用',
		disabled: '已禁用',
		sameAsChatModel: '与聊天模型相同',
		differentModel: '不同模型',
		autoAcceptLLMChanges: '自动接受 LLM 变更',
		fixLintErrors: '修复lint错误',
		showSuggestionsOnSelect: '选中时显示建议',
		optOutRequiresRestart: '退出（需要重启）',
		disableSystemMessage: '禁用系统消息',
		disableSystemMessageDesc: '禁用时，CoderChat 除了您在上面指定的内容外，不会在系统消息中包含任何内容。',
		experimental: '实验性。',
		onlyWorksWithFIM: '仅适用于 FIM 模型。*',
		fimModelRecommendation: '我们建议您使用 Ollama 支持的最大 qwen2.5-coder 模型（尝试 qwen2.5-coder:3b）。',

		// Settings 应用方法
		outputSearchReplace: '输出搜索/替换块',
		rewriteWholeFiles: '重写整个文件',

		// Settings 刷新模型
		modelsAreUpToDate: '{0} 模型已是最新！',
		providerNotFound: '未找到 {0}！',
		manuallyRefreshModels: '手动刷新 {0} 模型。',
		refresh: '刷新',
		refreshMCP: '刷新MCP服务器并更新环境变量',

		// ModelDropdown
		noModelsAvailable: '无可用模型',
		noServersFound: '未找到服务器',
		noToolsAvailable: '无可用工具',
		enableAModel: '启用模型',
		providerRequired: '需要提供商',

		// Auto-approve
		autoApprove: '自动批准 {0}',

		// Transfer
		transferring: '传输中',
		transferFrom: '从 {0} 传输',
		settingsTransferred: '设置已传输',
		command: '命令:',

		// AI Instructions
		aiInstructionsDesc: '包含在所有 AI 请求中的系统指令。\n或者，在工作区根目录放置 `.voidrules` 文件。',

		// Warning
		pleaseAddModel: '请为 {0} 添加模型（模型部分）。',

		// JSON Debug
		showJsonDebug: '显示 JSON 调试',

		// Reset Visible On Send
		resetVisibleOnSend: '发送新消息时自动折叠消息',
		resetVisibleOnSendDesc: '发送新消息时，折叠为只显示最后一页的消息，适合低内存设备。',

		// Show All History Threads
		showAllHistoryThreads: '显示所有历史会话',
		showAllHistoryThreadsDesc: '开启后显示所有项目的历史会话，关闭则只显示当前项目的会话。',

		// Developer Mode
		developerMode: '开发者模式',
		developerModeDesc: '用于调试和故障排查的开发者工具。',
		enableMarkdownCache: '启用 Markdown 聊天缓存',
		enableMarkdownCacheDesc: '缓存已解析的 Markdown tokens 以提高切换会话时的性能。',
		enableMarkdownCacheRestart: '需要重启生效',

		// Default Language
		defaultLanguageDesc: '开发模式CoderChat界面语言。修改后需要重启生效。',
		defaultLanguageAuto: '自动（跟随系统）',
		defaultLanguageEn: '英文',
		defaultLanguageZh: '中文',

		// Assistant reply count
		assistantReply: '第 {0} 次回复',

		// User message count
		userReply: '第 {0} 条消息',

		// Message creation time
		messageCreatedAt: '{0}',

		// LLM request duration
		llmRequestDuration: '响应时间',

		// 输入历史
		inputHistoryTitle: '输入历史',
		scrollToBottom: '跳转底部最新消息',

		// 菜单
		menuTitle: '菜单',

		// 提示弹窗
		alertDialogTitle: '提示',
		alertDialogFeatureNotReady: '功能开发中，敬请期待！',
		alertDialogConfirm: '确定',

		// 导出会话
		exportChatTitle: '导出会话',
		exportChatNoThread: '没有活动的会话可导出',
		exportChatNoMessages: '当前会话没有消息',
		exportChatNoData: '获取会话数据失败',
		exportChatDefaultTitle: '会话',
		exportChatMarkdownTitle: '导出会话为Markdown',
		exportChatMarkdownSuccess: '会话导出成功',
		exportChatSuccess: '会话导出成功',

		// 导入会话
		importChatTitle: '导入会话',
		importChatSuccess: '会话导入成功，已切换到导入的会话',
		importChatReadError: '读取会话文件失败',
		importChatParseError: '解析会话数据失败',
		importChatInvalidData: '会话数据格式无效',

		// 复制会话
		menuCopyChat: '复制会话',
		copyChatNoThread: '没有活动的会话可复制',
		copyChatNoMessages: '当前会话没有消息',
		copyChatNoData: '获取会话数据失败',
		copyChatSuccess: '会话复制成功，已切换到复制的会话',

		// 导出会话菜单
		menuExportChat: '会话导出',
		menuExportAsMarkdown: '导出会话为Markdown',
		menuExportAsChatshare: '导出会话为.chatshare文件',
		menuImportChat: '导入会话',

		// 渐进式渲染
		loading: '加载中...',
		loadMoreMessages: '加载更多 {0} 条消息',

		// Gather mode confirmation
		gatherModeTaskComplete: '切换到智能体模式开始执行计划？',
		gatherModeTaskCompleteDesc: '是否切换到智能体模式开始执行计划？若计划未完成可忽略本提示。',
		gatherModeSwitchToAgent: '执行计划',
		gatherModeContinueGather: '继续计划',

		// Workspace check
		workspaceCheckTitle: '未打开工作空间文件夹',
		workspaceCheckDesc: '体验更全面的AI功能，请打开一个工作空间文件夹。',
		workspaceCheckOpen: '打开文件夹',
		workspaceCheckIgnore: '忽略',

		// Response Language
		responseLanguage: '回复语言',
		responseLanguageDesc: 'AI回复使用的语言。选择特定语言或让AI自动检测。',
		responseLanguagePromptDesc: '指示AI使用选定语言回复的提示词文本，可根据需要自定义。',
		responseLanguageAuto: '自动（跟随对话）',
		responseLanguageZh: '中文',
		responseLanguageEn: '英文',
		responseLanguageJa: '日语',
		responseLanguageKo: '韩语',
		responseLanguageFr: '法语',
		responseLanguageDe: '德语',
		responseLanguageEs: '西班牙语',
		responseLanguageRu: '俄语',
		responseLanguagePt: '葡萄牙语',

		// Onboarding - Language Selection
		onboardingLanguageTitle: '你希望用什么语言和AI交流？',
		onboardingLanguageDesc: '选择AI回复使用的语言。之后可以在设置中更改。',

		// Provider 展开/折叠
		expandProviders: '展开更多 {0} 个提供商',
		collapseProviders: '收起 {0} 个提供商',
	},
} as const

type Messages = typeof defaultMessages.en
type LangKey = 'en' | 'zh'

/**
 * 获取当前语言的默认消息
 * 如果当前语言的翻译不存在，则回退到英文
 */
function getDefaultMessage<K extends keyof Messages>(key: K): string {
	const lang = resolveLang()
	const messages = defaultMessages[lang as LangKey]
	// 检查当前语言是否有该 key，如果没有则回退到英文
	if (key in messages) {
		return messages[key as keyof typeof messages]
	}
	// fallback 到英文
	return defaultMessages.en[key]
}

/**
 * Void Chat 组件的国际化字符串
 * 所有需要在 React 组件中显示的文本都应该在这里定义
 * 通过修改 DEFAULT_LANG 变量来控制默认语言
 */
const voidChatI18n = {
	// 侧边栏标题
	chatTitle: () => localize('void.chatTitle', getDefaultMessage('chatTitle')),

	// 思考/推理相关
	reasoning: () => localize('void.reasoning', getDefaultMessage('reasoning')),
	reasoningDisabled: () => localize('void.reasoningDisabled', getDefaultMessage('reasoningDisabled')),
	deepThinking: () => localize('void.deepThinking', getDefaultMessage('deepThinking')),
	expand: () => localize('void.expand', getDefaultMessage('expand')),

	// 聊天模式相关
	chatModeNormal: () => localize('void.chatModeNormal', getDefaultMessage('chatModeNormal')),
	chatModeGather: () => localize('void.chatModeGather', getDefaultMessage('chatModeGather')),
	chatModeAgent: () => localize('void.chatModeAgent', getDefaultMessage('chatModeAgent')),

	// 图片相关
	uploadImageTitle: () => localize('void.uploadImageTitle', getDefaultMessage('uploadImageTitle')),
	dropImagePlaceholder: () => localize('void.dropImagePlaceholder', getDefaultMessage('dropImagePlaceholder')),
	imageAlt: () => localize('void.imageAlt', getDefaultMessage('imageAlt')),
	imageMessage: () => localize('void.imageMessage', getDefaultMessage('imageMessage')),

	// 工具执行相关
	toolError: () => localize('void.toolError', getDefaultMessage('toolError')),
	toolCancelled: () => localize('void.toolCancelled', getDefaultMessage('toolCancelled')),

	// 文件相关
	currentFile: () => localize('void.currentFile', getDefaultMessage('currentFile')),

	// 结果相关
	resultsCount: (count: number, hasMore: boolean) =>
		localize('void.resultsCount', getDefaultMessage('resultsCount'), count, hasMore ? '+' : ''),

	// 错误相关
	lintErrors: () => localize('void.lintErrors', getDefaultMessage('lintErrors')),
	error: () => localize('void.error', getDefaultMessage('error')),
	lineRange: (start: number, end: number) =>
		localize('void.lineRange', getDefaultMessage('lineRange'), start, end),

	// 占位符
	editMessagePlaceholder: () => localize('void.editMessagePlaceholder', getDefaultMessage('editMessagePlaceholder')),

	// 工具状态 - 完成状态
	toolReadFileDone: () => localize('void.toolReadFileDone', getDefaultMessage('toolReadFileDone')),
	toolLsDirDone: () => localize('void.toolLsDirDone', getDefaultMessage('toolLsDirDone')),
	toolGetDirTreeDone: () => localize('void.toolGetDirTreeDone', getDefaultMessage('toolGetDirTreeDone')),
	toolSearchPathnamesDone: () => localize('void.toolSearchPathnamesDone', getDefaultMessage('toolSearchPathnamesDone')),
	toolSearchForFilesDone: () => localize('void.toolSearchForFilesDone', getDefaultMessage('toolSearchForFilesDone')),
	toolCreateFileOrFolderDone: () => localize('void.toolCreateFileOrFolderDone', getDefaultMessage('toolCreateFileOrFolderDone')),
	toolDeleteFileOrFolderDone: () => localize('void.toolDeleteFileOrFolderDone', getDefaultMessage('toolDeleteFileOrFolderDone')),
	toolEditFileDone: () => localize('void.toolEditFileDone', getDefaultMessage('toolEditFileDone')),
	toolRewriteFileDone: () => localize('void.toolRewriteFileDone', getDefaultMessage('toolRewriteFileDone')),
	toolRunCommandDone: () => localize('void.toolRunCommandDone', getDefaultMessage('toolRunCommandDone')),

	// 工具状态 - web_fetch
	toolWebFetchDone: () => localize('void.toolWebFetchDone', getDefaultMessage('toolWebFetchDone')),
	toolWebFetchProposed: () => localize('void.toolWebFetchProposed', getDefaultMessage('toolWebFetchProposed')),
	toolWebFetchRunning: () => localize('void.toolWebFetchRunning', getDefaultMessage('toolWebFetchRunning')),

	// 工具状态 - ask_user_question
	toolAskUserQuestionDone: () => localize('void.toolAskUserQuestionDone', getDefaultMessage('toolAskUserQuestionDone')),
	toolAskUserQuestionProposed: () => localize('void.toolAskUserQuestionProposed', getDefaultMessage('toolAskUserQuestionProposed')),
	toolAskUserQuestionRunning: () => localize('void.toolAskUserQuestionRunning', getDefaultMessage('toolAskUserQuestionRunning')),

	// 工具状态 - 提议状态
	toolReadFileProposed: () => localize('void.toolReadFileProposed', getDefaultMessage('toolReadFileProposed')),
	toolLsDirProposed: () => localize('void.toolLsDirProposed', getDefaultMessage('toolLsDirProposed')),
	toolGetDirTreeProposed: () => localize('void.toolGetDirTreeProposed', getDefaultMessage('toolGetDirTreeProposed')),
	toolSearchPathnamesProposed: () => localize('void.toolSearchPathnamesProposed', getDefaultMessage('toolSearchPathnamesProposed')),
	toolSearchForFilesProposed: () => localize('void.toolSearchForFilesProposed', getDefaultMessage('toolSearchForFilesProposed')),
	toolCreateFileOrFolderProposed: () => localize('void.toolCreateFileOrFolderProposed', getDefaultMessage('toolCreateFileOrFolderProposed')),
	toolDeleteFileOrFolderProposed: () => localize('void.toolDeleteFileOrFolderProposed', getDefaultMessage('toolDeleteFileOrFolderProposed')),
	toolEditFileProposed: () => localize('void.toolEditFileProposed', getDefaultMessage('toolEditFileProposed')),
	toolRewriteFileProposed: () => localize('void.toolRewriteFileProposed', getDefaultMessage('toolRewriteFileProposed')),
	toolRunCommandProposed: () => localize('void.toolRunCommandProposed', getDefaultMessage('toolRunCommandProposed')),

	// 工具状态 - 运行中状态
	toolReadFileRunning: (action: string) => localize('void.toolReadFileRunning', getDefaultMessage('toolReadFileRunning')),
	toolLsDirRunning: (action: string) => localize('void.toolLsDirRunning', getDefaultMessage('toolLsDirRunning')),
	toolGetDirTreeRunning: (action: string) => localize('void.toolGetDirTreeRunning', getDefaultMessage('toolGetDirTreeRunning')),
	toolSearchPathnamesRunning: (action: string) => localize('void.toolSearchPathnamesRunning', getDefaultMessage('toolSearchPathnamesRunning')),
	toolSearchForFilesRunning: (action: string) => localize('void.toolSearchForFilesRunning', getDefaultMessage('toolSearchForFilesRunning')),
	toolCreateFileOrFolderRunning: (action: string) => localize('void.toolCreateFileOrFolderRunning', getDefaultMessage('toolCreateFileOrFolderRunning')),
	toolDeleteFileOrFolderRunning: (action: string) => localize('void.toolDeleteFileOrFolderRunning', getDefaultMessage('toolDeleteFileOrFolderRunning')),
	toolEditFileRunning: (action: string) => localize('void.toolEditFileRunning', getDefaultMessage('toolEditFileRunning')),
	toolRewriteFileRunning: (action: string) => localize('void.toolRewriteFileRunning', getDefaultMessage('toolRewriteFileRunning')),
	toolRunCommandRunning: (action: string) => localize('void.toolRunCommandRunning', getDefaultMessage('toolRunCommandRunning')),

	// 工具别名
	toolNameReadFile: () => localize('void.toolNameReadFile', getDefaultMessage('toolNameReadFile')),
	toolNameLsDir: () => localize('void.toolNameLsDir', getDefaultMessage('toolNameLsDir')),
	toolNameGetDirTree: () => localize('void.toolNameGetDirTree', getDefaultMessage('toolNameGetDirTree')),
	toolNameSearchPathnamesOnly: () => localize('void.toolNameSearchPathnamesOnly', getDefaultMessage('toolNameSearchPathnamesOnly')),
	toolNameSearchForFiles: () => localize('void.toolNameSearchForFiles', getDefaultMessage('toolNameSearchForFiles')),
	toolNameSearchInFile: () => localize('void.toolNameSearchInFile', getDefaultMessage('toolNameSearchInFile')),
	toolNameReadLintErrors: () => localize('void.toolNameReadLintErrors', getDefaultMessage('toolNameReadLintErrors')),
	toolNameCreateFileOrFolder: () => localize('void.toolNameCreateFileOrFolder', getDefaultMessage('toolNameCreateFileOrFolder')),
	toolNameDeleteFileOrFolder: () => localize('void.toolNameDeleteFileOrFolder', getDefaultMessage('toolNameDeleteFileOrFolder')),
	toolNameEditFile: () => localize('void.toolNameEditFile', getDefaultMessage('toolNameEditFile')),
	toolNameRewriteFile: () => localize('void.toolNameRewriteFile', getDefaultMessage('toolNameRewriteFile')),
	toolNameRunCommand: () => localize('void.toolNameRunCommand', getDefaultMessage('toolNameRunCommand')),
	toolNameRunPersistentCommand: () => localize('void.toolNameRunPersistentCommand', getDefaultMessage('toolNameRunPersistentCommand')),
	toolNameOpenPersistentTerminal: () => localize('void.toolNameOpenPersistentTerminal', getDefaultMessage('toolNameOpenPersistentTerminal')),
	toolNameKillPersistentTerminal: () => localize('void.toolNameKillPersistentTerminal', getDefaultMessage('toolNameKillPersistentTerminal')),
	toolNameXmlEscape: () => localize('void.toolNameXmlEscape', getDefaultMessage('toolNameXmlEscape')),
	toolNameAskUserQuestion: () => localize('void.toolNameAskUserQuestion', getDefaultMessage('toolNameAskUserQuestion')),
	toolNameWebFetch: () => localize('void.toolNameWebFetch', getDefaultMessage('toolNameWebFetch')),
	toolNameTodoWrite: () => localize('void.toolNameTodoWrite', getDefaultMessage('toolNameTodoWrite')),
	toolNameTodoRead: () => localize('void.toolNameTodoRead', getDefaultMessage('toolNameTodoRead')),
	toolNameSleepWait: () => localize('void.toolNameSleepWait', getDefaultMessage('toolNameSleepWait')),
	toolNameSkill: () => localize('void.toolNameSkill', getDefaultMessage('toolNameSkill')),
	toolNameNoTools: () => localize('void.toolNameNoTools', getDefaultMessage('toolNameNoTools')),

	// 用户问题相关
	userRefusedToAnswer: () => localize('void.userRefusedToAnswer', getDefaultMessage('userRefusedToAnswer')),
	needYourAnswer: () => localize('void.needYourAnswer', getDefaultMessage('needYourAnswer')),
	multiSelectHint: () => localize('void.multiSelectHint', getDefaultMessage('multiSelectHint')),
	singleSelectHint: () => localize('void.singleSelectHint', getDefaultMessage('singleSelectHint')),
	otherOption: () => localize('void.otherOption', getDefaultMessage('otherOption')),
	customAnswerPlaceholder: () => localize('void.customAnswerPlaceholder', getDefaultMessage('customAnswerPlaceholder')),
	submit: () => localize('void.submit', getDefaultMessage('submit')),
	cancel: () => localize('void.cancel', getDefaultMessage('cancel')),
	approve: () => localize('void.approve', getDefaultMessage('approve')),
	autoApproveDesc: (type: string) => localize('void.autoApproveDesc', getDefaultMessage('autoApproveDesc'), type),
	invalidParams: () => localize('void.invalidParams', getDefaultMessage('invalidParams')),
	copy: () => localize('void.copy', getDefaultMessage('copy')),
	copyToClipboard: () => localize('void.copyToClipboard', getDefaultMessage('copyToClipboard')),
	copyInput: (params: string) => localize('void.copyInput', getDefaultMessage('copyInput'), params),
	copyJson: () => localize('void.copyJson', getDefaultMessage('copyJson')),
	mcpToolNotFound: () => localize('void.mcpToolNotFound', getDefaultMessage('mcpToolNotFound')),
	truncatedAfter: (size: string) => localize('void.truncatedAfter', getDefaultMessage('truncatedAfter'), size),
	searchOnlyIn: (path: string) => localize('void.searchOnlyIn', getDefaultMessage('searchOnlyIn'), path),
	resultsTruncated: () => localize('void.resultsTruncated', getDefaultMessage('resultsTruncated')),
	resultsTruncatedRemaining: (count: number) => localize('void.resultsTruncatedRemaining', getDefaultMessage('resultsTruncatedRemaining'), count),
	running: () => localize('void.running', getDefaultMessage('running')),
	completed: () => localize('void.completed', getDefaultMessage('completed')),
	awaitingApproval: () => localize('void.awaitingApproval', getDefaultMessage('awaitingApproval')),
	waitingForReply: () => localize('void.waitingForReply', getDefaultMessage('waitingForReply')),
	useRegexSearch: () => localize('void.useRegexSearch', getDefaultMessage('useRegexSearch')),
	noLintErrors: () => localize('void.noLintErrors', getDefaultMessage('noLintErrors')),
	runningIn: (path: string) => localize('void.runningIn', getDefaultMessage('runningIn'), path),
	escapedResult: () => localize('void.escapedResult', getDefaultMessage('escapedResult')),
	escapeSuccess: (escaped: number, original: number, escapedLen: number) =>
		localize('void.escapeSuccess', getDefaultMessage('escapeSuccess'), escaped, original, escapedLen),
	userAnswered: () => localize('void.userAnswered', getDefaultMessage('userAnswered')),
	checkpoint: () => localize('void.checkpoint', getDefaultMessage('checkpoint')),
	system: () => localize('void.system', getDefaultMessage('system')),
	noFilesChanged: () => localize('void.noFilesChanged', getDefaultMessage('noFilesChanged')),
	filesChanged: (count: number) => localize('void.filesChanged', getDefaultMessage('filesChanged'), count),
	rejectAll: () => localize('void.rejectAll', getDefaultMessage('rejectAll')),
	acceptAll: () => localize('void.acceptAll', getDefaultMessage('acceptAll')),
	rejectFile: () => localize('void.rejectFile', getDefaultMessage('rejectFile')),
	acceptFile: () => localize('void.acceptFile', getDefaultMessage('acceptFile')),
	changesInFile: (count: number) => localize('void.changesInFile', getDefaultMessage('changesInFile'), count),
	fullError: () => localize('void.fullError', getDefaultMessage('fullError')),
	disabledBecauseAnotherRunning: () => localize('void.disabledBecauseAnotherRunning', getDefaultMessage('disabledBecauseAnotherRunning')),

	// Todo 工具
	toolTodoWriteDone: () => localize('void.toolTodoWriteDone', getDefaultMessage('toolTodoWriteDone')),
	toolTodoWriteProposed: () => localize('void.toolTodoWriteProposed', getDefaultMessage('toolTodoWriteProposed')),
	toolTodoWriteRunning: () => localize('void.toolTodoWriteRunning', getDefaultMessage('toolTodoWriteRunning')),
	toolTodoReadDone: () => localize('void.toolTodoReadDone', getDefaultMessage('toolTodoReadDone')),
	toolTodoReadProposed: () => localize('void.toolTodoReadProposed', getDefaultMessage('toolTodoReadProposed')),
	toolTodoReadRunning: () => localize('void.toolTodoReadRunning', getDefaultMessage('toolTodoReadRunning')),

	// Sleep 工具
	toolSleepWaitDone: () => localize('void.toolSleepWaitDone', getDefaultMessage('toolSleepWaitDone')),
	toolSleepWaitProposed: () => localize('void.toolSleepWaitProposed', getDefaultMessage('toolSleepWaitProposed')),
	toolSleepWaitRunning: () => localize('void.toolSleepWaitRunning', getDefaultMessage('toolSleepWaitRunning')),

	// Skill 工具
	toolSkillDone: () => localize('void.toolSkillDone', getDefaultMessage('toolSkillDone')),
	toolSkillProposed: () => localize('void.toolSkillProposed', getDefaultMessage('toolSkillProposed')),
	toolSkillRunning: () => localize('void.toolSkillRunning', getDefaultMessage('toolSkillRunning')),
	skillNotFound: () => localize('void.skillNotFound', getDefaultMessage('skillNotFound')),
	skillContent: () => localize('void.skillContent', getDefaultMessage('skillContent')),

	// Todo 界面
	todoList: () => localize('void.todoList', getDefaultMessage('todoList')),
	todoPending: () => localize('void.todoPending', getDefaultMessage('todoPending')),
	todoInProgress: () => localize('void.todoInProgress', getDefaultMessage('todoInProgress')),
	todoCompleted: () => localize('void.todoCompleted', getDefaultMessage('todoCompleted')),
	todoFailed: () => localize('void.todoFailed', getDefaultMessage('todoFailed')),
	todoPriorityHigh: () => localize('void.todoPriorityHigh', getDefaultMessage('todoPriorityHigh')),
	todoPriorityMedium: () => localize('void.todoPriorityMedium', getDefaultMessage('todoPriorityMedium')),
	todoPriorityLow: () => localize('void.todoPriorityLow', getDefaultMessage('todoPriorityLow')),
	todoNoTasks: () => localize('void.todoNoTasks', getDefaultMessage('todoNoTasks')),
	todoTaskCount: (count: string) => localize('void.todoTaskCount', getDefaultMessage('todoTaskCount'), count),
	todoTaskStats: (total: number, completed: number) => localize('void.todoTaskStats', getDefaultMessage('todoTaskStats'), total, completed),
	waitedSeconds: (seconds: number) => localize('void.waitedSeconds', getDefaultMessage('waitedSeconds'), seconds),
	skipWait: () => localize('void.skipWait', getDefaultMessage('skipWait')),
	waitSkipped: (seconds: number) => localize('void.waitSkipped', getDefaultMessage('waitSkipped'), seconds),

	// 生成相关
	generating: () => localize('void.generating', getDefaultMessage('generating')),

	// 设置相关
	openSettings: () => localize('void.openSettings', getDefaultMessage('openSettings')),

	// 输入框占位符
	inputPlaceholder: () => localize('void.inputPlaceholder', getDefaultMessage('inputPlaceholder')),
	inputPlaceholderWithKey: (key: string) => localize('void.inputPlaceholderWithKey', getDefaultMessage('inputPlaceholderWithKey'), key),

	// 建议提示
	suggestedPrompt1: () => localize('void.suggestedPrompt1', getDefaultMessage('suggestedPrompt1')),
	suggestedPrompt2: () => localize('void.suggestedPrompt2', getDefaultMessage('suggestedPrompt2')),
	suggestedPrompt3: () => localize('void.suggestedPrompt3', getDefaultMessage('suggestedPrompt3')),

	// 线程列表
	previousThreads: () => localize('void.previousThreads', getDefaultMessage('previousThreads')),
	suggestions: () => localize('void.suggestions', getDefaultMessage('suggestions')),

	// 聊天模式名称
	chatModeNameChat: () => localize('void.chatModeNameChat', getDefaultMessage('chatModeNameChat')),
	chatModeNameGather: () => localize('void.chatModeNameGather', getDefaultMessage('chatModeNameGather')),
	chatModeNameAgent: () => localize('void.chatModeNameAgent', getDefaultMessage('chatModeNameAgent')),

	// 分页
	partPage: (page: number) => localize('void.partPage', getDefaultMessage('partPage'), page),

	// 下拉筛选
	enterTextToFilter: () => localize('void.enterTextToFilter', getDefaultMessage('enterTextToFilter')),
	noResultsFound: () => localize('void.noResultsFound', getDefaultMessage('noResultsFound')),

	// Diff编辑器
	noChangesFound: () => localize('void.noChangesFound', getDefaultMessage('noChangesFound')),
	showInlineViewOnly: () => localize('void.showInlineViewOnly', getDefaultMessage('showInlineViewOnly')),

	// 日期
	today: () => localize('void.today', getDefaultMessage('today')),
	yesterday: () => localize('void.yesterday', getDefaultMessage('yesterday')),

	// 线程操作
	duplicateThread: () => localize('void.duplicateThread', getDefaultMessage('duplicateThread')),
	deleteThread: () => localize('void.deleteThread', getDefaultMessage('deleteThread')),
	confirm: () => localize('void.confirm', getDefaultMessage('confirm')),
	errorAccessingChatHistory: () => localize('void.errorAccessingChatHistory', getDefaultMessage('errorAccessingChatHistory')),
	showMore: (count: number) => localize('void.showMore', getDefaultMessage('showMore'), count),
	showLess: () => localize('void.showLess', getDefaultMessage('showLess')),
	messagesCount: (count: number) => localize('void.messagesCount', getDefaultMessage('messagesCount'), count),

	// 复制按钮状态
	copyIdle: () => localize('void.copyIdle', getDefaultMessage('copyIdle')),
	copyCopied: () => localize('void.copyCopied', getDefaultMessage('copyCopied')),
	copyError: () => localize('void.copyError', getDefaultMessage('copyError')),

	// 应用块操作
	goToFile: () => localize('void.goToFile', getDefaultMessage('goToFile')),
	done: () => localize('void.done', getDefaultMessage('done')),
	applying: () => localize('void.applying', getDefaultMessage('applying')),
	stop: () => localize('void.stop', getDefaultMessage('stop')),
	applyAction: () => localize('void.applyAction', getDefaultMessage('applyAction')),
	remove: () => localize('void.remove', getDefaultMessage('remove')),
	keep: () => localize('void.keep', getDefaultMessage('keep')),

	// Diff 导航
	diffOf: (current: number, total: number) => localize('void.diffOf', getDefaultMessage('diffOf'), current, total),
	noChangesYet: () => localize('void.noChangesYet', getDefaultMessage('noChangesYet')),
	noChanges: () => localize('void.noChanges', getDefaultMessage('noChanges')),

	// Markdown 渲染
	unknownTokenRendered: () => localize('void.unknownTokenRendered', getDefaultMessage('unknownTokenRendered')),

	// 选区助手
	addToChat: () => localize('void.addToChat', getDefaultMessage('addToChat')),
	editInline: () => localize('void.editInline', getDefaultMessage('editInline')),
	disableSuggestions: () => localize('void.disableSuggestions', getDefaultMessage('disableSuggestions')),

	// 快速编辑
	enterInstructions: () => localize('void.enterInstructions', getDefaultMessage('enterInstructions')),

	// ======== Settings 界面 ========

	// Settings 标题
	settingsTitle: () => localize('void.settingsTitle', getDefaultMessage('settingsTitle')),
	seeOnboardingScreen: () => localize('void.seeOnboardingScreen', getDefaultMessage('seeOnboardingScreen')),
	models: () => localize('void.models', getDefaultMessage('models')),
	localProviders: () => localize('void.localProviders', getDefaultMessage('localProviders')),
	mainProviders: () => localize('void.mainProviders', getDefaultMessage('mainProviders')),
	compatibleApiProviders: () => localize('void.compatibleApiProviders', getDefaultMessage('compatibleApiProviders')),
	featureOptions: () => localize('void.featureOptions', getDefaultMessage('featureOptions')),
	tools: () => localize('void.tools', getDefaultMessage('tools')),
	mcpTools: () => localize('void.mcpTools', getDefaultMessage('mcpTools')),
	skills: () => localize('void.skills', getDefaultMessage('skills')),
	configuredSkills: () => localize('void.configuredSkills', getDefaultMessage('configuredSkills')),
	skillProject: () => localize('void.skillProject', getDefaultMessage('skillProject')),
	skillGlobal: () => localize('void.skillGlobal', getDefaultMessage('skillGlobal')),
	noSkillsAvailable: () => localize('void.noSkillsAvailable', getDefaultMessage('noSkillsAvailable')),
	addSkill: () => localize('void.addSkill', getDefaultMessage('addSkill')),
	selectSkillLevel: () => localize('void.selectSkillLevel', getDefaultMessage('selectSkillLevel')),
	selectZipFile: () => localize('void.selectZipFile', getDefaultMessage('selectZipFile')),
	skillsDesc: () => localize('void.skillsDesc', getDefaultMessage('skillsDesc')),
	skillProjectDesc: () => localize('void.skillProjectDesc', getDefaultMessage('skillProjectDesc')),
	skillGlobalDesc: () => localize('void.skillGlobalDesc', getDefaultMessage('skillGlobalDesc')),
	editSkill: () => localize('void.editSkill', getDefaultMessage('editSkill')),
	skillAddSuccess: () => localize('void.skillAddSuccess', getDefaultMessage('skillAddSuccess')),
	skillAddFailed: () => localize('void.skillAddFailed', getDefaultMessage('skillAddFailed')),
	skillDeleteSuccess: () => localize('void.skillDeleteSuccess', getDefaultMessage('skillDeleteSuccess')),
	skillDeleteFailed: () => localize('void.skillDeleteFailed', getDefaultMessage('skillDeleteFailed')),
	editor: () => localize('void.editor', getDefaultMessage('editor')),
	metrics: () => localize('void.metrics', getDefaultMessage('metrics')),
	aiInstructions: () => localize('void.aiInstructions', getDefaultMessage('aiInstructions')),
	mcp: () => localize('void.mcp', getDefaultMessage('mcp')),
	general: () => localize('void.general', getDefaultMessage('general')),
	allSettings: () => localize('void.allSettings', getDefaultMessage('allSettings')),
	oneClickSwitch: () => localize('void.oneClickSwitch', getDefaultMessage('oneClickSwitch')),
	importExport: () => localize('void.importExport', getDefaultMessage('importExport')),
	builtInSettings: () => localize('void.builtInSettings', getDefaultMessage('builtInSettings')),

	// Settings 描述
	localProvidersDesc: () => localize('void.localProvidersDesc', getDefaultMessage('localProvidersDesc')),
	mainProvidersDesc: () => localize('void.mainProvidersDesc', getDefaultMessage('mainProvidersDesc')),
	compatibleApiProvidersDesc: () => localize('void.compatibleApiProvidersDesc', getDefaultMessage('compatibleApiProvidersDesc')),
	applySettingsDesc: () => localize('void.applySettingsDesc', getDefaultMessage('applySettingsDesc')),
	toolsDesc: () => localize('void.toolsDesc', getDefaultMessage('toolsDesc')),
	editorSettingsDesc: () => localize('void.editorSettingsDesc', getDefaultMessage('editorSettingsDesc')),
	scmSettingsDesc: () => localize('void.scmSettingsDesc', getDefaultMessage('scmSettingsDesc')),
	metricsDesc: () => localize('void.metricsDesc', getDefaultMessage('metricsDesc')),
	oneClickSwitchDesc: () => localize('void.oneClickSwitchDesc', getDefaultMessage('oneClickSwitchDesc')),
	importExportDesc: () => localize('void.importExportDesc', getDefaultMessage('importExportDesc')),
	builtInSettingsDesc: () => localize('void.builtInSettingsDesc', getDefaultMessage('builtInSettingsDesc')),
	mcpDesc: () => localize('void.mcpDesc', getDefaultMessage('mcpDesc')),

	// Settings 操作
	addAModel: () => localize('void.addAModel', getDefaultMessage('addAModel')),
	modelName: () => localize('void.modelName', getDefaultMessage('modelName')),
	providerName: () => localize('void.providerName', getDefaultMessage('providerName')),
	pleaseSelectProvider: () => localize('void.pleaseSelectProvider', getDefaultMessage('pleaseSelectProvider')),
	pleaseEnterModelName: () => localize('void.pleaseEnterModelName', getDefaultMessage('pleaseEnterModelName')),
	modelAlreadyExists: () => localize('void.modelAlreadyExists', getDefaultMessage('modelAlreadyExists')),
	providerNotConfigured: (provider: string) => localize('void.providerNotConfigured', getDefaultMessage('providerNotConfigured'), provider),
	added: () => localize('void.added', getDefaultMessage('added')),
	overrideModelDefaults: () => localize('void.overrideModelDefaults', getDefaultMessage('overrideModelDefaults')),
	detectedLocally: () => localize('void.detectedLocally', getDefaultMessage('detectedLocally')),
	customModel: () => localize('void.customModel', getDefaultMessage('customModel')),
	advancedSettings: () => localize('void.advancedSettings', getDefaultMessage('advancedSettings')),
	delete: () => localize('void.delete', getDefaultMessage('delete')),
	showInDropdown: () => localize('void.showInDropdown', getDefaultMessage('showInDropdown')),
	hideFromDropdown: () => localize('void.hideFromDropdown', getDefaultMessage('hideFromDropdown')),
	addToEnable: (provider: string) => localize('void.addToEnable', getDefaultMessage('addToEnable'), provider),

	// Add Model Dialog
	addModelDialogTitle: () => localize('void.addModelDialogTitle', getDefaultMessage('addModelDialogTitle')),
	addModelDialogDesc: () => localize('void.addModelDialogDesc', getDefaultMessage('addModelDialogDesc')),
	advancedConfig: () => localize('void.advancedConfig', getDefaultMessage('advancedConfig')),
	advancedConfigDesc: () => localize('void.advancedConfigDesc', getDefaultMessage('advancedConfigDesc')),
	contextWindow: () => localize('void.contextWindow', getDefaultMessage('contextWindow')),
	contextWindowPlaceholder: () => localize('void.contextWindowPlaceholder', getDefaultMessage('contextWindowPlaceholder')),
	reservedOutputTokens: () => localize('void.reservedOutputTokens', getDefaultMessage('reservedOutputTokens')),
	reservedOutputTokensPlaceholder: () => localize('void.reservedOutputTokensPlaceholder', getDefaultMessage('reservedOutputTokensPlaceholder')),
	supportsSystemMessage: () => localize('void.supportsSystemMessage', getDefaultMessage('supportsSystemMessage')),
	supportsSystemMessageNone: () => localize('void.supportsSystemMessageNone', getDefaultMessage('supportsSystemMessageNone')),
	specialToolFormat: () => localize('void.specialToolFormat', getDefaultMessage('specialToolFormat')),
	specialToolFormatNone: () => localize('void.specialToolFormatNone', getDefaultMessage('specialToolFormatNone')),
	supportsVision: () => localize('void.supportsVision', getDefaultMessage('supportsVision')),
	supportsFIM: () => localize('void.supportsFIM', getDefaultMessage('supportsFIM')),
	reasoningCapabilities: () => localize('void.reasoningCapabilities', getDefaultMessage('reasoningCapabilities')),
	canTurnOffReasoning: () => localize('void.canTurnOffReasoning', getDefaultMessage('canTurnOffReasoning')),
	canIOReasoning: () => localize('void.canIOReasoning', getDefaultMessage('canIOReasoning')),
	basicConfig: () => localize('void.basicConfig', getDefaultMessage('basicConfig')),

	// Edit Model Dialog
	editModelDialogTitle: () => localize('void.editModelDialogTitle', getDefaultMessage('editModelDialogTitle')),
	editModelDialogDesc: () => localize('void.editModelDialogDesc', getDefaultMessage('editModelDialogDesc')),
	editModel: () => localize('void.editModel', getDefaultMessage('editModel')),
	resetToDefaults: () => localize('void.resetToDefaults', getDefaultMessage('resetToDefaults')),
	unrecognizedModel: () => localize('void.unrecognizedModel', getDefaultMessage('unrecognizedModel')),

	// Model config status
	systemDefault: () => localize('void.systemDefault', getDefaultMessage('systemDefault')),
	notSet: () => localize('void.notSet', getDefaultMessage('notSet')),

	// Settings 按钮
	importSettings: () => localize('void.importSettings', getDefaultMessage('importSettings')),
	exportSettings: () => localize('void.exportSettings', getDefaultMessage('exportSettings')),
	resetSettings: () => localize('void.resetSettings', getDefaultMessage('resetSettings')),
	importChats: () => localize('void.importChats', getDefaultMessage('importChats')),
	exportChats: () => localize('void.exportChats', getDefaultMessage('exportChats')),
	resetChats: () => localize('void.resetChats', getDefaultMessage('resetChats')),
	confirmReset: () => localize('void.confirmReset', getDefaultMessage('confirmReset')),
	generalSettings: () => localize('void.generalSettings', getDefaultMessage('generalSettings')),
	keyboardSettings: () => localize('void.keyboardSettings', getDefaultMessage('keyboardSettings')),
	themeSettings: () => localize('void.themeSettings', getDefaultMessage('themeSettings')),
	openLogs: () => localize('void.openLogs', getDefaultMessage('openLogs')),
	addMCPServer: () => localize('void.addMCPServer', getDefaultMessage('addMCPServer')),
	save: () => localize('void.save', getDefaultMessage('save')),

	// Settings 开关状态
	enabled: () => localize('void.enabled', getDefaultMessage('enabled')),
	disabled: () => localize('void.disabled', getDefaultMessage('disabled')),
	sameAsChatModel: () => localize('void.sameAsChatModel', getDefaultMessage('sameAsChatModel')),
	differentModel: () => localize('void.differentModel', getDefaultMessage('differentModel')),
	autoAcceptLLMChanges: () => localize('void.autoAcceptLLMChanges', getDefaultMessage('autoAcceptLLMChanges')),
	fixLintErrors: () => localize('void.fixLintErrors', getDefaultMessage('fixLintErrors')),
	showSuggestionsOnSelect: () => localize('void.showSuggestionsOnSelect', getDefaultMessage('showSuggestionsOnSelect')),
	optOutRequiresRestart: () => localize('void.optOutRequiresRestart', getDefaultMessage('optOutRequiresRestart')),
	disableSystemMessage: () => localize('void.disableSystemMessage', getDefaultMessage('disableSystemMessage')),
	disableSystemMessageDesc: () => localize('void.disableSystemMessageDesc', getDefaultMessage('disableSystemMessageDesc')),
	experimental: () => localize('void.experimental', getDefaultMessage('experimental')),
	onlyWorksWithFIM: () => localize('void.onlyWorksWithFIM', getDefaultMessage('onlyWorksWithFIM')),
	fimModelRecommendation: () => localize('void.fimModelRecommendation', getDefaultMessage('fimModelRecommendation')),

	// Settings 应用方法
	outputSearchReplace: () => localize('void.outputSearchReplace', getDefaultMessage('outputSearchReplace')),
	rewriteWholeFiles: () => localize('void.rewriteWholeFiles', getDefaultMessage('rewriteWholeFiles')),

	// Settings 刷新模型
	modelsAreUpToDate: (provider: string) => localize('void.modelsAreUpToDate', getDefaultMessage('modelsAreUpToDate'), provider),
	providerNotFound: (provider: string) => localize('void.providerNotFound', getDefaultMessage('providerNotFound'), provider),
	manuallyRefreshModels: (provider: string) => localize('void.manuallyRefreshModels', getDefaultMessage('manuallyRefreshModels'), provider),
	refresh: () => localize('void.refresh', getDefaultMessage('refresh')),
	refreshMCP: () => localize('void.refreshMCP', getDefaultMessage('refreshMCP')),

	// ModelDropdown
	noModelsAvailable: () => localize('void.noModelsAvailable', getDefaultMessage('noModelsAvailable')),
	noServersFound: () => localize('void.noServersFound', getDefaultMessage('noServersFound')),
	noToolsAvailable: () => localize('void.noToolsAvailable', getDefaultMessage('noToolsAvailable')),
	enableAModel: () => localize('void.enableAModel', getDefaultMessage('enableAModel')),
	providerRequired: () => localize('void.providerRequired', getDefaultMessage('providerRequired')),

	// Auto-approve
	autoApprove: (type: string) => localize('void.autoApprove', getDefaultMessage('autoApprove'), type),

	// Transfer
	transferring: () => localize('void.transferring', getDefaultMessage('transferring')),
	transferFrom: (editor: string) => localize('void.transferFrom', getDefaultMessage('transferFrom'), editor),
	settingsTransferred: () => localize('void.settingsTransferred', getDefaultMessage('settingsTransferred')),
	command: () => localize('void.command', getDefaultMessage('command')),

	// AI Instructions
	aiInstructionsDesc: () => localize('void.aiInstructionsDesc', getDefaultMessage('aiInstructionsDesc')),

	// Warning
	pleaseAddModel: (provider: string) => localize('void.pleaseAddModel', getDefaultMessage('pleaseAddModel'), provider),

	// JSON Debug
	showJsonDebug: () => localize('void.showJsonDebug', getDefaultMessage('showJsonDebug')),

	// Reset Visible On Send
	resetVisibleOnSend: () => localize('void.resetVisibleOnSend', getDefaultMessage('resetVisibleOnSend')),
	resetVisibleOnSendDesc: () => localize('void.resetVisibleOnSendDesc', getDefaultMessage('resetVisibleOnSendDesc')),

	// Show All History Threads
	showAllHistoryThreads: () => localize('void.showAllHistoryThreads', getDefaultMessage('showAllHistoryThreads')),
	showAllHistoryThreadsDesc: () => localize('void.showAllHistoryThreadsDesc', getDefaultMessage('showAllHistoryThreadsDesc')),

	// Developer Mode
	developerMode: () => localize('void.developerMode', getDefaultMessage('developerMode')),
	developerModeDesc: () => localize('void.developerModeDesc', getDefaultMessage('developerModeDesc')),
	enableMarkdownCache: () => localize('void.enableMarkdownCache', getDefaultMessage('enableMarkdownCache')),
	enableMarkdownCacheDesc: () => localize('void.enableMarkdownCacheDesc', getDefaultMessage('enableMarkdownCacheDesc')),
	enableMarkdownCacheRestart: () => localize('void.enableMarkdownCacheRestart', getDefaultMessage('enableMarkdownCacheRestart')),

	// Default Language
	defaultLanguageDesc: () => localize('void.defaultLanguageDesc', getDefaultMessage('defaultLanguageDesc')),
	defaultLanguageAuto: () => localize('void.defaultLanguageAuto', getDefaultMessage('defaultLanguageAuto')),
	defaultLanguageEn: () => localize('void.defaultLanguageEn', getDefaultMessage('defaultLanguageEn')),
	defaultLanguageZh: () => localize('void.defaultLanguageZh', getDefaultMessage('defaultLanguageZh')),

	// Assistant reply count
	assistantReply: (count: number) => localize('void.assistantReply', getDefaultMessage('assistantReply'), count),

	// User message count
	userReply: (count: number) => localize('void.userReply', getDefaultMessage('userReply'), count),

	// Message creation time
	messageCreatedAt: (time: string) => localize('void.messageCreatedAt', getDefaultMessage('messageCreatedAt'), time),

	// LLM request duration
	llmRequestDuration: () => localize('void.llmRequestDuration', getDefaultMessage('llmRequestDuration')),

	// 输入历史
	inputHistoryTitle: () => localize('void.inputHistoryTitle', getDefaultMessage('inputHistoryTitle')),
	scrollToBottom: () => localize('void.scrollToBottom', getDefaultMessage('scrollToBottom')),

	// 菜单
	menuTitle: () => localize('void.menuTitle', getDefaultMessage('menuTitle')),

	// 提示弹窗
	alertDialogTitle: () => localize('void.alertDialogTitle', getDefaultMessage('alertDialogTitle')),
	alertDialogFeatureNotReady: () => localize('void.alertDialogFeatureNotReady', getDefaultMessage('alertDialogFeatureNotReady')),
	alertDialogConfirm: () => localize('void.alertDialogConfirm', getDefaultMessage('alertDialogConfirm')),

	// 导出会话
	exportChatTitle: () => localize('void.exportChatTitle', getDefaultMessage('exportChatTitle')),
	exportChatNoThread: () => localize('void.exportChatNoThread', getDefaultMessage('exportChatNoThread')),
	exportChatNoMessages: () => localize('void.exportChatNoMessages', getDefaultMessage('exportChatNoMessages')),
	exportChatNoData: () => localize('void.exportChatNoData', getDefaultMessage('exportChatNoData')),
	exportChatDefaultTitle: () => localize('void.exportChatDefaultTitle', getDefaultMessage('exportChatDefaultTitle')),
	exportChatMarkdownTitle: () => localize('void.exportChatMarkdownTitle', getDefaultMessage('exportChatMarkdownTitle')),
	exportChatMarkdownSuccess: () => localize('void.exportChatMarkdownSuccess', getDefaultMessage('exportChatMarkdownSuccess')),
	exportChatSuccess: () => localize('void.exportChatSuccess', getDefaultMessage('exportChatSuccess')),

	// 导入会话
	importChatTitle: () => localize('void.importChatTitle', getDefaultMessage('importChatTitle')),
	importChatSuccess: () => localize('void.importChatSuccess', getDefaultMessage('importChatSuccess')),
	importChatReadError: () => localize('void.importChatReadError', getDefaultMessage('importChatReadError')),
	importChatParseError: () => localize('void.importChatParseError', getDefaultMessage('importChatParseError')),
	importChatInvalidData: () => localize('void.importChatInvalidData', getDefaultMessage('importChatInvalidData')),

	// 复制会话
	menuCopyChat: () => localize('void.menuCopyChat', getDefaultMessage('menuCopyChat')),
	copyChatNoThread: () => localize('void.copyChatNoThread', getDefaultMessage('copyChatNoThread')),
	copyChatNoMessages: () => localize('void.copyChatNoMessages', getDefaultMessage('copyChatNoMessages')),
	copyChatNoData: () => localize('void.copyChatNoData', getDefaultMessage('copyChatNoData')),
	copyChatSuccess: () => localize('void.copyChatSuccess', getDefaultMessage('copyChatSuccess')),

	// 导出会话菜单
	menuExportChat: () => localize('void.menuExportChat', getDefaultMessage('menuExportChat')),
	menuExportAsMarkdown: () => localize('void.menuExportAsMarkdown', getDefaultMessage('menuExportAsMarkdown')),
	menuExportAsChatshare: () => localize('void.menuExportAsChatshare', getDefaultMessage('menuExportAsChatshare')),
	menuImportChat: () => localize('void.menuImportChat', getDefaultMessage('menuImportChat')),

	// 渐进式渲染
	loading: () => localize('void.loading', getDefaultMessage('loading')),
	loadMoreMessages: (count: number) => localize('void.loadMoreMessages', getDefaultMessage('loadMoreMessages'), count),

	// Gather mode confirmation
	gatherModeTaskComplete: () => localize('void.gatherModeTaskComplete', getDefaultMessage('gatherModeTaskComplete')),
	gatherModeTaskCompleteDesc: () => localize('void.gatherModeTaskCompleteDesc', getDefaultMessage('gatherModeTaskCompleteDesc')),
	gatherModeSwitchToAgent: () => localize('void.gatherModeSwitchToAgent', getDefaultMessage('gatherModeSwitchToAgent')),
	gatherModeContinueGather: () => localize('void.gatherModeContinueGather', getDefaultMessage('gatherModeContinueGather')),

	// Workspace check
	workspaceCheckTitle: () => localize('void.workspaceCheckTitle', getDefaultMessage('workspaceCheckTitle')),
	workspaceCheckDesc: () => localize('void.workspaceCheckDesc', getDefaultMessage('workspaceCheckDesc')),
	workspaceCheckOpen: () => localize('void.workspaceCheckOpen', getDefaultMessage('workspaceCheckOpen')),
	workspaceCheckIgnore: () => localize('void.workspaceCheckIgnore', getDefaultMessage('workspaceCheckIgnore')),

	// Response Language
	responseLanguage: () => localize('void.responseLanguage', getDefaultMessage('responseLanguage')),
	responseLanguageDesc: () => localize('void.responseLanguageDesc', getDefaultMessage('responseLanguageDesc')),
	responseLanguagePromptDesc: () => localize('void.responseLanguagePromptDesc', getDefaultMessage('responseLanguagePromptDesc')),
	responseLanguageAuto: () => localize('void.responseLanguageAuto', getDefaultMessage('responseLanguageAuto')),
	responseLanguageZh: () => localize('void.responseLanguageZh', getDefaultMessage('responseLanguageZh')),
	responseLanguageEn: () => localize('void.responseLanguageEn', getDefaultMessage('responseLanguageEn')),
	responseLanguageJa: () => localize('void.responseLanguageJa', getDefaultMessage('responseLanguageJa')),
	responseLanguageKo: () => localize('void.responseLanguageKo', getDefaultMessage('responseLanguageKo')),
	responseLanguageFr: () => localize('void.responseLanguageFr', getDefaultMessage('responseLanguageFr')),
	responseLanguageDe: () => localize('void.responseLanguageDe', getDefaultMessage('responseLanguageDe')),
	responseLanguageEs: () => localize('void.responseLanguageEs', getDefaultMessage('responseLanguageEs')),
	responseLanguageRu: () => localize('void.responseLanguageRu', getDefaultMessage('responseLanguageRu')),
	responseLanguagePt: () => localize('void.responseLanguagePt', getDefaultMessage('responseLanguagePt')),

	// Onboarding - Language Selection
	onboardingLanguageTitle: () => localize('void.onboardingLanguageTitle', getDefaultMessage('onboardingLanguageTitle')),
	onboardingLanguageDesc: () => localize('void.onboardingLanguageDesc', getDefaultMessage('onboardingLanguageDesc')),

	// Provider 展开/折叠
	expandProviders: (count: number) => localize('void.expandProviders', getDefaultMessage('expandProviders'), count),
	collapseProviders: (count: number) => localize('void.collapseProviders', getDefaultMessage('collapseProviders'), count),
} as const

/**
 * React Hook - 在组件中使用国际化
 * 使用示例：
 *   const t = useVoidChatI18n()
 *   <span>{t.reasoning()}</span>
 */
export function useVoidChatI18n(): typeof voidChatI18n {
	return voidChatI18n
}
