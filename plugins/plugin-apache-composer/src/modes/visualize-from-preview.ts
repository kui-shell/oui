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

import { inBrowser, unparse, Tab } from '@kui-shell/core'
import { Preview, isPreview } from '../models/resource'

/**
 * Flow view from a Preview
 *
 */
export default {
  when: isPreview,
  mode: {
    mode: 'visualization',
    order: -10,

    content: async (tab: Tab, preview: Preview) => {
      const { visualize } = await import('@kui-shell/plugin-wskflow')

      const empty = () => {
        if (preview.container.childNodes[0]) {
          preview.container.removeChild(preview.container.childNodes[0])
        }
      }
      const renderOnce = async () => {
        const { view } = await visualize(tab, preview.ast)
        empty()
        preview.container.appendChild(view)
      }
      await renderOnce()

      // and set up a file watcher to re-render upon change of the file
      if (!preview.alreadyWatching && !inBrowser()) {
        preview.alreadyWatching = true
        const chokidar = await import('chokidar')
        chokidar.watch(preview.input).on('change', async (path: string) => {
          // debug('change observed to file', path)
          try {
            preview.ast = (await tab.REPL.qexec<Preview>(`${preview.cmd} ${path} ${unparse(preview.options)}`)).ast
            renderOnce()
          } catch (err) {
            empty()
            const errDom = document.createElement('div')
            errDom.classList.add('apache-composer--composition-error')
            errDom.classList.add('padding-content', 'scrollable', 'monospace')
            errDom.classList.add('red-text')
            errDom.innerText = err.toString()
            preview.container.appendChild(errDom)
          }
        })
      }

      return preview.container as HTMLElement
    }
  }
}
