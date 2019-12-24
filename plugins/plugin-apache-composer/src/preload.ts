/*
 * Copyright 2018-19 IBM Corporation
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

import Debug from 'debug'
const debug = Debug('plugins/apache-composer/preload')
debug('loading')

import { dirname, join } from 'path'
import { augmentModuleLoadPath, PreloadRegistrar } from '@kui-shell/core'

import initRequirePath from './initRequirePath'
import flow from './modes/flow'
import json from './modes/json'
import jsonPreview from './modes/json-from-preview'
import visualize from './modes/visualize'
import visualizePreview from './modes/visualize-from-preview'
import code from './modes/code'

declare let __non_webpack_require__ // eslint-disable-line @typescript-eslint/camelcase
declare let __webpack_require__ // eslint-disable-line @typescript-eslint/camelcase

/**
 * This is the module
 *
 */
export default async (registrar: PreloadRegistrar) => {
  // help compositions find our openwhisk-composer module
  await initRequirePath()

  // eslint-disable-next-line @typescript-eslint/camelcase
  const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

  // give visibility to our @demos directory on the module path
  augmentModuleLoadPath(
    join(dirname(requireFunc.resolve('@kui-shell/plugin-apache-composer/package.json')), 'samples/@demos'),
    {
      command: 'preview'
    }
  )

  registrar.registerModes(flow, visualize, visualizePreview, json, jsonPreview, code)
}

debug('finished loading')
