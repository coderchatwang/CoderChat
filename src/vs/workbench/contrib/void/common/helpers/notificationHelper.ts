/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { INotificationService, Severity, NotificationMessage } from '../../../../../platform/notification/common/notification.js'

/**
 * 通知工具类 - 封装了绕过过滤器的通知方法
 * 
 * VS Code 的通知过滤器可能会过滤掉非 Error 级别的通知，
 * 使用这些方法可以确保通知一定会显示给用户。
 */
export class NotificationHelper {

	constructor(
		private readonly notificationService: INotificationService
	) { }

	/**
	 * 显示 Info 级别的通知（绕过过滤器）
	 */
	info(message: NotificationMessage): void {
		this.notificationService.notify({
			severity: Severity.Info,
			message,
			bypassFilter: true
		})
	}

	/**
	 * 显示 Warning 级别的通知（绕过过滤器）
	 */
	warn(message: NotificationMessage): void {
		this.notificationService.notify({
			severity: Severity.Warning,
			message,
			bypassFilter: true
		})
	}

	/**
	 * 显示 Error 级别的通知（绕过过滤器）
	 */
	error(message: NotificationMessage): void {
		this.notificationService.notify({
			severity: Severity.Error,
			message,
			bypassFilter: true
		})
	}

	/**
	 * 显示指定级别的通知（绕过过滤器）
	 * 
	 * @param severity 通知级别：Severity.Info | Severity.Warning | Severity.Error
	 * @param message 通知消息
	 */
	notify(severity: Severity, message: NotificationMessage): void {
		this.notificationService.notify({
			severity,
			message,
			bypassFilter: true
		})
	}
}

/**
 * 创建通知助手实例
 * 
 * @param notificationService VS Code 的通知服务
 * @returns NotificationHelper 实例
 * 
 * @example
 * ```typescript
 * const notificationHelper = createNotificationHelper(notificationService)
 * 
 * // 显示 Info 通知
 * notificationHelper.info('操作成功')
 * 
 * // 显示 Warning 通知
 * notificationHelper.warn('请注意')
 * 
 * // 显示 Error 通知
 * notificationHelper.error('操作失败')
 * 
 * // 使用指定级别
 * notificationHelper.notify(Severity.Info, '自定义消息')
 * ```
 */
export function createNotificationHelper(notificationService: INotificationService): NotificationHelper {
	return new NotificationHelper(notificationService)
}
