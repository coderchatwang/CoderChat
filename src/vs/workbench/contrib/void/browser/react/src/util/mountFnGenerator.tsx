/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom/client'
import { _registerServices, _unregisterServices } from './services.js';


import { ServicesAccessor } from '../../../../../../../editor/browser/editorExtensions.js';

export const mountFnGenerator = (Component: (params: any) => React.ReactNode) => (rootElement: HTMLElement, accessor: ServicesAccessor, props?: any) => {
	if (typeof document === 'undefined') {
		console.error('index.tsx error: document was undefined')
		return
	}

	// Register services globally (only happens once)
	_registerServices(accessor)

	const root = ReactDOM.createRoot(rootElement)

	const rerender = (props?: any) => {
		root.render(<Component {...props} />); // tailwind dark theme indicator
	}
	const dispose = () => {
		root.unmount();
		// 清理全局服务状态，允许下次重新注册
		// 解决视图移动后 InstantiationService has been disposed 问题
		_unregisterServices()
	}

	rerender(props)

	const returnVal = {
		rerender,
		dispose,
	}
	return returnVal
}
