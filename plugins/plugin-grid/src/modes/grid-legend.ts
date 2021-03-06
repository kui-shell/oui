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

import { Tab } from '@kui-shell/core'

import { ActivationData, isActivationData } from '../models/activation-data'
import { GridOptions } from '../lib/options'
import { formatLegend } from '../lib/legend'

/**
 * Display grid legend
 *
 */
export default {
  when: isActivationData,
  badge: (resource: ActivationData<GridOptions>, tab: Tab) => formatLegend(tab, 'Grid', resource.content.stats)
}
