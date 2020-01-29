/*
 * Copyright 2019-2020 IBM Corporation
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

import { Tab, StatusStripeController, StatusTextWithIcon } from '@kui-shell/core'
import { Activation } from '../../models/resource'

/** number of activations to display in the widget */
const nCells = 10

const enum Colors {
  empty = 'var(--color-ui-02)'
}

/**
 * Construct the skeleton UI
 *
 */
function newWidget() {
  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.justifyContent = 'space-between'
  container.style.width = `calc(${nCells} * (1em + 1px) - 1px)`

  for (let idx = 0; idx < nCells; idx++) {
    const cell = document.createElement('div')
    cell.style.width = '1em'
    cell.style.height = '1em'
    cell.style.backgroundColor = Colors.empty
    container.appendChild(cell)
  }

  return container
}

export const nLatencyBuckets = 6
const n100 = 2
const n1000 = 2
const n7000 = 2
export const latencyBuckets = [50, 100, 500, 1000, 3500, 3500]
export const latencyBucket = (value: number) => {
  const nBuckets = latencyBuckets.length
  // return Math.min(nBuckets - 1, value < 100 ? ~~(value / (100/6)) : value < 1000 ? 6 + ~~(value / (1000/5)) : value < 7000 ? 11 + ~~(value / (6000/5)) : nBuckets - 1)
  return Math.min(
    nBuckets - 1,
    value < 100
      ? ~~(value / (100 / n100))
      : value < 1000
      ? n100 + ~~(value / (900 / n1000))
      : value < 7000
      ? n100 + n1000 + ~~(value / (6000 / n7000))
      : nBuckets - 1
  )
}

/**
 * On default events (new tab, tab switch, command execution), we
 * will update the text element.
 *
 */
function listener(tab: Tab, controller: StatusStripeController, fragment: StatusTextWithIcon) {
  setTimeout(async () => {
    try {
      // fetch both the current context name, and the list of KubeContext objects */
      const activations = (await tab.REPL.rexec<Activation[]>(`wsk activation list --limit ${nCells}`)).content

      // render the current context into the UI
      activations.forEach((activation, idx) => {
        const latency = activation.duration
        const cell = fragment.text.children[idx] as HTMLElement

        cell.classList.add('clickable')
        cell.onclick = () => tab.REPL.pexec(`wsk activation get ${activation.activationId}`)
        cell.style.backgroundColor =
          activation.statusCode === 0 ? `var(--color-latency-${latencyBucket(latency)})` : `var(--color-error)`
      })

      // backfill as empty
      for (let idx = activations.length; idx < nCells; idx++) {
        const cell = fragment.text.children[idx] as HTMLElement
        cell.style.backgroundColor = Colors.empty
        cell.classList.remove('clickable')
      }

      // only show normally if we succeed; see https://github.com/IBM/kui/issues/3537
      controller.showAs('normal')
    } catch (err) {
      controller.showAs('hidden')
    }
  }, 500)
}

/**
 * @return our fragment spec: an icon, a text container, and onclick
 * handlers
 *
 */
export default function() {
  const fragment = {
    id: 'kui--plugin-openwhisk--grid-widget',
    icon: '',
    iconIsNarrow: true,
    text: newWidget()
  }

  return {
    fragment,
    listener
  }
}
