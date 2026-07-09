/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ChatMessage, StagingSelectionItem } from '../chatThreadServiceTypes.js'
import type { TodoItem, LintErrorItem, ShallowDirectoryItem } from '../toolsServiceTypes.js'

/**
 * 格式化时长（毫秒）
 */
const formatDuration = (startTime: number | null, endTime: number | null): string => {
	if (startTime === null || endTime === null) return ''
	const durationMs = endTime - startTime
	if (durationMs < 1000) return `${durationMs}ms`
	if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`
	const minutes = Math.floor(durationMs / 60000)
	const seconds = Math.round((durationMs % 60000) / 1000)
	return `${minutes}m ${seconds}s`
}

/**
 * 获取选区项的显示文本
 */
const getSelectionDisplayText = (selection: StagingSelectionItem): string => {
	if (selection.type === 'File') {
		return selection.uri.fsPath
	} else if (selection.type === 'CodeSelection') {
		return `${selection.uri.fsPath} (lines ${selection.range[0]}-${selection.range[1]})`
	} else if (selection.type === 'Folder') {
		return selection.uri.fsPath
	}
	return ''
}

/**
 * 格式化 TodoItem 列表为 Markdown 表格
 */
const formatTodoTable = (todos: TodoItem[]): string => {
	const lines: string[] = []
	lines.push('| ID | Task | Status | Priority |')
	lines.push('|:---|:-----|:-------|:---------|')
	for (const todo of todos) {
		const statusEmoji = todo.status === 'completed' ? '✅'
			: todo.status === 'in_progress' ? '🔄'
				: todo.status === 'failed' ? '❌'
					: '⏳'
		const priorityText = todo.priority || '-'
		lines.push(`| ${todo.id.slice(0, 8)} | ${todo.task} | ${statusEmoji} ${todo.status} | ${priorityText} |`)
	}
	return lines.join('\n')
}

/**
 * 格式化目录列表为 Markdown 列表
 */
const formatDirectoryList = (children: ShallowDirectoryItem[], itemsRemaining: number): string => {
	const lines: string[] = []
	for (const child of children) {
		const icon = child.isDirectory ? '📁' : child.isSymbolicLink ? '🔗' : '📄'
		lines.push(`- ${icon} ${child.name}`)
	}
	if (itemsRemaining > 0) {
		lines.push(`- *... and ${itemsRemaining} more items*`)
	}
	return lines.join('\n')
}

/**
 * 格式化搜索结果为 Markdown 列表
 */
const formatSearchResults = (uris: Array<{ fsPath: string }>, hasNextPage: boolean): string => {
	const lines: string[] = []
	for (const uri of uris) {
		lines.push(`- ${uri.fsPath}`)
	}
	if (hasNextPage) {
		lines.push(`- *... more results*`)
	}
	return lines.join('\n')
}

/**
 * 格式化 lint 错误为 Markdown 表格
 */
const formatLintErrors = (lintErrors: LintErrorItem[]): string => {
	const lines: string[] = []
	lines.push('| Line | Code | Message |')
	lines.push('|:-----|:-----|:--------|')
	for (const error of lintErrors) {
		const lineRange = error.startLineNumber === error.endLineNumber
			? `${error.startLineNumber}`
			: `${error.startLineNumber}-${error.endLineNumber}`
		lines.push(`| ${lineRange} | ${error.code} | ${error.message} |`)
	}
	return lines.join('\n')
}

/**
 * 格式化文件内容读取结果
 */
const formatFileReadResult = (result: { fileContents: string; totalFileLen: number; totalNumLines: number; hasNextPage: boolean }): string => {
	const lines: string[] = []
	lines.push(`*${result.totalNumLines} lines, ${result.totalFileLen} characters*`)
	lines.push('')
	lines.push('<details>')
	lines.push('<summary>View file content</summary>')
	lines.push('')
	lines.push('```')
	lines.push(result.fileContents)
	if (result.hasNextPage) {
		lines.push('')
		lines.push('... (content truncated)')
	}
	lines.push('```')
	lines.push('')
	lines.push('</details>')
	return lines.join('\n')
}

/**
 * 格式化命令执行结果
 */
const formatCommandResult = (result: { result: string; resolveReason: { type: string; exitCode?: number } }): string => {
	const lines: string[] = []
	const reasonText = result.resolveReason.type === 'timeout' ? 'Timeout' : `Exit code: ${result.resolveReason.exitCode}`
	lines.push(`*${reasonText}*`)
	lines.push('')
	lines.push('<details>')
	lines.push('<summary>View output</summary>')
	lines.push('')
	lines.push('```shell')
	lines.push(result.result)
	lines.push('```')
	lines.push('')
	lines.push('</details>')
	return lines.join('\n')
}

