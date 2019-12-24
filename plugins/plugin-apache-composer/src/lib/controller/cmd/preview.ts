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
import { basename } from 'path'
import { readFile as fsReadFile, stat } from 'fs'

import { findFile, expandHomeDir, inBrowser, MultiModalResponse, Tab, Arguments, Registrar } from '@kui-shell/core'

import * as usage from './preview-usage'
import { invalidFSM, unknownInput } from '../../utility/messages'
import { sourceToComposition } from '../../utility/compile'
import { Preview, apiVersion } from '../../../models/resource'
import Options from './preview-options'

const debug = Debug('plugins/wskflow/preview')

const viewNameLong = 'App Visualization' //    ... long form
const defaultMode = 'visualization' // on open, which view mode should be selected?

/* interface ViewOptions {
  renderFunctionsInView?: boolean
  noHeader?: boolean
}
class DefaultViewOptions implements ViewOptions {} */

interface CompositionWithCode {
  ast?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  code?: string
}

/**
 * Error reporting
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (err: Error, reject?: (reason: any) => void) => {
  debug(err)
  if (reject) {
    reject(err)
  } else if (typeof err === 'string') {
    throw new Error(err)
  } else {
    throw err
  }
}

/**
 * Here is the app kill entry point. Here we register command
 * handlers.
 *
 */
export default (registrar: Registrar) => {
  const readFile = (input: string): Promise<string> =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const filepath = findFile(expandHomeDir(input))

      if (!inBrowser()) {
        debug('readFile in headless mode or for electron')
        fsReadFile(filepath, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data.toString())
          }
        })
      } else {
        debug('readFile for webpack')

        if (filepath.indexOf('@') >= 0) {
          debug('readFile for webpack, built-in', filepath)
          try {
            const data = await import(
              'raw-loader!@kui-shell/plugin-apache-composer/samples' +
                filepath.replace(/^.*plugin-apache-composer\/samples(.*)$/, '$1')
            )

            resolve(data)
          } catch (err) {
            console.error(err)
            const error = new Error('The specified file does not exist')
            error['code'] = 404
            reject(error)
          }
        } else {
          const error = new Error('The specified file does not exist')
          error['code'] = 404
          reject(error)
        }
      }
    })

  const render = (
    tab: Tab,
    input: string,
    options: Options,
    cmd: string,
    mode: string
  ): Promise<MultiModalResponse<Preview>> =>
    new Promise((resolve, reject) => {
      debug('options', options)

      let fsmPromise: Promise<CompositionWithCode>
      const extension = input.substring(input.lastIndexOf('.') + 1)

      if (extension === 'json' || extension === 'ast') {
        debug('input is composer AST', extension)
        try {
          fsmPromise = sourceToComposition({
            inputFile: input,
            name: basename(input)
          })
        } catch (err) {
          reject(invalidFSM)
        }
      } else if (extension === 'js' || extension === 'py') {
        debug('input is composer library client', extension)
        try {
          fsmPromise = sourceToComposition({
            inputFile: input,
            name: basename(input)
          })
          debug('composition parsed from input', fsmPromise)
        } catch (err) {
          reject(err)
        }
      } else {
        reject(unknownInput)
      }

      const name = basename(input)

      // create a fake action/entity record
      const formatForUser = (mode: string) => async (composition: CompositionWithCode) => {
        debug('formatForUser', composition)

        const { ast } = composition
        const code = await readFile(input)

        /* if (options.functions) {
          // note we must be careful not to pass false; only undefined
          viewOptions.renderFunctionsInView = options.functions !== undefined // render all inline functions directly in the view?
        } */

        const container = document.createElement('div')
        container.style.flex = '1'
        container.style.display = 'flex'

        let entity: MultiModalResponse<Preview> = {
          apiVersion,
          kind: 'Preview',
          metadata: {
            name
          },
          ast,
          input,
          cmd,
          options,
          container,
          alreadyWatching: false,
          source: code,
          defaultMode: mode,
          modes: []
        }

        entity = Object.assign(entity, {
          controlHeaders: ['sidecar-header-secondary-content'],
          toolbarText: {
            type: 'info',
            text: 'This is a preview of your composition, it is not yet deployed'
          }
        })

        if (options.ast) {
          // then the user asked to see the fsm
          debug('showing JSON')
          entity.defaultMode = 'ast'
        }

        resolve(entity)
      } /* formatForUser */

      fsmPromise.then(formatForUser(mode)).catch(err => {
        // report the error in the REPL
        if (err.ast) {
          handleError(err.ast, reject)
        } else {
          handleError(err, reject)
        }
      })
    })

  /** command handler */
  const doIt = (cmd: string, mode = defaultMode) => ({
    tab,
    REPL,
    argvNoOptions,
    parsedOptions: options
  }: Arguments<Options>) =>
    new Promise((resolve, reject) => {
      const idx = argvNoOptions.indexOf(cmd)
      const inputFile = argvNoOptions[idx + 1]

      debug('cmd', cmd)
      debug('inputFile', inputFile)

      if (options.c) {
        // then the user wants to see the code and preview side-by-side
        debug('delegating to editor')
        return resolve(REPL.qexec(`compose ${basename(inputFile)} --simple --readOnly --template "${inputFile}"`))
      }

      const input = findFile(expandHomeDir(inputFile))

      /* if (currentSelection() && currentSelection().input === input) {
             debug('already showing', input)
             return resolve(true);
         } */

      const exists = () =>
        new Promise((resolve, reject) => {
          const ENOENT = () => {
            const error = new Error('The specified file does not exist')
            error['code'] = 404
            return error
          }

          if (!inBrowser()) {
            stat(input, err => {
              if (err) {
                reject(ENOENT())
              } else {
                resolve()
              }
            })
          } else {
            if (input.indexOf('@') >= 0) {
              resolve()
            } else {
              reject(ENOENT())
            }
          }
        })

      exists()
        .then(async () => {
          // in case the user provides env vars
          const backupEnv = {}
          if (options.env) {
            debug('parsing environment variables from command line', options.env)

            for (let idx = 0; idx < options.env.length; idx += 2) {
              const key = options.env[idx]
              const value = options.env[idx + 1]

              // remember the value we're about to overwrite
              if (key in process.env) {
                debug('stashing env var', key)
                backupEnv[key] = process.env[key]
              }

              process.env[key] = value
            }

            delete options.e
          }

          try {
            const response = await render(tab, input, options, cmd, mode)
            resolve(response)
          } catch (err) {
            reject(err)
          } finally {
            // restore any env vars we smashed
            for (const key in backupEnv) {
              debug('restoring env var', key)
              process.env[key] = backupEnv[key]
            }
          }
        })
        .catch(reject)
    })

  const opts = {
    usage: usage.preview('preview'),
    needsUI: true,
    viewName: viewNameLong,
    fullscreen: true,
    width: 800,
    height: 600,
    clearREPLOnLoad: true,
    placeholder: 'Loading visualization ...'
  }
  registrar.listen(`/preview`, doIt('preview'), opts)
  const vizCmd = registrar.listen(`/wsk/app/preview`, doIt('preview'), opts)
  registrar.synonym(`/wsk/app/viz`, doIt('viz'), vizCmd, {
    usage: usage.preview('viz')
  })

  registrar.listen('/wsk/app/src', doIt('src', 'code'), {
    usage: usage.source('src')
  })
}
