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

import { Common, CLI, ReplExpect, SidecarExpect, Selectors } from '@kui-shell/test'

import * as openwhisk from '@kui-shell/plugin-openwhisk/tests/lib/openwhisk/openwhisk'

import { dirname } from 'path'

const { localDescribe } = Common
const ROOT = dirname(require.resolve('@kui-shell/plugin-openwhisk/tests/package.json'))

// TODO: webpack test
localDescribe('Create a sequence, list it, delete it', function(this: Common.ISuite) {
  before(openwhisk.before(this))
  after(Common.after(this))

  const rm = openwhisk.aliases.remove[0]

  // create an action, using the implicit entity type
  it('should create an action', () =>
    CLI.command(`wsk action create foo ${ROOT}/data/openwhisk/foo.js`, this.app)
      .then(ReplExpect.justOK)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('foo')))
  it('should create a second action', () =>
    CLI.command(`wsk action create foo2 ${ROOT}/data/openwhisk/foo2.js`, this.app)
      .then(ReplExpect.justOK)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('foo2')))

  it('should create a sequence', () =>
    CLI.command(`wsk action create --sequence sss foo,foo2`, this.app)
      .then(ReplExpect.justOK)
      .then(SidecarExpect.open)
      .then(SidecarExpect.showing('sss')))

  // list it
  it(`should find the new sequence with "list"`, () =>
    CLI.command('wsk action list', this.app).then(ReplExpect.okWith('sss')))

  // delete the actions, keeping the sequence around
  it(`should delete the newly created action using "${rm}"`, () =>
    CLI.command(`wsk action ${rm} foo`, this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)) // sidecar should stay open, since we deleted an action, not the sequence
  it(`should delete the other newly created action using "${rm}"`, () =>
    CLI.command(`wsk action ${rm} foo2`, this.app)
      .then(ReplExpect.ok)
      .then(SidecarExpect.open)) // sidecar should stay open, since we deleted an action, not the sequence

  // now try clicking on one of the sequence component bubbles
  it('should show action after clicking on bubble', async () => {
    await this.app.client.click(Selectors.SIDECAR_SEQUENCE_CANVAS_NODE_N(0))
    return SidecarExpect.open(this.app).then(SidecarExpect.showing('sss')) // since the action was deleted
  })
  // TODO check for error message "action not found"
})
