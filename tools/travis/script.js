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

/**
 * The goal of this script is to formulate a parallel execution of
 * tests, using `concurrently`. For example, you should expect to see
 * something like this from the `console.log` below:
 *
 * Executing concurrently [
 *  '-n',
 *  'OPENWHISK1,OPENWHISK3,GRID',
 *  'PORT_OFFSET=0 npx kui-testv2 openwhisk1',
 *  'PORT_OFFSET=1 npx kui-testv2 openwhisk3',
 *  'PORT_OFFSET=2 npx kui-testv2 grid'
 *  ]
 */

// this is the -n OPENWHISK1,OPENWHISK3,GRID part
const stepNames = process.env.S.split(/\s+/)
  .map(_ => _.toUpperCase())
  .join(',')

// this is the rest, the PORT_OFFSET=... parts
const steps = process.env.S.split(/\s+/).map((_, idx) => `PORT_OFFSET=${idx + 1} npx kui-testv2 ${_}`)

// combine them into an "args" for spawnSync
const args = ['-n', stepNames, ...steps]

// here is the promised console.log
console.log('Executing concurrently', args)

// execute that command line using spawnSync
const child = require('child_process').spawnSync('concurrently', args, { stdio: 'inherit' })

// exit according to the success or failure of that `concurrently`
process.exit(child.status)
