/*
 * Copyright 2017-2019 IBM Corporation
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

import Debug from 'debug'
import { existsSync, readFileSync } from 'fs'
import { type as osType } from 'os'

import { Capabilities, Commands, eventBus, Settings, REPL, UI, Util } from '@kui-shell/core'

import agent from '../models/agent'
import { isCRUDable } from '../models/crudable'
import { synonymsTable } from '../models/synonyms'
import { actionSpecificModes, activationModes } from '../models/modes'
import { ow as globalOW, apihost, initOWFromConfig, initOW } from '../models/auth'
import { Action, Rule, Annotations, Parameters, Package } from '../models/openwhisk-entity'

import * as namespace from '../models/namespace'

const debug = Debug('plugins/openwhisk/cmds/core-commands')

/**
 * This plugin adds commands for the core OpenWhisk API.
 *
 */

import * as usage from './openwhisk-usage'
const isLinux = osType() === 'Linux'

debug('modules loaded')

export const getClient = (execOptions: Commands.ExecOptions) => {
  if (execOptions && execOptions.credentials && execOptions.credentials.openwhisk) {
    return initOWFromConfig(execOptions.credentials.openwhisk)
  } else {
    return globalOW
  }
}

// some verbs not directly exposed by the openwhisk npm (hidden in super-prototypes)
const alreadyHaveGet = { namespaces: true, activations: true }
const extraVerbsForAllTypes = (type: string) => (alreadyHaveGet[type] ? [] : ['get'])
const extraVerbsForAllCRUDableTypes = ['delete', 'update']
const extraVerbs = (type: string) =>
  extraVerbsForAllTypes(type).concat(isCRUDable[type] ? extraVerbsForAllCRUDableTypes : [])

/** given /a/b/c, return /a/b */
const parseNamespace = (fqn: string) => fqn.substring(0, fqn.lastIndexOf('/'))
const parseName = (fqn: string) => fqn.substring(fqn.lastIndexOf('/') + 1)

const booleans = {
  actions: {
    create: ['sequence', 'native', 'copy', 'web']
  }
}
booleans.actions['update'] = booleans.actions.create

/** turn a key-value map into an array of {key:, value:} objects */
const toArray = (map: Record<string, string>) => {
  const A = []
  for (const key in map) {
    A.push({ key: key, value: map[key] })
  }
  return A
}

type ParameterMap = Record<
  string,
  {
    parameters?: { key: string; value: string }[]
    limits?: Record<string, number>
  }
>

/** update the parameter mapping M.params with the mapping stored in a given file */
const paramFile = (M: ParameterMap, idx: number, argv: string[], type: string) => {
  if (!M[type]) M[type] = {}
  if (!M[type].parameters) {
    M[type].parameters = []
  }

  const file = argv[++idx]
  const params = JSON.parse(readFileSync(Util.expandHomeDir(file)).toString())
  M[type].parameters = M[type].parameters.concat(toArray(params))

  return idx + 1
}

const isBinary = {
  yml: true, // not JSON friendly
  svg: true, // not JSON friendly
  xml: true, // not JSON friendly
  pem: true,
  png: true,
  jpg: true,
  jpeg: true,
  tiff: true,
  pdf: true,
  zip: true,
  gz: true,
  bz2: true,
  aiff: true,
  wav: true,
  ogg: true,
  mov: true,
  mp4: true
}

