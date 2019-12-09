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

import { Tab, currentSelection as coreCurrentSelection } from '@kui-shell/core'

import { OpenWhiskResource } from './resource'

export function currentSelection<T extends OpenWhiskResource>(tab: Tab, mustBeKind?: string): T {
  const selection = coreCurrentSelection(tab) as T

  if (selection && mustBeKind && mustBeKind !== selection.kind) {
    throw new Error('The current entity is not of the expected kind')
  }

  return selection
}
