/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useMemo } from 'react'
import { useAccessor, useMCPServiceState, useSkillServiceState } from '../util/services.js'
import { useVoidChatI18n } from '../util/i18n.js'
import { getToolDisplayName } from '../util/toolNames.js'
import { createNotificationHelper } from '../../../../common/helpers/notificationHelper.js'
import { availableTools, generateSkillsListXML } from '../../../../common/prompt/prompts.js'
import { ChatMode } from '../../../../common/voidSettingsTypes.js'
import { IEnvironmentService } from '../../../../../../../platform/environment/common/environment.js'

export type MenuItem = {
	key: string
	label: string
	title?: string
	onClick?: () => void
	children?: MenuItem[]
}

export type UseMenuItemsParams = {
	currentThread: { state?: { chatMode?: ChatMode } } | null
	onCopyChat: () => void
	onExportAsMarkdown: () => void
	onExportAsChatshare: () => void
	onImportFromChatshare: () => void
}

export const useMenuItems = (params: UseMenuItemsParams): MenuItem[] => {
	const { currentThread, onCopyChat, onExportAsMarkdown, onExportAsChatshare, onImportFromChatshare } = params

	const accessor = useAccessor()
	const t = useVoidChatI18n()
	const mcpService = accessor.get('IMCPService')
	const mcpServiceState = useMCPServiceState()
	const skillService = accessor.get('ISkillService')
	const skillServiceState = useSkillServiceState()
	const environmentService = accessor.get('IEnvironmentService')

	// 判断是否为开发模式
	const isDevelopment = !environmentService.isBuilt || environmentService.isExtensionDevelopment

	const menuItems = useMemo(() => {
		const handleFeatureNotReady = () => {
			const notificationService = accessor.get('INotificationService')
			const notificationHelper = createNotificationHelper(notificationService)
			notificationHelper.info(t.alertDialogFeatureNotReady())
		}

		// 获取当前模式的工具列表
		const currentChatMode: ChatMode = currentThread?.state?.chatMode ?? 'agent'

		// 从 MCP 服务获取工具
		const mcpTools = mcpService.getMCPTools()

		// 从 Skill 服务获取 skills 并生成描述
		const skills = skillService.getSkills()
		const skillsListXML = generateSkillsListXML(skills)

		// 使用 availableTools 函数获取当前模式可用的工具
		// availableTools 会根据 skillsListXML 是否包含 "No skills available." 来判断是否排除 skill 工具
		const tools = availableTools(currentChatMode, mcpTools, skillsListXML)

		// 将工具转换为菜单项 - 分离内置工具和 MCP 工具
		const builtInToolMenuItems: MenuItem[] = []
		const mcpToolMenuItems: MenuItem[] = []

		tools?.forEach(tool => {
			// 获取工具的国际化显示名称
			const i18nLabel = getToolDisplayName(tool.name, t)
			// 别名后边跟上工具名，例如"读取文件 (read_file)"
			const displayName = tool.mcpServerName
				? `${i18nLabel} (${tool.name}, MCP: ${tool.mcpServerName})`
				: `${i18nLabel} (${tool.name})`

			const menuItem: MenuItem = {
				key: tool.name,
				label: displayName,
				onClick: handleFeatureNotReady,
			}

			// MCP 工具放到 mcpToolMenuItems，内置工具放到 builtInToolMenuItems
			if (tool.mcpServerName) {
				mcpToolMenuItems.push(menuItem)
			} else {
				builtInToolMenuItems.push(menuItem)
			}
		})

		// 构建技能菜单项
		const mergedSkills = skillService.getMergedSkills()

		const skillMenuItems: MenuItem[] = mergedSkills.map(skill => {
			const locationLabel = skill.location === 'project' ? t.skillProject() : t.skillGlobal()
			return {
				key: `skill_${skill.location}_${skill.name}`,
				label: `${skill.name} (${locationLabel})`,
				title: skill.description || undefined,
				onClick: handleFeatureNotReady,
			}
		})

		const baseMenuItems: MenuItem[] = [
			{
				key: 'copy_chat',
				label: t.menuCopyChat(),
				onClick: onCopyChat
			},
			{
				key: 'share_chat',
				label: t.menuExportChat(),
				children: [
					{ key: 'share_as_md', label: t.menuExportAsMarkdown(), onClick: onExportAsMarkdown },
					{ key: 'share_as_bolb', label: t.menuExportAsChatshare(), onClick: onExportAsChatshare },
				]
			},
			{ key: 'load_from_bolb', label: t.menuImportChat(), onClick: onImportFromChatshare },
			{
				key: 'tool_all',
				label: t.tools(),
				children: builtInToolMenuItems.length > 0
					? builtInToolMenuItems
					: [{ key: 'no_tools', label: t.toolNameNoTools(), onClick: handleFeatureNotReady }]
			},
			{
				key: 'mcp_tools',
				label: t.mcpTools(),
				children: mcpToolMenuItems.length > 0
					? mcpToolMenuItems
					: [{ key: 'no_mcp_tools', label: t.noToolsAvailable(), onClick: handleFeatureNotReady }]
			},
		{
				key: 'skills',
				label: t.configuredSkills(),
				children: skillMenuItems.length > 0
					? skillMenuItems
					: [{ key: 'no_skills', label: t.noSkillsAvailable(), onClick: handleFeatureNotReady }]
			},
		]

		// 在开发模式下添加调试菜单
		if (isDevelopment) {
			baseMenuItems.push({
				key: 'debug',
				label: '调试-095223',
				onClick: handleFeatureNotReady,
			})
		}

		return baseMenuItems
	}, [onExportAsChatshare, onImportFromChatshare, onExportAsMarkdown, onCopyChat, currentThread?.state?.chatMode, mcpServiceState, skillServiceState, accessor, t, mcpService, skillService, isDevelopment])

	return menuItems
}