/**
 * 格式化网页抓取结果
 */
const formatWebFetchResult = (result: { content: string; statusCode: number; url: string }): string => {
	const lines: string[] = []
	lines.push(`*Status: ${result.statusCode}*`)
	lines.push('')
	lines.push('<details>')
	lines.push('<summary>View content</summary>')
	lines.push('')
	lines.push(result.content)
	lines.push('')
	lines.push('</details>')
	return lines.join('\n')
}

/**
 * 格式化 sleep_wait 结果
 */
const formatSleepWaitResult = (result: { seconds: number; skipped: boolean }): string => {
	if (result.skipped) {
		return `*Wait skipped after ${result.seconds} seconds*`
	}
	return `*Waited ${result.seconds} seconds*`
}

/**
 * 格式化 search_in_file 结果
 */
const formatSearchInFileResult = (result: { lines: number[] }): string => {
	if (result.lines.length === 0) {
		return '*No matches found*'
	}
	return `*Found at lines: ${result.lines.join(', ')}*`
}

/**
 * 格式化 xml_escape 结果
 */
const formatXmlEscapeResult = (result: { escapedContent: string; originalLength: number; escapedLength: number; charactersEscaped: number }): string => {
	const lines: string[] = []
	lines.push(`*Escaped ${result.charactersEscaped} characters (original: ${result.originalLength}, escaped: ${result.escapedLength})*`)
	lines.push('')
	lines.push('<details>')
	lines.push('<summary>View escaped content</summary>')
	lines.push('')
	lines.push('```')
	lines.push(result.escapedContent)
	lines.push('```')
	lines.push('')
	lines.push('</details>')
	return lines.join('\n')
}

/**
 * 格式化 skill 结果
 */
const formatSkillResult = (result: { skillName: string; skillPath: string; skillContent: string; dirTree: { children: ShallowDirectoryItem[] | null; hasNextPage: boolean; hasPrevPage: boolean; itemsRemaining: number } }): string => {
	const lines: string[] = []

	// 显示 skill 名称和路径
	lines.push(`**Skill Name:** ${result.skillName}`)
	lines.push(`**Path:** ${result.skillPath}`)
	lines.push('')

	// 显示 skill 内容
	if (result.skillContent) {
		lines.push('<details>')
		lines.push('<summary>View skill content</summary>')
		lines.push('')
		lines.push('```markdown')
		lines.push(result.skillContent)
		lines.push('```')
		lines.push('')
		lines.push('</details>')
		lines.push('')
	}

	// 显示目录树
	if (result.dirTree.children && result.dirTree.children.length > 0) {
		lines.push('**Skill Files:**')
		lines.push('')
		lines.push(formatDirectoryList(result.dirTree.children, result.dirTree.itemsRemaining))
	}

	return lines.join('\n')
}

/**
 * 获取工具的显示名称和描述
 */
const getToolDisplayInfo = (toolMessage: ChatMessage & { role: 'tool' }): { name: string; desc: string } => {
	const name = toolMessage.name
	let desc = ''

	if (toolMessage.type !== 'invalid_params' && 'params' in toolMessage) {
		const params = toolMessage.params as Record<string, unknown>

		// 文件相关工具
		const uriValue = params.uri
		if (uriValue && typeof uriValue === 'object' && 'fsPath' in uriValue && 'scheme' in uriValue) {
			// URI-like object
			desc = (uriValue as { fsPath: string }).fsPath
		}

		// 搜索工具
		else if ('query' in params && typeof params.query === 'string') {
			desc = `"${params.query}"`
		}

		// 命令工具
		else if ('command' in params && typeof params.command === 'string') {
			desc = `"${params.command}"`
		}

		// URL 工具
		else if ('url' in params && typeof params.url === 'string') {
			desc = params.url
		}
	}

	return { name, desc }
}

/**
 * 将单条消息转换为 Markdown 格式
 */
