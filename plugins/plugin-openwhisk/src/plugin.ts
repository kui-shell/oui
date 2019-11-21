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

import { Commands } from '@kui-shell/core'

import cp from './lib/cmds/copy'
import mv from './lib/cmds/mv'
import rm from './lib/cmds/rm'
import auth from './lib/cmds/auth'
import wipe from './lib/cmds/wipe'
import context from './lib/cmds/context'
import loadTest from './lib/cmds/load-test'
import letCommand from './lib/cmds/actions/let'
import webbify from './lib/cmds/actions/webbify'
import last from './lib/cmds/activations/last'
import on from './lib/cmds/rules/on'
import every from './lib/cmds/rules/every'
// import core from './lib/cmds/openwhisk-core'

import listAll from './controller/list-all'

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

export default async (commandTree: Commands.Registrar) => {
  //  await core(commandTree)

  // oui value-add commands, on top of the basic openwhisk commands
  await cp(commandTree)
  await mv(commandTree)
  await rm(commandTree)
  await auth(commandTree)
  await wipe(commandTree)
  await context(commandTree)
  await listAll(commandTree)
  await loadTest(commandTree)
  await letCommand(commandTree)
  await webbify(commandTree)
  await last(commandTree)
  await on(commandTree)
  await every(commandTree)

  // basic openwhisk namespace commands
  namespaceGet(commandTree)
  namespaceList(commandTree)
  namespaceListActions(commandTree)
  namespaceListPackages(commandTree)
  namespaceListRules(commandTree)
  namespaceListTriggers(commandTree)

  // basic openwhisk action commands
  actionGet(commandTree)
  actionList(commandTree)
  actionAsync(commandTree)
  actionCreate(commandTree)
  actionDelete(commandTree)
  actionInvoke(commandTree)

  // basic openwhisk trigger commands
  triggerGet(commandTree)
  triggerFire(commandTree)
  triggerList(commandTree)
  triggerCreate(commandTree)
  triggerDelete(commandTree)

  // basic openwhisk package commands
  packageGet(commandTree)
  packageBind(commandTree)
  packageList(commandTree)
  packageCreate(commandTree)
  packageDelete(commandTree)
  packageListActions(commandTree)
  packageListFeeds(commandTree)

  // basic openwhisk activation commands
  activationGet(commandTree)
  activationList(commandTree)
  activationLogs(commandTree)
  activationAwait(commandTree)
  activationResult(commandTree)

  // basic openwhisk rule commands
  ruleGet(commandTree)
  ruleList(commandTree)
  ruleCreate(commandTree)
  ruleDelete(commandTree)
  ruleStatus(commandTree)
}
