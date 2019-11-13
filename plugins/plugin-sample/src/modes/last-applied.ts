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

import { Tab } from '@kui-shell/core/api/ui-lite'
import { KubeResource } from '@kui-shell/plugin-kubeui'

/**
 * @return The last-applied-configuration annotation, as a raw string
 *
 */
function getLastAppliedRaw(resource: KubeResource): string {
  const annotations = resource.metadata.annotations
  return annotations !== undefined && annotations['kubectl.kubernetes.io/last-applied-configuration']
}

/**
 * @return whether the given resource has a last applied configuration annotation
 *
 */
function hasLastApplied(resource: KubeResource): boolean {
  return getLastAppliedRaw(resource) !== undefined
}

/**
 * The main work here is to extract and parse the JSON, and turn it
 * into something we want to display: a yaml string.
 *
 */
const renderLastApplied = async (tab: Tab, resource: KubeResource) => {
  // this module is expensive to load, so we defer that expense
  const { safeDump } = await import('js-yaml')

  // raw is a JSON string, but we want a YAML string
  return {
    content: safeDump(JSON.parse(getLastAppliedRaw(resource))),
    contentType: 'yaml'
  }
}

/**
 * This is our mode model for the Last Applied tab.
 *
 */
export default {
  when: hasLastApplied,
  mode: {
    mode: 'demo2',
    content: renderLastApplied
  }
}
