/*
 * Copyright 2019 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { dirname, join } from 'path'
import { inBrowser } from '@kui-shell/core'

declare let __non_webpack_require__ // eslint-disable-line @typescript-eslint/camelcase
declare let __webpack_require__ // eslint-disable-line @typescript-eslint/camelcase

// help compositions find our openwhisk-composer module
export default async () => {
  if (!inBrowser()) {
    const appModulePath = await import('app-module-path')

    // eslint-disable-next-line @typescript-eslint/camelcase
    const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

    // add the directory that encloses `openwhisk-composer`
    // this is needed e.g. for `compose foo`
    const root = dirname(requireFunc.resolve('openwhisk-composer/package.json'))
    appModulePath.addPath(join(root, '..'))
  }
}