const messageToMarkdown = (message: ChatMessage, messageIndex: number, totalMessages: number): string => {
	const lines: string[] = []

	if (message.role === 'system') {
		lines.push(`### System${message.title ? ` - ${message.title}` : ''}`)
		lines.push('')
		if (message.modelUsed) {
			lines.push(`**Model:** ${message.modelUsed}`)
			lines.push('')
		}
		lines.push('```')
		lines.push(message.systemContent)
		lines.push('```')
		lines.push('')
	}

	else if (message.role === 'user') {
		// 标题直接跟上消息内容
		if (message.displayContent) {
			lines.push(`### User: ${message.displayContent}`)
		} else {
			lines.push(`### User`)
		}
		lines.push('')

		// 选区
		if (message.selections && message.selections.length > 0) {
			lines.push('**Attached files/selections:**')
			lines.push('')
			for (const sel of message.selections) {
				lines.push(`- ${getSelectionDisplayText(sel)}`)
			}
			lines.push('')
		}

		// 图片
		if (message.images && message.images.length > 0) {
			lines.push('**Images:**')
			lines.push('')
			for (const img of message.images) {
				// 使用 HTML img 标签限制图片尺寸
				const dataUrl = `data:${img.mediaType};base64,${img.base64}`
				const altText = img.fileName || 'image'
				lines.push(`<img src="${dataUrl}" alt="${altText}" width="400" />`)
				lines.push('')
			}
		}
	}

	else if (message.role === 'assistant') {
		// 标题直接跟上消息内容
		if (message.displayContent) {
			lines.push(`### Assistant: ${message.displayContent}`)
		} else {
			lines.push(`### Assistant`)
		}
		lines.push('')

		// 推理/思考过程
		if (message.reasoning && message.reasoning.trim()) {
			lines.push('<details>')
			lines.push('<summary>Thinking Process</summary>')
			lines.push('')
			lines.push(message.reasoning)
			lines.push('')
			lines.push('</details>')
			lines.push('')
		}

		// 模型信息和响应时间放在同一行
		if (message.modelName || (message.startTime && message.endTime)) {
			const modelPart = message.modelName ? `**Model:** ${message.modelName}` : ''
			const timePart = message.startTime && message.endTime ? `**Response time:** ${formatDuration(message.startTime, message.endTime)}` : ''
			const separator = modelPart && timePart ? ' | ' : ''
			lines.push(`${modelPart}${separator}${timePart}`)
			lines.push('')
		}
	}

	else if (message.role === 'tool') {
		const { name, desc } = getToolDisplayInfo(message)

		const statusEmoji = message.type === 'success' ? '✅'
			: message.type === 'tool_error' ? '❌'
				: message.type === 'rejected' ? '⏹️'
					: message.type === 'running_now' ? '🔄'
						: '⏳'

		lines.push(`#### ${statusEmoji} Tool: \`${name}\``)
		lines.push('')

		if (desc) {
			lines.push(`**Target:** ${desc}`)
			lines.push('')
		}

		// 工具结果
		if (message.type === 'success' && message.result) {
			const result = message.result
			const toolName = message.name

			// todo_write 和 todo_read 使用表格展示
			if (toolName === 'todo_write' || toolName === 'todo_read') {
				const todoResult = result as { todos: TodoItem[] }
				if (todoResult.todos && Array.isArray(todoResult.todos)) {
					lines.push('**Result:**')
					lines.push('')
					lines.push(formatTodoTable(todoResult.todos))
					lines.push('')
				}
			}

			// read_file 显示文件内容
			else if (toolName === 'read_file') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatFileReadResult(result as { fileContents: string; totalFileLen: number; totalNumLines: number; hasNextPage: boolean }))
				lines.push('')
			}

			// ls_dir 显示目录列表
			else if (toolName === 'ls_dir') {
				const lsResult = result as { children: ShallowDirectoryItem[] | null; hasNextPage: boolean; itemsRemaining: number }
				if (lsResult.children && lsResult.children.length > 0) {
					lines.push('**Result:**')
					lines.push('')
					lines.push(formatDirectoryList(lsResult.children, lsResult.itemsRemaining))
					lines.push('')
				} else {
					lines.push('**Result:** *Empty directory*')
					lines.push('')
				}
			}

			// get_dir_tree 显示目录树
			else if (toolName === 'get_dir_tree') {
				const treeResult = result as { str: string }
				lines.push('**Result:**')
				lines.push('')
				lines.push('<details>')
				lines.push('<summary>View directory tree</summary>')
				lines.push('')
				lines.push('```')
				lines.push(treeResult.str)
				lines.push('```')
				lines.push('')
				lines.push('</details>')
				lines.push('')
			}

			// search_pathnames_only 和 search_for_files 显示搜索结果
			else if (toolName === 'search_pathnames_only' || toolName === 'search_for_files') {
				const searchResult = result as { uris: Array<{ fsPath: string }>; hasNextPage: boolean }
				if (searchResult.uris && searchResult.uris.length > 0) {
					lines.push('**Result:**')
					lines.push('')
					lines.push(formatSearchResults(searchResult.uris, searchResult.hasNextPage))
					lines.push('')
				} else {
					lines.push('**Result:** *No results found*')
					lines.push('')
				}
			}

			// search_in_file 显示匹配行
			else if (toolName === 'search_in_file') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatSearchInFileResult(result as { lines: number[] }))
				lines.push('')
			}

			// read_lint_errors 显示 lint 错误
			else if (toolName === 'read_lint_errors') {
				const lintResult = result as { lintErrors: LintErrorItem[] | null }
				if (lintResult.lintErrors && lintResult.lintErrors.length > 0) {
					lines.push('**Result:**')
					lines.push('')
					lines.push(formatLintErrors(lintResult.lintErrors))
					lines.push('')
				} else {
					lines.push('**Result:** *No lint errors*')
					lines.push('')
				}
			}

			// run_command 和 run_persistent_command 显示命令结果
			else if (toolName === 'run_command' || toolName === 'run_persistent_command') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatCommandResult(result as { result: string; resolveReason: { type: string; exitCode?: number } }))
				lines.push('')
			}

			// web_fetch 显示网页内容
			else if (toolName === 'web_fetch') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatWebFetchResult(result as { content: string; statusCode: number; url: string }))
				lines.push('')
			}

			// xml_escape 显示转义结果
			else if (toolName === 'xml_escape') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatXmlEscapeResult(result as { escapedContent: string; originalLength: number; escapedLength: number; charactersEscaped: number }))
				lines.push('')
			}

			// sleep_wait 显示等待结果
			else if (toolName === 'sleep_wait') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatSleepWaitResult(result as { seconds: number; skipped: boolean }))
				lines.push('')
			}

			// skill 显示技能信息
			else if (toolName === 'skill') {
				lines.push('**Result:**')
				lines.push('')
				lines.push(formatSkillResult(result as { skillName: string; skillPath: string; skillContent: string; dirTree: { children: ShallowDirectoryItem[] | null; hasNextPage: boolean; hasPrevPage: boolean; itemsRemaining: number } }))
				lines.push('')
			}

			// create_file_or_folder, delete_file_or_folder, rewrite_file, edit_file 等简单成功结果
			else if (toolName === 'create_file_or_folder' || toolName === 'delete_file_or_folder' ||
				toolName === 'rewrite_file' || toolName === 'edit_file' ||
				toolName === 'open_persistent_terminal' || toolName === 'kill_persistent_terminal') {
				lines.push('**Result:** *Success*')
				lines.push('')
			}

			// 处理其他未知类型的结果
			else if (typeof result === 'string') {
				lines.push('**Result:**')
				lines.push('```')
				lines.push(result)
				lines.push('```')
				lines.push('')
			} else if (typeof result === 'object') {
				lines.push('**Result:**')
				lines.push('```json')
				lines.push(JSON.stringify(result, null, 2))
				lines.push('```')
				lines.push('')
			}
		}

		// 错误信息
		if (message.type === 'tool_error') {
			lines.push('**Error:**')
			lines.push('```')
			lines.push(message.result)
			lines.push('```')
			lines.push('')
		}
	}

	else if (message.role === 'interrupted_streaming_tool') {
		lines.push(`#### Interrupted Tool: \`${message.name}\``)
		lines.push('')
	}

	// checkpoint 消息不导出到 Markdown
	else if (message.role === 'checkpoint') {
		// 跳过，不导出
	}

	return lines.join('\n')
}

