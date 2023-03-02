import { outro } from '@clack/prompts'
import colors from 'picocolors'

export function exitProgram ({ code = 0, message = 'El commit ha sido cancelado', customStyle = false } = {}) {
  outro(customStyle ? message : colors.yellow(message))
  process.exit(code)
}
