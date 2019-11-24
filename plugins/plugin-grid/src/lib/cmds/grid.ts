/*
 * Copyright 2017-19 IBM Corporation
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

import { MultiModalResponse } from '@kui-shell/core/api/ui-lite'
import { Arguments, Registrar } from '@kui-shell/core/api/commands'

import { grid as usage } from '../../usage'

import defaults from '../../defaults'
import apiVersion from '../apiVersion'
import { GridOptions } from '../options'
import { kind, ActivationData } from '../../models/activation-data'
import { fetchActivationData, titleWhenNothingSelected, formatStats } from '../util'

const verb = 'grid'
const viewName = 'Grid'

/**
 * Visualize the activation data
 *
 */
async function drawGrid({
  argvNoOptions,
  parsedOptions
}: Arguments<GridOptions>): Promise<MultiModalResponse<ActivationData<GridOptions>>> {
  const N = parsedOptions.batches || defaults.N
  const name = argvNoOptions[argvNoOptions.indexOf(verb) + 1]
  const activations = await fetchActivationData(N, Object.assign(parsedOptions, { name }))

  const { stats, toolbarText } = formatStats(activations, parsedOptions)

  const content = {
    stats,
    eventBus: new EventEmitter(),
    activations,
    parsedOptions
  }

  return {
    apiVersion,
    kind,
    metadata: {
      name: name || titleWhenNothingSelected
    },
    defaultMode: 'grid',
    toolbarText,
    modes: [],
    content
  }
}

/**
 * This is the module
 *
 */
export default async (registrar: Registrar) => {
  const opts = {
    usage,
    needsUI: true,
    viewName,
    noAuthOk: true // the underlying data queries will ensure whatever auth they need
  }

  registrar.listen(`/${verb}`, drawGrid, opts)
  registrar.listen(`/wsk/${verb}`, drawGrid, opts)
}
