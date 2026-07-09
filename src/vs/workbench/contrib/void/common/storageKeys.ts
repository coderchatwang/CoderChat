/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// past values:
// 'void.settingsServiceStorage'
// 'void.settingsServiceStorageI' // 1.0.2

// 1.0.3
export const VOID_SETTINGS_STORAGE_KEY = 'void.settingsServiceStorageII'


// past values:
// 'void.chatThreadStorage'
// 'void.chatThreadStorageI' // 1.0.2
// 'void.chatThreadStorageII' // 1.0.3 - 迁移后会被删除

// 1.0.4 - 新的分离存储架构
export const THREAD_STORAGE_KEY = 'void.chatThreadStorageII' // 旧版本键（仅用于迁移检测，迁移成功后会删除）

// 新版本存储键前缀
export const CHAT_THREAD_STORAGE_PREFIX = 'void.chatThreads'
export const CHAT_THREAD_META_PREFIX = `${CHAT_THREAD_STORAGE_PREFIX}.meta`
export const CHAT_THREAD_DATA_PREFIX = `${CHAT_THREAD_STORAGE_PREFIX}.data`
export const CHAT_THREAD_MIGRATION_FLAG = `${CHAT_THREAD_STORAGE_PREFIX}.migrated`


export const OPT_OUT_KEY = 'void.app.optOutAll'
