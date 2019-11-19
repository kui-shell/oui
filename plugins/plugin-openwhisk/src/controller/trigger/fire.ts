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
import { Arguments, Registrar } from '@kui-shell/core/api/commands'

import ok from '../ok'
import { fqn } from '../fqn'
import toDict from '../dict'
import { kvOptions } from '../key-value'
import { withStandardOptions } from '../usage'
import { synonyms } from '../../lib/models/synonyms'
import { clientOptions, getClient } from '../../client/get'
import { currentSelection } from '../../lib/models/selection'
import { params, deployedTrigger } from '../../lib/cmds/openwhisk-usage'

const usage = {
  command: 'fire',
  strict: 'fire',
  docs: 'fire a trigger',
  example: 'wsk trigger fire <trigger>',
  required: deployedTrigger,
  optional: params
}

/**
 * Invoke an action
 *
 */
async function fireTrigger({ tab, argv, execOptions }: Arguments): Promise<HTMLElement> {
  const { kv, argvNoOptions, nameIdx } = kvOptions(argv, 'fire')
  const name = argvNoOptions[nameIdx] || fqn(currentSelection(tab))

  await getClient(execOptions)
    .triggers.invoke(
      Object.assign(
        {
          name,
          params: toDict(kv.parameters)
        },
        clientOptions
      )
    )
    .catch((err: Errors.CodedError<number>) => {
      if (err.statusCode === 502) {
        return err['error']
      } else {
        throw err
      }
    })

  return ok(`fired trigger ${name}`)
}

export default (registrar: Registrar) => {
  synonyms('triggers').forEach(syn => {
    registrar.listen(`/wsk/${syn}/fire`, fireTrigger, withStandardOptions(usage))
  })
}
