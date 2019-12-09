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

export const invalidFSM = 'The app you provided does not appear to be a valid app program'

export const slowInit = 'Your storage should be active in ~60 seconds. Meanwhile, use "fsh help" to get started.'

export const unknownInput = 'Please provide either a .json/.ast file, or a .js file that uses the composer library'

export const errors = {
  lastAndLastFailed: 'You specified both --last and --last-failed. Please choose one or the other.'
}
