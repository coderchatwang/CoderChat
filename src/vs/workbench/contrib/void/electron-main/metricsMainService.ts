/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { isLinux, isMacintosh, isWindows } from '../../../../base/common/platform.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IEnvironmentMainService } from '../../../../platform/environment/electron-main/environmentMainService.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { StorageTarget, StorageScope } from '../../../../platform/storage/common/storage.js';
import { IApplicationStorageMainService } from '../../../../platform/storage/electron-main/storageMainService.js';

import { IMetricsService } from '../common/metricsService.js';
import { PostHog } from 'posthog-node'
import { OPT_OUT_KEY } from '../common/storageKeys.js';
import { getMac } from '../../../../base/node/macAddress.js';
import * as crypto from 'crypto';


const os = isWindows ? 'windows' : isMacintosh ? 'mac' : isLinux ? 'linux' : null
const _getOSInfo = () => {
	try {
		const { platform, arch } = process // see platform.ts
		return { platform, arch }
	}
	catch (e) {
		return { osInfo: { platform: '??', arch: '??' } }
	}
}
const osInfo = _getOSInfo()

// we'd like to use devDeviceId on telemetryService, but that gets sanitized by the time it gets here as 'someValue.devDeviceId'



export class MetricsMainService extends Disposable implements IMetricsService {
	_serviceBrand: undefined;

	private readonly client: PostHog

	private _initProperties: object = {}


	// helper - looks like this is stored in a .vscdb file in ~/Library/Application Support/Void
	private _memoStorage(key: string, target: StorageTarget, setValIfNotExist?: string) {
		const currVal = this._appStorage.get(key, StorageScope.APPLICATION)
		if (currVal !== undefined) return currVal
		const newVal = setValIfNotExist ?? generateUuid()
		this._appStorage.store(key, newVal, StorageScope.APPLICATION, target)
		return newVal
	}


	// this is old, eventually we can just delete this since all the keys will have been transferred over
	// returns 'NULL' or the old key
	private get oldId() {
		// check new storage key first
		const newKey = 'void.app.oldMachineId'
		const newOldId = this._appStorage.get(newKey, StorageScope.APPLICATION)
		if (newOldId) return newOldId

		// put old key into new key if didn't already
		const oldValue = this._appStorage.get('void.machineId', StorageScope.APPLICATION) ?? 'NULL' // the old way of getting the key
		this._appStorage.store(newKey, oldValue, StorageScope.APPLICATION, StorageTarget.MACHINE)
		return oldValue

		// in a few weeks we can replace above with this
		// private get oldId() {
		// 	return this._memoStorage('void.app.oldMachineId', StorageTarget.MACHINE, 'NULL')
		// }
	}


	// the main id
	private get distinctId() {
		const oldId = this.oldId
		const setValIfNotExist = oldId === 'NULL' ? undefined : oldId
		return this._memoStorage('void.app.machineId', StorageTarget.MACHINE, setValIfNotExist)
	}

	// just to see if there are ever multiple machineIDs per userID (instead of this, we should just track by the user's email)
	private get userId() {
		return this._memoStorage('void.app.userMachineId', StorageTarget.USER)
	}

	constructor(
		@IProductService private readonly _productService: IProductService,
		@IEnvironmentMainService private readonly _envMainService: IEnvironmentMainService,
		@IApplicationStorageMainService private readonly _appStorage: IApplicationStorageMainService,
	) {
		super()
		this.client = new PostHog('phc_nM3jC2R3uTdgJG8Yd5ks9NnCuHjDRE7V2xB7NMmuWrLz', {
			host: 'https://us.i.posthog.com',
		})

		this.initialize() // async
	}

	async initialize() {
		// very important to await whenReady!
		await this._appStorage.whenReady

		const { commit, version, voidVersion, release, quality } = this._productService

		const isDevMode = !this._envMainService.isBuilt // found in abstractUpdateService.ts

	// get MAC address and encrypt with MD5, add prefix/suffix to increase security
		let deviceUid: string | undefined
		try {
			const macAddress = getMac()
			deviceUid = crypto.createHash('md5').update(`coder${macAddress}chat`, 'utf8').digest('hex')
		} catch (e) {
			console.log('Failed to get MAC address:', e)
		}

		// custom properties we identify
		this._initProperties = {
			commit,
			vscodeVersion: version,
			voidVersion: voidVersion,
			release,
			os,
			quality,
			distinctId: this.distinctId,
			distinctIdUser: this.userId,
			oldId: this.oldId,
			isDevMode,
			deviceUid,
			...osInfo,
		}

		const identifyMessage = {
			distinctId: this.distinctId,
			properties: this._initProperties,
		}

		const didOptOut = this._appStorage.getBoolean(OPT_OUT_KEY, StorageScope.APPLICATION, false)

		console.log('User is opted out of basic Void metrics?', didOptOut)
		if (didOptOut) {
			this.client.optOut()
		}
		else {
			this.client.optIn()
			this.client.identify(identifyMessage)
		}


		console.log('CoderChat posthog metrics info:', JSON.stringify(identifyMessage, null, 2))
	}


	capture: IMetricsService['capture'] = (event, params) => {
		const capture = { distinctId: this.distinctId, event, properties: params } as const
		// console.log('full capture:', this.distinctId)
		this.client.capture(capture)
	}

	setOptOut: IMetricsService['setOptOut'] = (newVal: boolean) => {
		if (newVal) {
			this._appStorage.store(OPT_OUT_KEY, 'true', StorageScope.APPLICATION, StorageTarget.MACHINE)
		}
		else {
			this._appStorage.remove(OPT_OUT_KEY, StorageScope.APPLICATION)
		}
	}

	async getDebuggingProperties() {
		return this._initProperties
	}
}


