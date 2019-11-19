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

import Errors from '@kui-shell/core/api/errors'
import { CommandOptions } from '@kui-shell/core/api/commands'

import standardOptions from './aliases'
import { skipAndLimit } from '../lib/cmds/openwhisk-usage'

export function withStandardOptions(model: Errors.UsageModel): CommandOptions {
  const usage = Object.assign({}, standardOptions.usage, model)
  return Object.assign({}, standardOptions, { usage })
}

export const standardListUsage = (syn: string, withName = false, command = 'list') =>
  withStandardOptions({
    command,
    strict: command,
    docs: `list all ${syn} entities`,
    example: `wsk ${syn} ${command}`,
    optional: [
      {
        name: 'package',
        positional: true,
        entity: 'wsk package',
        docs: `list all ${syn} entities in a given package`
      }
    ]
      .concat(skipAndLimit)
      .concat(withName ? [{ name: '--name', positional: false, entity: '', docs: 'Filter by name' }] : [])
  })
