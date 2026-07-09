/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ColorScheme } from '../../../../platform/theme/common/theme.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';

/**
 * Void 主题数据提供者
 * 
 * 参考 VSCode 的 WebviewThemeDataProvider 实现，提供可靠的主题状态管理：
 * - 缓存主题数据，避免重复计算
 * - 提供主题变化事件
 * - 确保主题状态在组件渲染前就可访问
 */
export class VoidThemeDataProvider extends Disposable {

	private _cachedThemeType: ColorScheme | undefined = undefined;

	private readonly _onThemeChanged = this._register(new Emitter<ColorScheme>());
	public readonly onThemeChanged = this._onThemeChanged.event;

	constructor(
		@IThemeService private readonly _themeService: IThemeService,
	) {
		super();

		// 监听主题变化
		this._register(this._themeService.onDidColorThemeChange(({ type }) => {
			this._reset(type);
		}));

		// 立即初始化当前主题（确保在组件渲染前就有值）
		this._initialize();
	}

	private _initialize(): void {
		// 同步获取当前主题类型
		this._cachedThemeType = this._themeService.getColorTheme().type;
	}

	/**
	 * 获取当前主题类型
	 * 始终返回有效的 ColorScheme 值
	 */
	public getThemeType(): ColorScheme {
		if (this._cachedThemeType === undefined) {
			// 如果缓存为空，立即从服务获取
			this._cachedThemeType = this._themeService.getColorTheme().type;
		}
		return this._cachedThemeType;
	}

	/**
	 * 判断当前是否为暗色主题
	 */
	public isDark(): boolean {
		const type = this.getThemeType();
		return type === ColorScheme.DARK || type === ColorScheme.HIGH_CONTRAST_DARK;
	}

	/**
	 * 获取用于 Tailwind CSS 的主题 class 名称
	 * 注意：由于 tailwind.config.js 中设置了 prefix: 'void-'，
	 * 所以 dark mode 的 class 应该是 'void-dark' 而不是 'dark'
	 */
	public getThemeClassName(): 'void-dark' | '' {
		return this.isDark() ? 'void-dark' : '';
	}

	private _reset(type: ColorScheme): void {
		this._cachedThemeType = type;
		this._onThemeChanged.fire(type);
	}
}

// 单例实例（由服务注册时设置）
let _instance: VoidThemeDataProvider | undefined = undefined;

/**
 * 设置 VoidThemeDataProvider 实例（仅由服务注册时调用）
 */
export function setVoidThemeDataProvider(instance: VoidThemeDataProvider): void {
	_instance = instance;
}

/**
 * 获取 VoidThemeDataProvider 实例
 */
export function getVoidThemeDataProvider(): VoidThemeDataProvider | undefined {
	return _instance;
}