const handleKeyValuePairAsArray = (key: string) => (M, idx: number, argv: string[], type: string) => {
  if (!argv[idx + 1] || !argv[idx + 2]) {
    return idx + 1
  }

  if (!M[type]) M[type] = {}
  if (!M[type][key]) {
    M[type][key] = []
  }

  if (argv[idx + 1].charAt(0) === '-') {
    try {
      // it might be a negative number...
      JSON.parse(argv[idx + 1])
    } catch (e) {
      throw new Error(`Parse error: expected string, got an option ${argv[idx + 1]}`)
      // return idx + 1
    }
  }
  if (argv[idx + 2].charAt(0) === '-') {
    try {
      // it might be a negative number...
      JSON.parse(argv[idx + 2])
    } catch (e) {
      throw Error(`Parse error: expected string, got an option ${argv[idx + 2]}`)
      // return idx + 1
    }
  }

  const paramName = argv[++idx]
  let paramValue = argv[++idx]
  let startQuote: string
  if (paramValue.startsWith('"')) {
    startQuote = '"'
  } else if (paramValue.startsWith("'")) {
    startQuote = "'"
  }
  if (startQuote) {
    while (!argv[idx].endsWith(startQuote)) {
      paramValue = `${paramValue} ${argv[++idx]}`
    }
    // paramValue = paramValue.replace(new RegExp(startQuote, 'g'), '')
  }

  if (paramValue.charAt(0) === '$') {
    paramValue = process.env[paramValue]
  }

  if (paramValue.charAt(0) === '@') {
    // this is an @file form of parameter. read in the file
    // !!!!!!! FIXME cap the size of the file to avoid bombing out
    if (paramValue.charAt(1) === '$') {
      debug('filename from env var', paramValue.substring(2))
      paramValue = `@${process.env[paramValue.substring(2)]}`
    }

    const location = Util.expandHomeDir(paramValue.substring(1))
    if (!existsSync(location)) {
      throw new Error(`Requested parameter @file does not exist: ${location}`)
    } else {
      const extension = location.substring(location.lastIndexOf('.') + 1)
      const encoding = isBinary[extension] ? 'base64' : 'utf8'
      debug('encoding', encoding)

      paramValue = readFileSync(location).toString(encoding)
    }
  }

  // see if the value is JSON
  try {
    paramValue = JSON.parse(paramValue)
  } catch (e) {
    // console.error('NOT JSON', paramValue, typeof paramValue, argv)
    // console.error(e)
  }

  M[type][key].push({
    key: paramName,
    value: paramValue
  })

  return idx + 1
}
const param = handleKeyValuePairAsArray('parameters')
const annotation = handleKeyValuePairAsArray('annotations')
function isNumeric(input) {
  // a rough approximation
  // eslint-disable-next-line eqeqeq
  return input - 0 == input && ('' + input).trim().length > 0
}
const limits = (key: string) => (M: ParameterMap, idx: number, argv: string[], type: string) => {
  if (!M[type]) M[type] = {}
  if (!M[type].limits) M[type].limits = {}

  const valueString = argv[idx + 1]
  let value = parseInt(valueString, 10)

  // check that the value is a valid integer
  if (!isNumeric(valueString)) {
    if (key === 'timeout' && valueString && (valueString.endsWith('s') || valueString.endsWith('m'))) {
      value = require('parse-duration')(valueString)
    } else {
      throw new Error(
        `Invalid ${key} limit: expected integer, but got ${valueString === undefined ? 'nothing' : valueString}.`
      )
    }
  }

  M[type].limits[key] = value
  return idx + 2
}
const keyValueParams = {
  '-p': param,
  '--param': param,
  '--param-file': paramFile,
  '-P': paramFile,
  '-a': annotation,
  '--annotation': annotation,
  '-m': limits('memory'),
  '--memory': limits('memory'),
  '-l': limits('logs'),
  '--log': limits('logs'),
  '--logs': limits('logs'),
  '--logsize': limits('logs'),
  '-t': limits('timeout'),
  '--timeout': limits('timeout')
}
const extractKeyValuePairs = (
  argv: string[],
  type: string
): {
  action?: { annotations?: Annotations; parameters?: Parameters }
  trigger?: { annotations?: Annotations; parameters?: Parameters }
  package?: { annotations?: Annotations; parameters?: Parameters }
  rule?: { annotations?: Annotations; parameters?: Parameters }
} => {
  const options = {}
  for (let idx = 0; idx < argv.length; ) {
    const handler = keyValueParams[argv[idx]]
    if (handler) {
      const idxBefore = idx
      idx = handler(options, idx, argv, type) || idxBefore + 1
      for (let i = idxBefore; i < idx; i++) {
        argv[i] = undefined
      }
    } else {
      idx++
    }
  }
  return options
}

