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

import { isHeadless, Arguments, Registrar } from '@kui-shell/core'

import { withStandardOptions, standardListUsage } from '../usage'
import { synonyms } from '../../models/synonyms'
import { copy, nameForList, ListOptions } from '../options'
import { clientOptions, getClient } from '../../client/get'
import { asActivation, asActivationTable } from './as-activation'
import { isSession, renderActivationListView } from '../../views/activation/list'

import { list as listUsage } from './usage'

/**
 * Pattern that matches /a/b/c, and captures the b/c part. It is
 * optional on the b part, and thus will match /a/c while capturing c.
 *
 */
const fqnPattern = /^\/[^/]+\/(([^/]+\/)?.*)$/

/**
 * The activation list impl.
 *
 */
const doList = async ({ tab, argvNoOptions, parsedOptions, execOptions }: Arguments<ListOptions>) => {
  let name = argvNoOptions[argvNoOptions.indexOf('list') + 1]

  if (!parsedOptions.skip) {
    parsedOptions.skip = 0
  }
  if (!parsedOptions.limit) {
    parsedOptions.limit = 10
  }

  if (name) {
    const fqnMatch = name.match(fqnPattern)
    if (fqnMatch) {
      // openwhisk activation queries don't support FQN, only
      // package/action or action
      name = fqnMatch[1]
    }
    parsedOptions.name = name
  }

  const args = copy(parsedOptions, nameForList(name))

  // eslint-disable-next-line no-useless-catch
  try {
    const raw = await getClient(execOptions).activations.list(Object.assign({}, args, clientOptions))

    if (parsedOptions.count) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((raw as any) as { activations: number }).activations
    } else {
      const list = raw.map(asActivation)
      if (execOptions.raw) {
        return { mode: 'raw', content: list }
      } else if (isHeadless()) {
        const L = await asActivationTable(tab, list)
        if (L.body.length > 0) {
          L.header.type = isSession(raw[0]) ? 'sessions' : 'activations' // hack: needed to make core's headless pretty printer work
        }
        return L
      } else {
        return renderActivationListView(tab, list, parsedOptions)
      }
    }
  } catch (err) {
    throw err
  }
}

function doCount({ REPL, parsedOptions }: Arguments<ListOptions>) {
  return REPL.qexec<number>(`wsk activation list --count ${parsedOptions.name ? ' --name ' + parsedOptions.name : ''}`)
}

export default (registrar: Registrar) => {
  synonyms('activations').forEach(syn => {
    registrar.listen(`/wsk/${syn}/count`, doCount, standardListUsage(syn, true, 'count'))
    registrar.listen(`/wsk/${syn}/list`, doList, withStandardOptions(listUsage))
  })
}
