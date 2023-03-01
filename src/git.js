import { trytm } from '@bdsqqq/try'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

function cleanStdout (stdout) {
  return stdout.trim().split('\n').filter(Boolean)
}

export async function isGitInRepository () {
  const [, err] = await trytm(execAsync('git status'))
  return err === null
}

export async function getChangedFiles () {
  const { stdout } = await execAsync('git status -uall --porcelain')
  return cleanStdout(stdout).filter(line => !line.startsWith('A ')).map(line => line.split(' ').at(-1))
}

export async function getStagedFiles () {
  const { stdout } = await execAsync('git diff --cached --name-only')
  return cleanStdout(stdout)
}

export async function gitAdd ({ files }) {
  const filesLine = files.join(' ')
  const { stdout } = await execAsync(`git add ${filesLine}`)
  return cleanStdout(stdout)
}

export async function gitCommit ({ message }) {
  const { stdout } = await execAsync(`git commit -m "${message}"`)
  return cleanStdout(stdout)
}
