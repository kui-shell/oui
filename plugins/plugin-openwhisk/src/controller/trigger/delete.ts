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

import { withStandardOptions } from '../usage'
import { synonyms } from '../../lib/models/synonyms'
import { clientOptions, getClient } from '../../client/get'
import { deployedTrigger } from '../../lib/cmds/openwhisk-usage'

const usage = withStandardOptions({
  command: 'delete',
  strict: 'delete',
  docs: 'delete a given trigger',
  example: 'wsk trigger delete <trigger>',
  required: deployedTrigger
})

/**
 * A request to delete a trigger. If this trigger has an
 * associated feed, we are responsible for invoking the DELETE
 * lifecycle event on the feed.
 *
 */
async function removeTrigger({ argvNoOptions, execOptions }: Arguments) {
  const name = argvNoOptions[argvNoOptions.length - 1]
  const client = getClient(execOptions)

  const trigger = await client.triggers.delete(Object.assign({ name: name }, clientOptions))

  const feedAnnotation = trigger.annotations && trigger.annotations.find(kv => kv.key === 'feed')
  if (feedAnnotation) {
    // special case of feed
    await client.feeds.delete(
      Object.assign(
        {
          name: feedAnnotation.value,
          trigger: name
        },
        clientOptions
      )
    )
  }

  return {
    verb: 'delete',
    type: 'trigger',
    name,
    metadata: {
      name: trigger.name,
      namespace: trigger.namespace
    }
  }
}

export default (registrar: Registrar) => {
  synonyms('triggers').forEach(syn => {
    registrar.listen(`/wsk/${syn}/delete`, removeTrigger, usage)
  })
}