/** ignore these methods from the openwhisk npm */
const ignore = {
  constructor: true,
  activation: true,
  get_activation: true, // eslint-disable-line @typescript-eslint/camelcase
  action_body: true, // eslint-disable-line @typescript-eslint/camelcase
  rule_body: true, // eslint-disable-line @typescript-eslint/camelcase
  qs: true,
  invoke_options: true, // eslint-disable-line @typescript-eslint/camelcase
  invoke_params: true, // eslint-disable-line @typescript-eslint/camelcase
  convert_to_fqn: true, // eslint-disable-line @typescript-eslint/camelcase

  packages: {
    invoke: true // the openwhisk npm has package.invoke, which just throws an error. oof
  },
  rules: {
    invoke: true // the openwhisk npm has package.invoke, which just throws an error. oof
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Special {
  get?: any
  bind?: any
  list?: any
  invoke?: any
  create?: any
  update?: any
}
/* eslint-enable @typescript-eslint/no-explicit-any */
const BlankSpecial: Special = { create: false, update: false }
const specials = {
  api: BlankSpecial,
  actions: BlankSpecial,
  triggers: BlankSpecial,
  rules: BlankSpecial,
  packages: BlankSpecial,
  activations: BlankSpecial
}

export const addPrettyType = (entityType: string, verb: string, entityName?: string) => async entity => {
  if (typeof entity === 'string') {
    return {
      type: entityType,
      verb: verb,
      name: entity,
      onclick: false
    }
  } else if (verb === 'invoke' || verb === 'fire') {
    if (verb === 'fire' || entityType.match(/trigger/)) {
      eventBus.emit('/trigger/fire')
    }
    entity.type = 'activations'
    entity.entity = { name: entityName }
  } else {
    if (!entity.type) {
      entity.type = entityType
    }
    if (
      (entity.exec && entity.exec.kind === 'sequence') ||
      (entity.annotations && entity.annotations.find(kv => kv.key === 'exec' && kv.value === 'sequence'))
    ) {
      entity.prettyType = 'sequence'
    }

    /* if (entity.annotations
       && entity.annotations.find(kv => kv.key === 'kind' && kv.value === 'sequence')) {
       // sequence activations
       entity.prettyType = 'sequence'
       } */

    if (entity.binding === true || (entity.binding && entity.binding.name)) {
      entity.prettyType = 'binding'
    }

    // add package attribute
    if (entity.namespace) {
      const slashIndex = entity.namespace.indexOf('/')
      if (slashIndex >= 0) {
        entity.packageName = entity.namespace.substring(slashIndex + 1)
      }
    }

    // add verb
    entity.verb = verb

    // add apihost
    entity.apiHost = apihost
  }

  if (specials[entityType] && specials[entityType][verb]) {
    try {
      const res = specials[entityType][verb]({
        name: entity.name,
        namespace: entity.namespace
      })
      entity.modes = res && res.modes && res.modes(entity)
    } catch (e) {
      console.error(e)
    }
  }

  // action-specific cells
  const kind = entity.annotations && entity.annotations.find(({ key }) => key === 'exec')
  if (kind && kind.value) {
    entity.kind = kind.value
  }

  if (verb === 'list' && entity.name) {
    //
    // then this is the .map(addPrettyName) part of a list result
    //
    if (!entity.onclick) {
      // a postprocess handler might have already added an onclick handler
      entity.onclick = `wsk ${entity.type} get ${REPL.encodeComponent(`/${entity.namespace}/${entity.name}`)}`
    }

    if (entity.type === 'actions' && entity.prettyType === 'sequence') {
      // add a fun a->b->c rendering of the sequence
      const action = REPL.qexec<Action>(`wsk action get "/${entity.namespace}/${entity.name}"`)
      const ns = REPL.qexec<string>('wsk namespace current')

      entity.prettyVersion = await action.then(async action => {
        if (action.exec && action.exec.components) {
          const nsPattern = new RegExp('^/' + (await ns) + '/')
          return action.exec.components
            .map(_ => _.replace(nsPattern, '')) // remove the namespace, to keep it a bit shorter
            .join(' \u27f6 ')
          //        ^^^^^^ this is a unicode ->
        }
      })
    } else if (entity.type === 'rules') {
      // rule-specific cells
      const rule = REPL.qexec<Rule>(`wsk rule get "/${entity.namespace}/${entity.name}"`)

      entity.status = rule.then(rule => rule.status)
      entity.prettyVersion = await rule.then(rule => `${rule.trigger.name} \u27fc ${rule.action.name}`)
      //                                                                   ^^^^^^ this is a unicode |->
    }
  }

  return entity
}

const extensionToKind = {
  jar: 'java:default',
  js: 'nodejs:default',
  py: 'python:default'
}

/** return the fully qualified form of the given entity name */
const fqn = (name: string): string => {
  const A = name.split('/')
  if (A.length < 3) {
    // just the action name (length === 1) or just the packag/eaction (length === 2)
    return `/_/${name}`
  } else {
    return name
  }
}

/** for parametrizable entity types, e.g. actions, packages, the standard view modes */
const standardViewModes = (defaultMode, fn?) => {
  const makeModes = (): UI.Mode[] => {
    let modes: UI.Mode[] = [
      { mode: 'parameters', label: 'params', direct: 'wsk action parameters' },
      { mode: 'annotations', direct: 'wsk action annotations' },
      { mode: 'raw', direct: 'wsk action raw' }
    ]

    if (defaultMode) {
      if (!Array.isArray(defaultMode)) {
        if (!modes.find(_ => _.mode === defaultMode)) {
          // only add the defaultMode if it isn't already in the list
          const mode = defaultMode.mode || defaultMode
          modes.splice(0, 0, {
            mode,
            defaultMode: typeof mode === 'string' || mode.default,
            direct: `wsk action ${mode}`
          })
        }
      } else {
        modes = defaultMode.concat(modes)
      }
    }

    return modes
  }

  if (fn) {
    return (
      options: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
      argv: string[],
      verb: string,
      execOptions: Commands.ExecOptions
    ) =>
      Object.assign(fn(options, argv, verb, execOptions) || {}, {
        modes: () => makeModes()
      })
  } else {
    return () => ({ modes: () => makeModes() })
  }
}

interface WskOpts {
  action?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    annotations: { key: string; value: any }[]
  }
}
export const owOpts = (options = {}): WskOpts => {
  if (isLinux) {
    // options.forever = true
    options['timeout'] = 5000
    options['agent'] = agent()
  }

  if (Settings.theme.userAgent && !process.env.TEST_SPACE && !process.env.TRAVIS) {
    // install a User-Agent header, except when running tests
    debug('setting User-Agent', Settings.theme.userAgent)
    options['User-Agent'] = Settings.theme.userAgent
  }

  if (Capabilities.inBrowser()) {
    options['noUserAgent'] = true
  }

  return options
}

/** api gateway actions */
specials.api = {
  get: (options, argv: string[]) => {
    if (!options) return
    const maybeVerb = argv[1]
    const split = options.name.split('/')
    let path = options.name
    if (split.length > 0) {
      options.name = `/${split[1]}`
      path = `/${split[2]}`
    }
    return {
      postprocess: res => {
        // we need to present the user with an entity of some
        // sort; the "api create" api does not return a usual
        // entity, as does the rest of the openwhisk API; so
        // we have to manufacture something reasonable here
        debug('raw output of api get', res)
        const { apidoc } = res.apis[0].value
        const { basePath } = apidoc
        const apipath = apidoc.paths[path]
        const verb = maybeVerb || Object.keys(apipath)[0]
        const { action: name, namespace } = apipath[verb]['x-openwhisk']
        debug('api details', namespace, name, verb)

        // our "something reasonable" is the action impl, but
        // decorated with the name of the API and the verb
        return REPL.qexec(`wsk action get "/${namespace}/${name}"`).then(action =>
          Object.assign(action, {
            name,
            namespace,
            packageName: `${verb} ${basePath}${path}`
          })
        )
      }
    }
  },
  create: (options, argv: string[]) => {
    if (argv && argv.length === 3) {
      options.basepath = options.name
      options.relpath = argv[0]
      options.operation = argv[1]
      options.action = argv[2]
    } else if (argv && argv.length === 2) {
      options.relpath = options.name
      options.operation = argv[0]
      options.action = argv[1]
    } else if (options && options['config-file']) {
      // fs.readFileSync(options['config-file'])
      throw new Error('config-file support not yet implemented')
    }

    return {
      preprocess: (_, execOptions) => {
        // we need to confirm that the action is web-exported
        const ow = getClient(execOptions)

        // this is the desired action impl for the api
        const name = argv[argv.length - 1]
        debug('fetching action', name)
        return ow.actions
          .get(owOpts({ name }))
          .then(action => {
            const isWebExported = action.annotations.find(({ key }) => key === 'web-export')
            if (!isWebExported) {
              const error = new Error(
                `Action '${name}' is not a web action. Issue 'wsk action update "${name}" --web true' to convert the action to a web action.`
              )
              error['code'] = 412 // precondition failed
              throw error
            }
          })
          .then(() => _) // on success, return whatever preprocess was given as input
          .catch(err => {
            if (err.statusCode === 404) {
              const error = new Error(`Unable to get action '${name}': The requested resource does not exist.`)
              error['code'] = 404 // not found
              throw error
            } else {
              throw err
            }
          })
      },
      postprocess: ({ apidoc }) => {
        const { basePath } = apidoc
        const path = Object.keys(apidoc.paths)[0]
        const api = apidoc.paths[path]
        const verb = Object.keys(api)[0]
        const { action: name, namespace } = api[verb]['x-openwhisk']

        // manufacture an entity-like object
        return REPL.qexec(`wsk action get "/${namespace}/${name}"`).then(action =>
          Object.assign(action, {
            name,
            namespace,
            packageName: `${verb} ${basePath}${path}`
          })
        )
      }
    }
  },
  list: () => {
    return {
      // turn the result into an entity tuple model
      postprocess: res => {
        debug('raw output of api list', res)

        // main list for each api
        return Util.flatten(
          (res.apis || []).map(({ value }) => {
            // one sublist for each path
            const basePath = value.apidoc.basePath
            const baseUrl = value.gwApiUrl

            return Util.flatten(
              Object.keys(value.apidoc.paths).map(path => {
                const api = value.apidoc.paths[path]

                // one sub-sublist for each verb of the api
                return Object.keys(api).map(verb => {
                  const { action, namespace } = api[verb]['x-openwhisk']
                  const name = `${basePath}${path}`
                  const url = `${baseUrl}${path}`
                  const actionFqn = `/${namespace}/${action}`

                  // here is the entity for that api/path/verb:
                  return {
                    name,
                    namespace,
                    onclick: () => {
                      return REPL.pexec(`wsk api get ${REPL.encodeComponent(name)} ${verb}`)
                    },
                    attributes: [
                      { key: 'verb', value: verb },
                      {
                        key: 'action',
                        value: action,
                        onclick: () => REPL.pexec(`wsk action get ${REPL.encodeComponent(actionFqn)}`)
                      },
                      {
                        key: 'url',
                        value: url,
                        fontawesome: 'fas fa-external-link-square-alt',
                        css: 'clickable clickable-blatant',
                        onclick: () => window.open(url, '_blank')
                      },
                      {
                        key: 'copy',
                        fontawesome: 'fas fa-clipboard',
                        css: 'clickable clickable-blatant',
                        onclick: evt => {
                          const target = evt.currentTarget
                          require('electron').clipboard.writeText(url)

                          const svg = target.querySelector('svg')
                          svg.classList.remove('fa-clipboard')
                          svg.classList.add('fa-clipboard-check')

                          setTimeout(() => {
                            const svg = target.querySelector('svg')
                            svg.classList.remove('fa-clipboard-check')
                            svg.classList.add('fa-clipboard')
                          }, 1500)
                        }
                      }
                    ]
                  }
                })
              })
            )
          })
        )
      }
    }
  }
}

specials.actions = {
  get: standardViewModes(actionSpecificModes),
  update: BlankSpecial, // updated below
  create: standardViewModes(actionSpecificModes, (options, argv, verb, execOptions) => {
    if (!options || !argv) return

    if (!options.action) options.action = {}
    if (!options.action.exec) options.action.exec = {}

    if (options.web) {
      if (!options.action.annotations) options.action.annotations = []
      options.action.annotations.push({ key: 'web-export', value: true })

      if (options['content-type']) {
        options.action.annotations.push({
          key: 'content-type-extension',
          value: options['content-type']
        })
      }
    }

    if (options.sequence) {
      options.action.exec = {
        kind: 'sequence',
        components: argv[0].split(/,\s*/).map(fqn) // split by commas, and we need fully qualified names
      }
    } else if (options.copy) {
      // copying an action
      const src = argv[argv.length - 1]
      const dest = options.name
      debug('action copy SRC', src, 'DEST', dest, argv)

      return {
        options: getClient(execOptions)
          .actions.get(owOpts({ name: src }))
          .then(action => {
            if (options.action.parameters && !action.parameters) {
              action.parameters = options.action.parameters
            } else if (options.action.parameters) {
              action.parameters = action.parameters.concat(options.action.parameters)
            }
            if (options.action.annotations && !action.annotations) {
              action.annotations = options.action.annotations
            } else if (options.action.annotations) {
              action.annotations = action.annotations.concat(options.action.annotations)
            }
            return {
              name: dest,
              action: action
            }
          })
      }
    } else if (verb !== 'update' || argv[0]) {
      // for action create, or update and the user gave a
      // positional param... find the input file
      if (options.docker) {
        // blackbox action
        options.action.exec.kind = 'blackbox'
        options.action.exec.image = options.docker
      }

      if (argv[0]) {
        // find the file named by argv[0]
        const filepath = Util.findFile(Util.expandHomeDir(argv[0]))
        const isZip = argv[0].endsWith('.zip')
        const isJar = argv[0].endsWith('.jar')
        const isBinary = isZip || isJar
        const encoding = isBinary ? 'base64' : 'utf8'

        if (argv[0].charAt(0) === '!') {
          // read the file from execOptions
          const key = argv[0].slice(1)
          options.action.exec.code = execOptions && (execOptions.parameters[key] || execOptions.params[key])

          // remove traces of this from params
          if (execOptions.parameters) delete execOptions.parameters[key]
          if (execOptions.params) delete execOptions.params[key]
          options.action.parameters = options.action.parameters.filter(({ key: otherKey }) => key !== otherKey)

          debug('code passed programmatically', options.action, execOptions)
          if (!options.action.exec.code) {
            debug('Could not find code', execOptions)
            throw new Error('Could not find code')
          }
        } else {
          options.action.exec.code = readFileSync(filepath).toString(encoding)
        }

        if (!options.action.annotations) options.action.annotations = []
        options.action.annotations.push({ key: 'file', value: filepath })

        if (isBinary) {
          // add an annotation to indicate that this is a managed action
          options.action.annotations.push({
            key: 'wskng.combinators',
            value: [
              {
                type: 'action.kind',
                role: 'replacement',
                badge: isZip ? 'zip' : 'jar'
              }
            ]
          })

          options.action.annotations.push({ key: 'binary', value: true })
        }

        if (options.native) {
          // native code blackbox action
          options.action.exec.kind = 'blackbox'
          options.action.exec.image = 'openwhisk/dockerskeleton'
        }

        eventBus.emit('/action/update', {
          file: filepath,
          action: { name: options.name, namespace: options.namespace }
        })

        // set the default kind
        if (!options.action.exec.kind) {
          if (options.kind) {
            options.action.exec.kind = options.kind
          } else {
            const extension = filepath.substring(filepath.lastIndexOf('.') + 1)
            if (extension) {
              options.action.exec.kind = extensionToKind[extension] || extension
            }
          }
        }
      }
    } else {
      // then we must remove options.exec; the backend fails if an empty struct is passed
      delete options.action.exec
    }

    if (options.main && options.action.exec) {
      // main method of java actions
      options.action.exec.main = options.main
    }
  }),
  list: options => {
    // support for `wsk action list <packageName>` see shell issue #449
    if (options && options.name) {
      const parts = (options.name.match(/\//g) || []).length
      const names = options.name.split('/')
      if (parts === 2 && options.name.startsWith('/')) {
        // /namespace/package
        options.namespace = '/' + names[1]
        options.id = names[2] + '/'
      } else if (parts === 1 && options.name.startsWith('/')) {
        // /namespace
        options.namespace = options.name
      } else if (parts === 0) {
        // package
        options.id = options.name + '/'
      } else {
        // invalid entity
        options.id = options.name
      }
      delete options.name
    }
  },
  invoke: options => {
    eventBus.emit('/action/invoke', {
      name: options.name,
      namespace: options.namespace
    })

    if (options && options.action && options.action.parameters) {
      options.params =
        options.action &&
        options.action.parameters &&
        options.action.parameters.reduce((M, kv) => {
          M[kv.key] = kv.value
          return M
        }, {})
    }
  }
}

specials.activations = {
  // activations list always gets full docs, and has a default limit of 10, but can be overridden
  list: options =>
    activationModes({
      options: Object.assign({}, { limit: 10 }, options, { docs: false })
    }),
  get: () => activationModes()
}
specials.packages = {
  list: options => {
    if (options) {
      options.namespace = options.name
    }
  },
  get: standardViewModes('content'),
  create: standardViewModes('content'),
  update: standardViewModes('content'),
  bind: async (options, argv: string[]) => {
    // the binding syntax is a bit peculiar...
    const parentPackage = options.name
    const bindingName = argv[0]
    if (!parentPackage || !bindingName) {
      throw new Error(usage.bind)
    }

    const ns = await namespace.current()
    if (!ns) {
      throw new Error('namespace uninitialized')
    }

    options.name = bindingName
    if (!options.package) options.package = {}
    options.package.binding = {
      namespace: (parseNamespace(parentPackage) || ns).replace(/^\//, ''),
      name: parseName(parentPackage)
    }

    debug('package bind', options.package.binding)

    return {
      verb: 'update' // package bind becomes package update. nice
    }
  }
}
specials.rules = {
  create: (options, argv: string[]) => {
    if (argv) {
      options.trigger = argv[0]
      options.action = argv[1]
    }

    if (options && (!options.name || !options.trigger || !options.action)) {
      throw new Error('Invalid argument(s). A rule, trigger and action name are required.')
    }
  }
}
specials.triggers = {
  get: standardViewModes('parameters'),
  invoke: options => {
    if (options && options.trigger && options.trigger.parameters) {
      options.params =
        options.trigger &&
        options.trigger.parameters &&
        options.trigger.parameters.reduce((M, kv) => {
          M[kv.key] = kv.value
          return M
        }, {})
    }
  },
  update: BlankSpecial, // updated below
  create: standardViewModes('parameters', options => {
    if (options && options.feed) {
      // the openwhisk npm is a bit bizarre here for feed creation
      const feedName = options.feed
      const triggerName = options.name
      delete options.feed
      delete options.f
      delete options.name

      if (options.trigger && options.trigger.parameters) {
        options.params = options.trigger.parameters.reduce((M, kv) => {
          M[kv.key] = kv.value
          return M
        }, {})
      }

      options.feedName = feedName
      options.trigger = triggerName
      return {
        entity: 'feeds'
      }
    }
  })
}
specials.actions.update = specials.actions.create
specials.rules.update = specials.rules.create
specials.triggers.update = specials.triggers.create

/** actions => action */
const toOpenWhiskKind = (type: string) => type.substring(0, type.length - 1)

export const parseOptions = (argvFull: string[], type: string) => {
  const kvOptions = extractKeyValuePairs(argvFull, type)
  const argvWithoutKeyValuePairs = argvFull.filter(x => x) // remove nulls
  return {
    kvOptions: kvOptions,
    argv: argvWithoutKeyValuePairs
  }
}

/**
 * Update an entity
 *
 */
export const update = (execOptions: Commands.ExecOptions) => (entity, retryCount = 0) => {
  const ow = getClient(execOptions)
  const options = owOpts({
    name: entity.name,
    namespace: entity.namespace
  })
  options[toOpenWhiskKind(entity.type)] = entity
  debug('update', options)
  try {
    return ow[entity.type]
      .update(options)
      .then(addPrettyType(entity.type, 'update', entity.name))
      .catch(err => {
        console.error(`error in wsk::update ${err}`)
        console.error(err)
        if ((retryCount || 0) < 10) {
          return update(execOptions)(entity, (retryCount || 0) + 1)
        } else {
          throw err
        }
      })
  } catch (err) {
    console.error(`error in wsk::update ${err}`)
    console.error(err)
    throw err
  }
}

export const fillInActionDetails = (pkage: Package, type = 'actions') => actionSummary => {
  const kindAnnotation = actionSummary.annotations && actionSummary.annotations.find(_ => _.key === 'exec')
  const kind = kindAnnotation && kindAnnotation.value

  return Object.assign({}, actionSummary, {
    // given the actionSummary from the 'actions' field of a package entity
    type,
    packageName: pkage.name,
    namespace: `${pkage.namespace}/${pkage.name}`,
    kind,
    onclick: `wsk action get ${REPL.encodeComponent(`/${pkage.namespace}/${pkage.name}/${actionSummary.name}`)}`
  })
}

const makeInit = (commandTree: Commands.Registrar) => async (isReinit = false) => {
  debug('init')

  if (isReinit) return

  //
  // here we use globalOW, but only to introspect on the Class fields
  // and methods, not to make authenticated requests against its
  // methods
  //
  const ow = isReinit ? globalOW : initOW()

  // for each entity type
  // commandTree.subtree(`/wsk`, { usage: usage.wsk })

  for (const api in ow) {
    const clazz = ow[api].constructor
    const props = Object.getOwnPropertyNames(clazz.prototype).concat(extraVerbs(api) || [])
    // alsoInstallAtRoot = api === 'actions'

    /** return the usage model for the given (api, syn, verb) */
    const docs = (syn, verb?, alias?) => {
      const entityModel = typeof usage[api] === 'function' ? usage[api](syn) : usage[api]

      if (verb) {
        const model = entityModel && entityModel.available.find(({ command }) => command === verb)
        if (model && typeof model.fn === 'function') {
          return model.fn(alias || verb, syn)
        } else {
          return model
        }
      } else {
        return entityModel
      }
    }

    const apiMaster = commandTree.subtree(`/wsk/${api}`, { usage: docs(api) })

    // find the verbs of this entity type
    for (const idx in props) {
      const verb = props[idx]
      if (!ignore[verb] && (!ignore[api] || !ignore[api][verb])) {
        // install the route handler for the main /entity/verb
        // const handler = executor(commandTree, api, verb, verb)
        // const master = commandTree.listen(`/wsk/${api}/${verb}`, handler, { docs: docs(api, verb) })

        // install synonym route handlers
        const entities = (synonymsTable.entities[api] || []).concat([api])
        const verbs = synonymsTable.verbs[verb] || []
        entities.forEach(eee => {
          commandTree.subtreeSynonym(`/wsk/${eee.nickname || eee}`, apiMaster, {
            usage: docs(eee.nickname || eee)
          })

          /* const handler = executor(commandTree, eee.name || api, verb, verb)
           const entityAliasMaster = commandTree.listen(`/wsk/${eee.nickname || eee}/${verb}`, handler, {
            usage: docs(api, verb)
          }) */

          // register e.g. wsk action help; we delegate to
          // "wsk action", which will print out usage (this
          // comes as part of commandTree.subtree
          // registrations)
          // commandTree.listen(`/wsk/${eee.nickname || eee}/help`, () => REPL.qexec(`wsk ${eee.nickname || eee}`), { noArgs: true })

          verbs.forEach(vvv => {
            // const handler = executor(commandTree, eee.name || api, vvv.name || verb, vvv.nickname || vvv)
            if (vvv.notSynonym || vvv === verb) {
              if (vvv.limitTo && vvv.limitTo[api]) {
                /* commandTree.listen(`/wsk/${eee.nickname || eee}/${vvv.nickname || vvv}`, handler, {
                  usage: docs(api, vvv.nickname || vvv)
                }) */
              }
            } else {
              /* const handler = executor(commandTree, eee.name || api, verb, vvv.nickname || vvv)
               commandTree.synonym(`/wsk/${eee.nickname || eee}/${vvv.nickname || vvv}`, handler, entityAliasMaster, {
                usage: docs(api, verb, vvv.nickname || vvv)
              }) */
            }

            // if (alsoInstallAtRoot) {
            // commandTree.synonym(`/wsk/${vvv.nickname || vvv}`, handler, master)
            // }
          })
        })
      }
    }
  }

  debug('init done')
}

export default function(commandTree: Commands.Registrar) {
  const initSelf = makeInit(commandTree)
  return initSelf(false)
}