/**
 * 将会话消息列表转换为 Markdown 格式
 * @param messages 会话消息列表
 * @param title 会话标题（可选）
 * @param workspacePath 工作目录路径（可选）
 * @returns Markdown 格式的字符串
 */
export const chatMessagesToMarkdown = (
	messages: ChatMessage[],
	title?: string,
	workspacePath?: string
): string => {
	const lines: string[] = []

	// 标题
	if (title) {
		lines.push(`# ${title}`)
		lines.push('')
	}

	// 导出信息
	const userMessageCount = messages.filter(m => m.role === 'user').length
	const messagesInfo = `Messages: ${messages.length} (${userMessageCount} user)`
	const workspaceInfo = workspacePath ? `Workspace: ${workspacePath}` : ''
	const separator = workspaceInfo ? ' | ' : ''
	lines.push(`> Exported from [CoderChat](https://github.com/coderchatwang/CoderChat) | ${messagesInfo}${separator}${workspaceInfo}`)
	lines.push('')

	// 分隔线
	lines.push('---')
	lines.push('')

	// 消息列表
	const totalMessages = messages.length
	let messageIndex = 0
	for (const message of messages) {
		const md = messageToMarkdown(message, messageIndex, totalMessages)
		if (md.trim()) {
			lines.push(md)
			lines.push('---')
			lines.push('')
		}
		messageIndex++
	}

	return lines.join('\n')
}

/**
 * 将 ThreadData 转换为 Markdown 格式
 */
export const threadDataToMarkdown = (
	threadData: {
		metadata: {
			title: string | null
			createdAt: string
			lastModified: string
			messageCount: number
			chatMode?: string
			projectId?: string
		}
		messages: ChatMessage[]
	},
	workspacePath?: string
): string => {
	const title = threadData.metadata.title || 'Chat Conversation'
	return chatMessagesToMarkdown(threadData.messages, title, workspacePath)
}
