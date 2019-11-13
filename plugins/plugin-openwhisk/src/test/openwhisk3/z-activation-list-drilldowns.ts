/*
 * Copyright 2017 IBM Corporation
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

/**
 * tests that create an action and test that it shows up in the list UI
 *    this test also covers toggling the sidecar
 */

import { Common, CLI, Keys, ReplExpect, SidecarExpect, Selectors } from '@kui-shell/test'
import * as openwhisk from '@kui-shell/plugin-openwhisk/tests/lib/openwhisk/openwhisk'

describe('List activations, then drill down to summary views', function(this: Common.ISuite) {
  before(openwhisk.before(this))
  after(Common.after(this))

  const drilldownWith = command => {
    return it(`should list activations and click on ${command}`, () =>
      CLI.command(`wsk $ list`, this.app)
        .then(ReplExpect.okWithCustom({ passthrough: true }))
        .then(N =>
          SidecarExpect.closed(this.app)
            .then(() => `${Selectors.OUTPUT_N(N)} .list-paginator-left-buttons span[data-button-command="${command}"]`)
            .then(sel => {
              console.error(`Looking for ${sel}`)
              return sel
            })
            .then(async sel => {
              await this.app.client.waitForEnabled(sel)
              return sel
            })
            .then(sel => this.app.client.click(sel))
            .catch(async err => {
              const txt = await this.app.client.getText(Selectors.OUTPUT_N(N))
              console.log(`huh, got this ${txt}`)
              throw err
            })
        )
        .then(() => this.app)
        .then(SidecarExpect.open)
        .then(SidecarExpect.showing('Recent Activity'))
        .catch(Common.oops(this)))
  }

  const closeSidecar = () => {
    return it('should toggle the sidebar closed with escape', () =>
      this.app.client
        .keys(Keys.ESCAPE)
        .then(() => SidecarExpect.closed(this.app))
        .catch(Common.oops(this)))
  }

  drilldownWith('summary')
  closeSidecar()

  // timeline disabled shell issue #794
  // drilldownWith('timeline')
  // closeSidecar()

  drilldownWith('grid')
  closeSidecar()
})
