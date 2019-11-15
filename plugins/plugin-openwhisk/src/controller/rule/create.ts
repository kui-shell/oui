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

import { Arguments, Registrar } from '@kui-shell/core/api/commands'

import ok from '../ok'
import respondWith from './as-rule'
import standardOptions from '../aliases'
import { synonyms } from '../../lib/models/synonyms'
import { clientOptions, getClient } from '../../client/get'
import { isHeadless } from '@kui-shell/core/api/capabilities'

const doCreate = (verb: string, overwrite: boolean) => async ({ argvNoOptions, execOptions }: Arguments) => {
  const idx = argvNoOptions.indexOf(verb) + 1
  const name = argvNoOptions[idx]
  const trigger = argvNoOptions[idx + 1]
  const action = argvNoOptions[idx + 2]

  const raw = await getClient(execOptions).rules.update(
    Object.assign(
      {
        name,
        trigger,
        action,
        overwrite
      },
      clientOptions
    )
  )

  if (isHeadless()) {
    return ok(`updated rule ${name}`)
  } else {
    return respondWith(raw)
  }
}

export default (registrar: Registrar) => {
  synonyms('rules').forEach(syn => {
    registrar.listen(`/wsk/${syn}/create`, doCreate('create', false), standardOptions)
    registrar.listen(`/wsk/${syn}/update`, doCreate('update', true), standardOptions)
  })
}
