/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as nls from '../../../../../../../nls.js'
import { getNLSLanguage } from '../../../../../../../nls.js'

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
 */
export const DEFAULT_LANG: 'auto' | 'en' | 'zh' = 'auto'

/**
 * 根据当前设置解析实际使用的语言
 */
function resolveLang(): 'en' | 'zh' {
	if (DEFAULT_LANG !== 'auto') {
		return DEFAULT_LANG
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
		// 思考/推理相关
		reasoning: 'Thinking',
		reasoningDisabled: 'Reasoning disabled',
		deepThinking: 'Deep thinking',

		// 聊天模式相关
		chatModeNormal: 'Normal conversation',
		chatModeGather: 'Read files only, cannot edit',
		chatModeAgent: 'Edit files and use tools',

		// 图片相关
		uploadImageTitle: 'Upload image',
		dropImagePlaceholder: 'Drop images here',
		imageAlt: 'Image',

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
		useRegexSearch: 'Use regex search',
		noLintErrors: 'No lint errors found',
		runningIn: 'Running in {0}',
		escapedResult: 'Escaped result',
		escapeSuccess: 'Successfully escaped {0} characters. Original length: {1}, Escaped length: {2}',
		userAnswered: 'User has answered',
		disabledWhileRunning: 'Disabled while running',
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

		// 生成相关
		generating: 'Generating',

		// 设置相关
		openSettings: 'Open settings',

		// 输入框占位符
		inputPlaceholder: '@ mention, type instructions...',
		inputPlaceholderWithKey: '@ mention, press {0} to add selection. Type instructions...',

		// 建议提示
		suggestedPrompt1: 'Summarize my codebase',
		suggestedPrompt2: 'How do types work in Rust?',
		suggestedPrompt3: 'Create a .voidrules file for me',

		// 线程列表
		previousThreads: 'Previous threads',
		suggestions: 'Suggestions',

		// 聊天模式名称
		chatModeNameChat: 'Chat',
		chatModeNameGather: 'Gather',
		chatModeNameAgent: 'Agent',

		// 分页
		partPage: '(part {0})',

		// 下拉筛选
		enterTextToFilter: 'Enter text to filter...',
		noResultsFound: 'No results found',

		// Diff编辑器
		noChangesFound: 'No changes found',

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
		featureOptions: 'Feature Options',
		tools: 'Tools',
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
		applySettingsDesc: 'Settings that control the behavior of the Apply button.',
		toolsDesc: 'Tools are functions that LLMs can call. Some tools require user approval.',
		editorSettingsDesc: 'Settings that control the visibility of CoderChat suggestions in the code editor.',
		scmSettingsDesc: 'Settings that control the behavior of the commit message generator.',
		metricsDesc: 'Very basic anonymous usage tracking helps us keep CoderChat running smoothly. You may opt out below. Regardless of this setting, CoderChat never sees your code, messages, or API keys.',
		oneClickSwitchDesc: 'Transfer your editor settings into CoderChat.',
		importExportDesc: "Transfer CoderChat's settings and chats in and out of CoderChat.",
		builtInSettingsDesc: 'IDE settings, keyboard settings, and theme customization.',
		mcpDesc: 'Use Model Context Protocol to provide Agent mode with more tools.',

		// Settings 操作
		addAModel: 'Add a model',
		modelName: 'Model Name',
		providerName: 'Provider Name',
		pleaseSelectProvider: 'Please select a provider.',
		pleaseEnterModelName: 'Please enter a model name.',
		modelAlreadyExists: 'This model already exists.',
		added: 'Added',
		overrideModelDefaults: 'Override model defaults',
		detectedLocally: 'Detected locally',
		customModel: 'Custom model',
		advancedSettings: 'Advanced Settings',
		delete: 'Delete',
		showInDropdown: 'Show in Dropdown',
		hideFromDropdown: 'Hide from Dropdown',
		addToEnable: 'Add {0} to enable',

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

		// Developer Mode
		developerMode: 'Developer Mode',
		developerModeDesc: 'Developer tools for debugging and troubleshooting.',
	},
	zh: {
		// 思考/推理相关
		reasoning: '思考中',
		reasoningDisabled: '推理已禁用',
		deepThinking: '深度思考',

		// 聊天模式相关
		chatModeNormal: '普通对话',
		chatModeGather: '仅读取文件，不可编辑',
		chatModeAgent: '编辑文件并使用工具',

		// 图片相关
		uploadImageTitle: '上传图片',
		dropImagePlaceholder: '拖放图片到这里',
		imageAlt: '图片',

		// 工具执行相关
		toolError: '工具执行错误',
		toolCancelled: '已取消',

		// 文件相关
		currentFile: '(当前文件)',

		// 结果相关
		resultsCount: '{0}{1} 个结果',

		// 错误相关
		lintErrors: '代码检查错误',
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
		useRegexSearch: '使用正则表达式搜索',
		noLintErrors: '未发现代码检查错误',
		runningIn: '在 {0} 中运行',
		escapedResult: '已转义结果',
		escapeSuccess: '成功转义 {0} 个字符。原始长度: {1}, 转义后长度: {2}',
		userAnswered: '用户已回答',
		disabledWhileRunning: '运行时禁用',
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

		// 生成相关
		generating: '生成中',

		// 设置相关
		openSettings: '打开设置',

		// 输入框占位符
		inputPlaceholder: '@ 提及，输入指令...',
		inputPlaceholderWithKey: '@ 提及，按 {0} 添加选区。输入指令...',

		// 建议提示
		suggestedPrompt1: '总结我的代码库',
		suggestedPrompt2: 'Rust 中的类型是如何工作的？',
		suggestedPrompt3: '为我创建一个 .voidrules 文件',

		// 线程列表
		previousThreads: '历史会话',
		suggestions: '建议',

		// 聊天模式名称
		chatModeNameChat: '聊天',
		chatModeNameGather: '问答',
		chatModeNameAgent: '智能体',

		// 分页
		partPage: '(第 {0} 部分)',

		// 下拉筛选
		enterTextToFilter: '输入文本以筛选...',
		noResultsFound: '未找到结果',

		// Diff编辑器
		noChangesFound: '未发现变更',

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
		featureOptions: '功能选项',
		tools: '工具',
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
		applySettingsDesc: '控制应用按钮行为的设置。',
		toolsDesc: '工具是 LLM 可以调用的函数。某些工具需要用户批准。',
		editorSettingsDesc: '控制 CoderChat 建议在代码编辑器中可见性的设置。',
		scmSettingsDesc: '控制提交消息生成器行为的设置。',
		metricsDesc: '非常基础的匿名使用跟踪帮助我们保持 CoderChat 顺畅运行。您可以在下方选择退出。无论此设置如何，CoderChat 永远不会看到您的代码、消息或 API 密钥。',
		oneClickSwitchDesc: '将您的编辑器设置转移到 CoderChat。',
		importExportDesc: '将 CoderChat 的设置和聊天导入导出 CoderChat。',
		builtInSettingsDesc: 'IDE 设置、键盘设置和主题定制。',
		mcpDesc: '使用模型上下文协议为代理模式提供更多工具。',

		// Settings 操作
		addAModel: '添加模型',
		modelName: '模型名称',
		providerName: '提供商名称',
		pleaseSelectProvider: '请选择一个提供商。',
		pleaseEnterModelName: '请输入模型名称。',
		modelAlreadyExists: '该模型已存在。',
		added: '已添加',
		overrideModelDefaults: '覆盖模型默认值',
		detectedLocally: '本地检测到',
		customModel: '自定义模型',
		advancedSettings: '高级设置',
		delete: '删除',
		showInDropdown: '在下拉菜单中显示',
		hideFromDropdown: '从下拉菜单中隐藏',
		addToEnable: '添加 {0} 以启用',

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
		fixLintErrors: '修复代码检查错误',
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

		// Developer Mode
		developerMode: '开发者模式',
		developerModeDesc: '用于调试和故障排查的开发者工具。',
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
	// 思考/推理相关
	reasoning: () => localize('void.reasoning', getDefaultMessage('reasoning')),
	reasoningDisabled: () => localize('void.reasoningDisabled', getDefaultMessage('reasoningDisabled')),
	deepThinking: () => localize('void.deepThinking', getDefaultMessage('deepThinking')),

	// 聊天模式相关
	chatModeNormal: () => localize('void.chatModeNormal', getDefaultMessage('chatModeNormal')),
	chatModeGather: () => localize('void.chatModeGather', getDefaultMessage('chatModeGather')),
	chatModeAgent: () => localize('void.chatModeAgent', getDefaultMessage('chatModeAgent')),

	// 图片相关
	uploadImageTitle: () => localize('void.uploadImageTitle', getDefaultMessage('uploadImageTitle')),
	dropImagePlaceholder: () => localize('void.dropImagePlaceholder', getDefaultMessage('dropImagePlaceholder')),
	imageAlt: () => localize('void.imageAlt', getDefaultMessage('imageAlt')),

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
	useRegexSearch: () => localize('void.useRegexSearch', getDefaultMessage('useRegexSearch')),
	noLintErrors: () => localize('void.noLintErrors', getDefaultMessage('noLintErrors')),
	runningIn: (path: string) => localize('void.runningIn', getDefaultMessage('runningIn'), path),
	escapedResult: () => localize('void.escapedResult', getDefaultMessage('escapedResult')),
	escapeSuccess: (escaped: number, original: number, escapedLen: number) =>
		localize('void.escapeSuccess', getDefaultMessage('escapeSuccess'), escaped, original, escapedLen),
	userAnswered: () => localize('void.userAnswered', getDefaultMessage('userAnswered')),
	disabledWhileRunning: () => localize('void.disabledWhileRunning', getDefaultMessage('disabledWhileRunning')),
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
	featureOptions: () => localize('void.featureOptions', getDefaultMessage('featureOptions')),
	tools: () => localize('void.tools', getDefaultMessage('tools')),
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
	added: () => localize('void.added', getDefaultMessage('added')),
	overrideModelDefaults: () => localize('void.overrideModelDefaults', getDefaultMessage('overrideModelDefaults')),
	detectedLocally: () => localize('void.detectedLocally', getDefaultMessage('detectedLocally')),
	customModel: () => localize('void.customModel', getDefaultMessage('customModel')),
	advancedSettings: () => localize('void.advancedSettings', getDefaultMessage('advancedSettings')),
	delete: () => localize('void.delete', getDefaultMessage('delete')),
	showInDropdown: () => localize('void.showInDropdown', getDefaultMessage('showInDropdown')),
	hideFromDropdown: () => localize('void.hideFromDropdown', getDefaultMessage('hideFromDropdown')),
	addToEnable: (provider: string) => localize('void.addToEnable', getDefaultMessage('addToEnable'), provider),

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

	// Developer Mode
	developerMode: () => localize('void.developerMode', getDefaultMessage('developerMode')),
	developerModeDesc: () => localize('void.developerModeDesc', getDefaultMessage('developerModeDesc')),
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
