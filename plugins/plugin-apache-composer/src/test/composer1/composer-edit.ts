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

//
// test the edit actionName command for compositions
//
import { Common, CLI, ReplExpect, SidecarExpect, Selectors } from '@kui-shell/test'
import * as openwhisk from '@kui-shell/plugin-openwhisk/tests/lib/openwhisk/openwhisk'

import {
  verifyTheBasicStuff,
  verifyNodeExists,
  verifyEdgeExists,
  verifyNodeAbsence
} from '@kui-shell/plugin-apache-composer/tests/lib/composer-viz-util'

import { dirname } from 'path'

const ROOT = dirname(require.resolve('@kui-shell/plugin-apache-composer/tests/package.json'))

/** set the monaco editor text */
const setValue = (client, text) => {
  return client.execute(text => {
    document.querySelector('.monaco-editor-wrapper')['editor'].setValue(text)
  }, text)
}

describe('edit compositions', function(this: Common.ISuite) {
  before(openwhisk.before(this))
  after(Common.after(this))

  /** deploy the changes */
  const deploy = (app, action) => () => {
    return app.client
      .click(Selectors.SIDECAR_MODE_BUTTON('Deploy'))
      .then(() => app.client.waitForExist(`${Selectors.SIDECAR}:not(.is-modified):not(.is-new)`))
      .then(() => app)
      .catch(err => {
        console.error('Ouch, something bad happened, let us clean up the action before retrying')
        console.error(err)
        return CLI.command(`rm ${action}`, app).then(() => {
          throw err
        })
      })
  }

  // test wskflow and wskflow undeloyed actions warning
  it(`should open the editor to a new composition and expect wskflow`, () =>
    CLI.command('compose compSimple', this.app)
      .then(verifyTheBasicStuff('compSimple'))
      .then(verifyNodeExists('A'))
      .then(verifyNodeExists('B'))
      .then(verifyEdgeExists('Entry', 'A'))
      .then(verifyEdgeExists('A', 'B'))
      .then(verifyEdgeExists('B', 'Exit'))
      .then(() =>
        setValue(this.app.client, "\nmodule.exports = require(\"openwhisk-composer\").sequence('A', 'B', 'C')")
      )
      .then(() => this.app)
      .then(verifyNodeExists('A'))
      .then(verifyNodeExists('B'))
      .then(verifyNodeExists('C'))
      .then(verifyEdgeExists('Entry', 'A'))
      .then(verifyEdgeExists('A', 'B'))
      .then(verifyEdgeExists('B', 'C'))
      .then(verifyEdgeExists('C', 'Exit'))
      .then(() => setValue(this.app.client, "\nmodule.exports = require(\"openwhisk-composer\").sequence('A', 'B')"))
      .then(() => this.app)
      .then(verifyNodeExists('A'))
      .then(verifyNodeExists('B'))
      .then(verifyNodeAbsence('C'))
      .then(verifyEdgeExists('Entry', 'A'))
      .then(verifyEdgeExists('A', 'B'))
      .then(verifyEdgeExists('B', 'Exit'))
      // .then(() => this.app.client.waitForExist('.wskflow-undeployed-action-warning'))
      .catch(Common.oops(this)))

  // deploy composition with undeployed actions
  it('should compose and successfully deploy the composition with undeloyed actions by clicking the deploy button', () =>
    CLI.command('compose compSimple', this.app)
      .then(ReplExpect.ok)
      .then(deploy(this.app, 'compSimple'))
      // .then(() => this.app.client.waitForExist('.wskflow-undeployed-action-warning'))
      .then(() =>
        this.app.client.waitUntil(() =>
          CLI.command('wsk app invoke compSimple', this.app)
            .then(ReplExpect.ok)
            .then(() => true)
            .catch(() => false)
        )
      )
      .catch(Common.oops(this)))

  // test parse error decoration
  it(`should open the editor to a new composition and expect error handling`, () =>
    CLI.command('compose compParseErr', this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('compParseErr'))
      .then(() =>
        setValue(this.app.client, '\nmodule.exports = require("openwhisk-composer").sequence(notfound1, notfound2)')
      )
      .then(() => this.app.client.waitForExist('.editor.parse-error-decoration'))
      .then(() => setValue(this.app.client, 'module.exports = require("openwhisk-composer").sequence(x=>x, y=>y)'))
      .then(() => this.app.client.waitForExist('.editor.parse-error-decoration', 2000, true))
      .catch(Common.oops(this)))

  /* it('should initialize composer', () => CLI.command(`wsk app init --url ${sharedURL} --cleanse`, this.app) // cleanse important here for counting sessions in `sessions`
       .then(ReplExpect.okWithCustom({expect: 'Successfully initialized and reset the required services. You may now create compositions.'}))
       .catch(Common.oops(this))) */

  it('should create an app from FSM', () =>
    CLI.command(`wsk app create compFromFSM ${ROOT}/data/composer/fsm.json`, this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('compFromFSM'))
      .catch(Common.oops(this)))

  it('should fail to edit the fsm-based app', () =>
    CLI.command('edit compFromFSM', this.app)
      .then(ReplExpect.error(406))
      .catch(Common.oops(this)))

  it('should create an app from source', () =>
    CLI.command(`wsk app create compFromSrc ${ROOT}/data/composer/composer-source/seq.js`, this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('compFromSrc'))
      // .then(sidecar.expectBadge(badges.composerLib))
      .catch(Common.oops(this)))

  // do this in a loop, to make sure we don't have any event listener leaks
  // Disable the test for now since we don't have soure annotation in composition
  // if (false) {
  //   it(`should edit the app with source`, () => CLI.command('edit comp2', this.app)
  //     .then(ReplExpect.ok)
  //     .then(SidecarExpect.open)
  //     .then(SidecarExpect.showing('comp2'))
  //     .then(sidecar.expectBadge('v0.0.1'))
  //     .then(deploy(this.app, 'comp2'))
  //     .then(sidecar.expectBadge('v0.0.2'))
  //     .catch(Common.oops(this)))
  // }

  it(`should fail to open the editor for compose against existing composition`, () =>
    CLI.command('compose compFromSrc', this.app)
      .then(ReplExpect.error(409))
      .catch(Common.oops(this)))

  it(`should open the editor to a new composition from a template file`, () =>
    CLI.command('compose compFromTpl -t @demos/hello.js', this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)
      .then(deploy(this.app, 'compFromTpl'))
      .then(() => this.app.client.waitForVisible('#wskflowSVG')) // the wskflow had better show up after we click Deploy
      .then(() =>
        this.app.client.waitUntil(() =>
          CLI.command('wsk app invoke compFromTpl -p name compose', this.app)
            .then(ReplExpect.ok)
            .then(SidecarExpect.open)
            .then(SidecarExpect.showing('compFromTpl'))
            .then(SidecarExpect.result({ msg: 'hello compose!' }, false))
            .then(() => true)
            .catch(() => false)
        )
      )
      .catch(Common.oops(this)))
})
