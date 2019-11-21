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

// this file defines the external API

export { default as agent } from './lib/models/agent'
export { synonyms } from './lib/models/synonyms'
export { addActionMode } from './lib/models/modes'
export { default as withHeader } from './lib/models/withHeader'
export { Package, Rule, currentSelection } from './lib/models/openwhisk-entity'
export { Action, isAction, Activation, isActivation, OpenWhiskResource, hasAnnotation } from './lib/models/resource'
export { current as currentNamespace } from './lib/models/namespace'
export { renderActivationListView, ActivationListTable } from './lib/views/cli/activations/list'
export { fqn } from './controller/fqn'
export { ListOptions } from './controller/options'
export { asActivationTable } from './controller/activation/as-activation'

import { createUsage as actionCreateUsage, updateUsage as actionUpdateUsage } from './controller/action/create'
import { usage as actionInvokeUsage } from './controller/action/invoke'
import { usage as activationGetUsage } from './controller/activation/get'
import { skipAndLimit } from './lib/cmds/openwhisk-usage'

export const Usage = {
  action: {
    create: actionCreateUsage,
    update: actionUpdateUsage,
    invoke: actionInvokeUsage
  },
  activation: {
    get: activationGetUsage
  },
  skipAndLimit
}
