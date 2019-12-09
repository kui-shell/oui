/*
 * Copyright 2018 IBM Corporation
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
const debug = Debug('plugins/openwhisk-editor-extensions/preload')
debug('loading')

import { isHeadless } from '@kui-shell/core'
import { registerFetcher } from '@kui-shell/plugin-editor'

debug('done loading prereqs')

/**
 * A preloaded plugin that enhances the view modes for actions
 *
 */
export default async () => {
  debug('initializing')

  if (!isHeadless()) {
    const { fetchAction } = await import('./lib/cmds/new')
    registerFetcher(fetchAction())
  }
}

debug('finished loading')
