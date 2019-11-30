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

import { Preview, isPreview } from '../models/resource'

/**
 * Flow view
 *
 */
export default {
  when: isPreview,
  mode: {
    mode: 'ast',
    label: 'JSON',
    order: -9,

    content: (_, preview: Preview) => ({
      content: JSON.stringify(preview.ast, undefined, 2),
      contentType: 'json'
    })
  }
}
