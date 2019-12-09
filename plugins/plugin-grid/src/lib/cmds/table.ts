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
import { Arguments, Registrar, MultiModalResponse } from '@kui-shell/core'

import defaults from '../../defaults'
import apiVersion from '../apiVersion'
import { TableOptions } from '../options'
import { kind, ActivationData } from '../../models/activation-data'

import { summary as usage } from '../../usage'
import { fetchActivationData, titleWhenNothingSelected, formatStats } from '../util'

const viewName = 'Summary'

/*
const choicesArray = (state: State): UI.Mode[] => choices.map((choice, idx) => {
  const { bottom, top, label, text } = choice
  const mode = label || `${bottom}-${top}`
  return {
    mode,
    label: mode,
    flush: 'right',
    // labelBelow: true,
    balloon: `Show the ${text || bottom + 'th to the ' + top + 'th percentile of'} latency`,
    actAsButton: true,
    selected: idx === 0,
    direct: () => {
      state.eventBus.emit('/summary/range/change', choice)
    }
  }
})
const tableModes = (state: State): UI.Mode[] => choicesArray(state).concat([
  // this is the bottom stripe button that toggles whether outliers are shown
  // note how we specify that this is a radio button, i.e. a toggler
  {
    mode: 'outliers',
    fontawesome: 'fas fa-exclamation',
    flush: 'right',
    balloon: 'Include outlier activations with very high latency',
    actAsButton: true,
    radioButton: true,
    selected: false,
    direct: () => {
      const showOutliers = !state.showOutliers
      state.showOutliers = showOutliers
      state.eventBus.emit(`/summary/range/outliers/toggle`, { showOutliers })
    }
  }
])
*/

/**
 * Visualize the activation data
 *
 */
const drawTable = (verb: string) => async ({
  tab,
  argvNoOptions,
  parsedOptions
}: Arguments<TableOptions>): Promise<MultiModalResponse<ActivationData<TableOptions>>> => {
  const N = parsedOptions.batches || defaults.N
  const name = argvNoOptions[argvNoOptions.indexOf(verb) + 1]
  const activations = await fetchActivationData(tab, N, Object.assign(parsedOptions, { name }))

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
    defaultMode: 'summary',
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

  registrar.listen(`/wsk/table`, drawTable('table'), opts)
  registrar.listen(`/summary`, drawTable('summary'), opts)
}
