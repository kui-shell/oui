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

import UI from '@kui-shell/core/api/ui'
import { WithLogs, hasLogs } from '../models/resource'

/**
 * e.g. 2017-06-15T14:41:15.60027911Z  stdout:
 *
 */
const logPatterns = {
  logLine: /^\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.[\d]+Z)\s+(\w+):\s+(.*)/
}

function content(_, resource: WithLogs): HTMLElement {
  const logTable = document.createElement('div')
  logTable.className = 'log-lines'

  let previousTimestamp: Date
  resource.logs.forEach((logLine: string) => {
    const lineDom = document.createElement('div')
    lineDom.className = 'log-line'
    logTable.appendChild(lineDom)

    const match = logLine.match(logPatterns.logLine)

    if (match) {
      const date = document.createElement('div')
      // const type = document.createElement('div')
      const mesg = document.createElement('div')
      lineDom.appendChild(date)
      // lineDom.appendChild(type)
      lineDom.appendChild(mesg)

      if (match[2] === 'stderr') {
        lineDom.classList.add('red-text')
      }

      date.className = 'log-field log-date hljs-attribute'
      // type.className = 'log-field log-type'
      mesg.className = 'log-field log-message slight-smaller-text'

      try {
        const timestamp = new Date(match[1])
        date.appendChild(UI.PrettyPrinters.time(timestamp, 'short', previousTimestamp))
        previousTimestamp = timestamp
      } catch (e) {
        date.innerText = match[1]
      }
      // type.innerText = match[2]

      if (match[3].indexOf('{') >= 0) {
        // possibly JSON?
        try {
          mesg.innerText = JSON.stringify(JSON.parse(match[3]), undefined, 2)
        } catch (err) {
          // not json!
          mesg.innerText = match[3]
        }
      } else {
        // not json!
        mesg.innerText = match[3]
      }
    } else if (typeof logLine === 'string') {
      // unparseable log line, so splat out the raw text
      lineDom.innerText = logLine
    } else if (typeof logLine === 'object') {
      const code = document.createElement('code')
      code.appendChild(document.createTextNode(JSON.stringify(logLine, undefined, 2)))
      lineDom.appendChild(code)
    } else {
      // unparseable log line, so splat out the raw text
      lineDom.appendChild(document.createTextNode(logLine))
    }
  })

  return logTable
}

/**
 * The Logs mode for activations
 *
 */
export default {
  when: hasLogs,
  mode: {
    mode: 'logs',
    content
  }
}
