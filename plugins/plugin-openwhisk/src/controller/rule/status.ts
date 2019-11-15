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

import { fqn } from '../fqn'
import standardOptions from '../aliases'
import { synonyms } from '../../lib/models/synonyms'
import { clientOptions, getClient } from '../../client/get'
import { currentSelection } from '../../lib/models/selection'

async function doEnable({ tab, argvNoOptions, execOptions, REPL }: Arguments) {
  const name = argvNoOptions[argvNoOptions.indexOf('enable') + 1] || fqn(currentSelection(tab))

  await getClient(execOptions).rules.enable(
    Object.assign(
      {
        name
      },
      clientOptions
    )
  )

  return REPL.qexec(`wsk rule get "${name}"`)
}

async function doDisable({ tab, argvNoOptions, execOptions, REPL }: Arguments) {
  const name = argvNoOptions[argvNoOptions.indexOf('disable') + 1] || fqn(currentSelection(tab))

  await getClient(execOptions).rules.disable(
    Object.assign(
      {
        name
      },
      clientOptions
    )
  )

  return REPL.qexec(`wsk rule get "${name}"`)
}

export default (registrar: Registrar) => {
  synonyms('rules').forEach(syn => {
    registrar.listen(`/wsk/${syn}/enable`, doEnable, standardOptions)
    registrar.listen(`/wsk/${syn}/disable`, doDisable, standardOptions)
  })
}
