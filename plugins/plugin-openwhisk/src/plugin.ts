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

import { Registrar } from '@kui-shell/core/api/commands'

// namespaces
import namespaceGet from './controller/namespace/get'
import namespaceList from './controller/namespace/list'
import {
  namespaceListActions,
  namespaceListPackages,
  namespaceListRules,
  namespaceListTriggers
} from './controller/namespace/list-innards'

// actions
import actionGet from './controller/action/get'
import actionList from './controller/action/list'
import actionAsync from './controller/action/async'
import actionCreate from './controller/action/create'
import actionDelete from './controller/action/delete'
import actionInvoke from './controller/action/invoke'

// triggers
import triggerGet from './controller/trigger/get'
import triggerFire from './controller/trigger/fire'
import triggerList from './controller/trigger/list'
import triggerCreate from './controller/trigger/create'
import triggerDelete from './controller/trigger/delete'

// packages
import packageGet from './controller/package/get'
import packageBind from './controller/package/bind'
import packageList from './controller/package/list'
import packageCreate from './controller/package/create'
import packageDelete from './controller/package/delete'
import { packageListActions, packageListFeeds } from './controller/package/list-innards'

// activations
import activationGet from './controller/activation/get'
import activationList from './controller/activation/list'
import activationLogs from './controller/activation/logs'
import activationAwait from './controller/activation/await'
import activationResult from './controller/activation/result'

// rules
import ruleGet from './controller/rule/get'
import ruleList from './controller/rule/list'
import ruleCreate from './controller/rule/create'
import ruleDelete from './controller/rule/delete'
import ruleStatus from './controller/rule/status'

// oui value-add commands
import listAll from './controller/list-all'
import last from './controller/activation/last'
import webbify from './controller/action/webbify'

// finally, these commands have yet to be audited against the latest
// kui-core API
import cp from './lib/cmds/copy'
import mv from './lib/cmds/mv'
import rm from './lib/cmds/rm'
import auth from './lib/cmds/auth'
import wipe from './lib/cmds/wipe'
import context from './lib/cmds/context'
import loadTest from './lib/cmds/load-test'
import letCommand from './lib/cmds/actions/let'
import on from './lib/cmds/rules/on'
import every from './lib/cmds/rules/every'

export default async (registrar: Registrar) => {
  // oui value-add commands, on top of the basic openwhisk commands
  await last(registrar)
  await cp(registrar)
  await mv(registrar)
  await rm(registrar)
  await auth(registrar)
  await wipe(registrar)
  await context(registrar)
  await listAll(registrar)
  await loadTest(registrar)
  await letCommand(registrar)
  await webbify(registrar)
  await on(registrar)
  await every(registrar)

  // basic openwhisk namespace commands
  namespaceGet(registrar)
  namespaceList(registrar)
  namespaceListActions(registrar)
  namespaceListPackages(registrar)
  namespaceListRules(registrar)
  namespaceListTriggers(registrar)

  // basic openwhisk action commands
  actionGet(registrar)
  actionList(registrar)
  actionAsync(registrar)
  actionCreate(registrar)
  actionDelete(registrar)
  actionInvoke(registrar)

  // basic openwhisk trigger commands
  triggerGet(registrar)
  triggerFire(registrar)
  triggerList(registrar)
  triggerCreate(registrar)
  triggerDelete(registrar)

  // basic openwhisk package commands
  packageGet(registrar)
  packageBind(registrar)
  packageList(registrar)
  packageCreate(registrar)
  packageDelete(registrar)
  packageListActions(registrar)
  packageListFeeds(registrar)

  // basic openwhisk activation commands
  activationGet(registrar)
  activationList(registrar)
  activationLogs(registrar)
  activationAwait(registrar)
  activationResult(registrar)

  // basic openwhisk rule commands
  ruleGet(registrar)
  ruleList(registrar)
  ruleCreate(registrar)
  ruleDelete(registrar)
  ruleStatus(registrar)
}
