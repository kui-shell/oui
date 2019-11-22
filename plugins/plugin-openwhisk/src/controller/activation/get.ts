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

import { Arguments, ParsedOptions, Registrar } from '@kui-shell/core/api/commands'

import respondWith from './as-activation'
import { synonyms } from '../../models/synonyms'
import { Activation } from '../../models/resource'
import { clientOptions, getClient } from '../../client/get'
import { activationID, withStandardOptions } from '../usage'

interface Options extends ParsedOptions {
  last: boolean | string
}

export const usage = (syn: string) =>
  withStandardOptions({
    command: 'get',
    strict: 'get',
    docs: 'get the full details of an activation',
    example: `wsk ${syn} get <activationID>`,
    oneof: activationID.concat({
      name: '--last [actionName]',
      booleanOK: true,
      docs: 'show the last activation [of the given action]'
    })
  })

export default (registrar: Registrar) => {
  synonyms('activations').forEach(syn => {
    registrar.listen(
      `/wsk/${syn}/get`,
      async ({ REPL, argvNoOptions, parsedOptions, execOptions }: Arguments<Options>) => {
        const name = argvNoOptions[argvNoOptions.indexOf('get') + 1]

        if (parsedOptions.last) {
          // special case for wsk activation get --last
          return REPL.qexec<Activation>(
            `wsk activation last ${typeof parsedOptions.last === 'string' ? parsedOptions.last : ''}`
          )
        } else {
          return respondWith(
            await getClient(execOptions).activations.get(
              Object.assign(
                {
                  name
                },
                clientOptions
              )
            )
          )
        }
      },
      usage(syn)
    )
  })
}
