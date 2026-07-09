/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useVoidChatI18n } from './i18n.js'

/**
 * 工具名称到国际化 key 的映射
 * 用于在菜单中显示工具的国际化别名
 */
export const toolNameI18nKeyOfToolName: Record<string, string> = {
	'read_file': 'toolNameReadFile',
	'ls_dir': 'toolNameLsDir',
	'get_dir_tree': 'toolNameGetDirTree',
	'search_pathnames_only': 'toolNameSearchPathnamesOnly',
	'search_for_files': 'toolNameSearchForFiles',
	'search_in_file': 'toolNameSearchInFile',
	'read_lint_errors': 'toolNameReadLintErrors',
	'create_file_or_folder': 'toolNameCreateFileOrFolder',
	'delete_file_or_folder': 'toolNameDeleteFileOrFolder',
	'edit_file': 'toolNameEditFile',
	'rewrite_file': 'toolNameRewriteFile',
	'run_command': 'toolNameRunCommand',
	'run_persistent_command': 'toolNameRunPersistentCommand',
	'open_persistent_terminal': 'toolNameOpenPersistentTerminal',
	'kill_persistent_terminal': 'toolNameKillPersistentTerminal',
	'xml_escape': 'toolNameXmlEscape',
	'ask_user_question': 'toolNameAskUserQuestion',
	'web_fetch': 'toolNameWebFetch',
	'todo_write': 'toolNameTodoWrite',
	'todo_read': 'toolNameTodoRead',
	'sleep_wait': 'toolNameSleepWait',
}

/**
 * 获取工具的国际化显示名称
 * @param toolName 工具名称
 * @param t 国际化函数对象
 * @returns 国际化后的工具名称，如果没有对应的国际化 key 则返回原工具名称
 */
export const getToolDisplayName = (
	toolName: string,
	t: ReturnType<typeof useVoidChatI18n>
): string => {
	const i18nKey = toolNameI18nKeyOfToolName[toolName] as keyof typeof t | undefined
	if (!i18nKey) {
		return toolName
	}
	const i18nFn = t[i18nKey]
	if (typeof i18nFn === 'function') {
		return (i18nFn as () => string)()
	}
	return toolName
}
