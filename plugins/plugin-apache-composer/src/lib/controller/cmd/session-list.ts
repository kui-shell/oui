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

import { isHeadless, Arguments, Registrar, UsageError } from '@kui-shell/core'
import { asActivationTable, renderActivationListView, Activation, ListOptions } from '@kui-shell/plugin-openwhisk'

import { sessionList } from '../../utility/usage'

const debug = Debug('plugins/apache-composer/cmd/session-list')

interface SessionListOptions extends ListOptions {
  'scan-limit'?: number
}

export default async (commandTree: Registrar) => {
  const sessionSyns = ['sessions', 'sess', 'ses', 'session']

  /* command handler for session list */
  sessionSyns.forEach(noun => {
    commandTree.listen(
      `/wsk/${noun}/list`,
      async ({ tab, argvNoOptions, parsedOptions, REPL }: Arguments<SessionListOptions>) => {
        const limit = parsedOptions.limit === undefined ? 10 : parsedOptions.limit // limit 10 sessions in session list if users didn't specify --limit
        const skip = parsedOptions.skip || 0 // skip 0 sessions in session list by default if users didn't specify --skip
        const scanLimit = parsedOptions['scan-limit']

        // degenerate cases for options
        if (limit === 0 || scanLimit === 0) return { body: [], type: 'session' }

        const nameOption = parsedOptions.name // e.g. session list --name [session name]
        const nameSpecify =
          argvNoOptions.indexOf('list') === argvNoOptions.length - 2 ? argvNoOptions[argvNoOptions.length - 1] : '' // e.g. session list [session name]

        if (nameOption && nameSpecify && nameOption !== nameSpecify) {
          debug('inconsistent name:', nameSpecify, nameSpecify)
          throw new UsageError('You provided two different session names')
        }

        const name = nameOption || nameSpecify || ''

        // find sessions in activation list
        const findSessions = async (skip = 0, name = '', limit = 20) => {
          return REPL.rexec<Activation[]>(`wsk activation list "${name}" --skip ${skip} --limit ${limit}`)
            .then(activations => {
              // filter activations to find session
              debug('finding sessions in activation list', activations)
              return activations.content.filter(activation => {
                if (
                  activation &&
                  activation.annotations &&
                  activation.annotations.find(({ key, value }) => key === 'conductor' && value)
                ) {
                  debug('found a session', activation)
                  return activation
                }
              })
            })
            .catch(err => err)
        }

        if (scanLimit) {
          const max = await REPL.qexec<number>('wsk activation count') // get the number of total activations
          let foundSessions = []
          for (let scanned = 0; scanned < max && foundSessions.length < scanLimit; scanned += 200) {
            const sessions = await findSessions(scanned, name, 200)
            foundSessions = foundSessions.concat(sessions)
          }

          const list = foundSessions.slice(skip, scanLimit + skip)
          if (parsedOptions.count) {
            return list.length
          } else if (isHeadless()) {
            const L = await asActivationTable(tab, list)
            if (L.body.length > 0) {
              L.header.type = 'session' // hack: needed to make core's headless pretty printer work
            }
          } else {
            return renderActivationListView(tab, list, parsedOptions)
          }
        } else {
          return findSessions(0, name, 200) // always trying to find sessions in the latest 20 activations
            .then(async foundSessions => {
              const list = foundSessions.slice(skip, limit + skip)
              if (parsedOptions.count) {
                return list.length
              } else if (isHeadless()) {
                const L = await asActivationTable(tab, list)
                if (L.body.length > 0) {
                  L.header.type = 'session' // hack: needed to make core's headless pretty printer work
                }
                return L
              } else {
                return renderActivationListView(tab, list, parsedOptions)
              }
            })
            .catch(err => err)
        }
      },
      { usage: sessionList }
    )
  })
}
