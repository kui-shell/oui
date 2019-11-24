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

import { PreloadRegistrar } from '@kui-shell/core/api/registrars'

// modes
import grid from './modes/grid'
import table from './modes/table'

// badges
import gridLegend from './modes/grid-legend'

/**
 * Notes: buttons and modes and badges will be presented in the order
 * they are registered, unless they specify an `order` attribute.
 *
 */
export default async (registrar: PreloadRegistrar) => {
  registrar.registerModes(table, grid)

  registrar.registerBadge(gridLegend)
}
