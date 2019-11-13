/*
 * Copyright 2018-19 IBM Corporation
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

import { Commands } from '@kui-shell/core'
import { Action } from '@kui-shell/plugin-openwhisk'

import { appDelete } from '../../utility/usage'
import * as view from '../../view/entity-view'

export default async (commandTree: Commands.Registrar) => {
  /* command handler for app delete */
  commandTree.listen(
    `/wsk/app/delete`,
    ({ command, REPL }) => {
      return REPL.qexec<Action>(command.replace('app', 'action')).then(result => view.formatDeleteResult(result))
    },
    { usage: appDelete }
  )
}
