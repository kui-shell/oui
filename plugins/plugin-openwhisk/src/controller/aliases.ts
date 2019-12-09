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

import { CommandOptions } from '@kui-shell/core'

export const alias = {
  /*  memory: ['m'],
  timeout: ['t'],
  param: ['p'],
  annotation: ['a'],
  feed: ['f'],
  blocking: ['b'],
  result: ['r'],
  limit: ['l'],
  skip: ['s'] */
}

export const configuration = {
  'camel-case-expansion': false,
  'duplicate-arguments-array': false
}

export const standardOptions: CommandOptions = {
  usage: {
    configuration
  },
  flags: {
    boolean: ['sequence', 'native', 'copy', 'web'],
    alias
  }
}

export default standardOptions
