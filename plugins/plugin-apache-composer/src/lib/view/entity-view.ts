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

import { isHeadless } from '@kui-shell/core/api/capabilities'
import { Arguments } from '@kui-shell/core/api/commands'
import { ok } from '@kui-shell/plugin-openwhisk'

/**
 * Format the given activation record for display as a session
 *
 */
export const formatSessionResponse = (_, activation) => {
  activation.prettyType = 'sessions'
  return activation
}

export const formatCompositionEntity = ({ REPL, execOptions }: Arguments) => response => {
  if (isHeadless()) {
    return ok(`updated composition ${response.name}`)
  } else {
    return REPL.qexec(`wsk app get "${response.name}"`, undefined, undefined, execOptions)
  }
}

export const formatCompositionResult = ({ REPL }: Arguments, result, options) => {
  if (options.result || options.r) return result
  else return isHeadless() ? result.response.result : REPL.qexec(`wsk activation get ${result.activationId}`)
}

export const formatDeleteResult = response => {
  response.type = 'composition' // to distinguish composition with action in CLI
  return response
}

export const formatSessionGet = (command: Arguments, response) => {
  if (response && response.annotations && response.annotations.find(({ key, value }) => key === 'conductor' && value)) {
    return formatSessionResponse(command, response)
  } else {
    return response
  }
}
