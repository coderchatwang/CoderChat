/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/**
 * Skill 类型定义
 * Skill 是一种可扩展的功能模块，可以提供专门的领域能力
 */

/** Skill 的位置类型 */
export type SkillLocation = 'project' | 'global'

/** Skill 元数据 */
export interface SkillInfo {
	/** Skill 名称 */
	name: string
	/** Skill 描述 */
	description: string
	/** Skill 位置：project（项目级）或 global（全局级） */
	location: SkillLocation
	/** Skill 目录路径 */
	skillPath: string
}

/** Skill 配置文件（SKILL.md）的 YAML frontmatter */
export interface SkillFrontMatter {
	name: string
	description: string
	license?: string
}

/** Skill 服务状态 */
export interface SkillServiceState {
	/** 所有技能列表（不合并，用于设置页面显示） */
	skills: SkillInfo[]
	/** 合并后的技能列表（项目级优先，用于聊天区菜单） */
	mergedSkills: SkillInfo[]
	error: string | undefined
}

/** 添加技能结果 */
export interface AddSkillResult {
	success: boolean
	skillName: string
	error?: string
}

/** 删除技能结果 */
export interface DeleteSkillResult {
	success: boolean
	error?: string
}
