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

import { ASTNode } from '@kui-shell/plugin-wskflow'
import { ResourceWithMetadata } from '@kui-shell/core'
import {
  Action,
  isAction,
  Activation,
  isActivation,
  OpenWhiskResource,
  hasAnnotation
} from '@kui-shell/plugin-openwhisk'

import PreviewOptions from '../lib/controller/cmd/preview-options'

export const apiVersion = 'apache-composer/v1'

export interface WithSource extends ResourceWithMetadata {
  source: string
}

export function hasSource(resource: WithSource | ResourceWithMetadata): resource is WithSource {
  const preview = resource as WithSource
  return typeof preview.source === 'string'
}

export interface Preview extends ResourceWithMetadata, WithSource {
  apiVersion
  kind: 'Preview'
  ast: ASTNode
  input: string

  cmd: string
  container: Element
  options: PreviewOptions
  alreadyWatching: boolean
}

export function isPreview(resource: Preview | ResourceWithMetadata): resource is Preview {
  const preview = resource as Preview
  return preview.apiVersion === apiVersion && preview.kind === 'Preview'
}

export interface Composition extends Action {
  annotations: [
    { key: 'composerVersion'; value: string },
    { key: 'conductorVersion'; value: string },
    { key: 'conductor'; value: ASTNode }
  ]
}

export function isComposition(resource: OpenWhiskResource): resource is Composition {
  return (
    isAction(resource) &&
    hasAnnotation(resource, 'composerVersion') &&
    hasAnnotation(resource, 'conductorVersion') &&
    hasAnnotation(resource, 'conductor')
  )
}

export interface Session extends Activation {
  prettyType: 'session'
}

export function isSession(resource: OpenWhiskResource): resource is Session {
  return isActivation(resource) && !!resource.annotations.find(_ => _.key === 'conductor')
}
