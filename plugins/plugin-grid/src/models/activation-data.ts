/*
 * Copyright 2017, 2019 IBM Corporation
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

import { EventEmitter } from 'events'
import { ResourceWithMetadata } from '@kui-shell/core'

import apiVersion from '../lib/apiVersion'
import Activation from '../lib/activation'
import { Options } from '../lib/options'
import { StatData } from '../lib/grouping'

// intentional double s, because the core removes one
export const kind = 'Activationss'

export interface State<O extends Options> {
  stats: StatData
  parsedOptions: O
  eventBus: EventEmitter
  activations: Activation[]
}

export type ActivationData<O extends Options> = ResourceWithMetadata<State<O>> & {
  apiVersion
  kind
}

export function isActivationData<O extends Options>(resource: ResourceWithMetadata): resource is ActivationData<O> {
  const data = resource as ActivationData<O>
  return data.apiVersion === apiVersion && data.kind === kind
}

export default ActivationData
