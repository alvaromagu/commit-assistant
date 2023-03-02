import { trytm } from '@bdsqqq/try'
import { intro, outro, select, isCancel, multiselect, confirm, group, text, note } from '@clack/prompts'
import colors from 'picocolors'
import { style } from './colorsUtils.js'
import { commitTypes } from './commit-types.js'
import { getChangedFiles, isGitInRepository, getStagedFiles, gitAdd, gitCommit } from './git.js'
import { exitProgram } from './utils.js'

if ((!await isGitInRepository())) {
  exitProgram({ code: 1, message: 'No te encuentras en ningún repositorio' })
}

intro(style(' Bienvenido al generador de commits ', { bg: colors.bgCyan, style: colors.bold }))

const [changedFiles, changedFilesErr] = await trytm(getChangedFiles())
const [stagedFiles, stagedFilesErr] = await trytm(getStagedFiles())

if (stagedFilesErr !== null || changedFilesErr !== null) {
  exitProgram({ code: 1, message: style('Error al cargar los ficheros cambiados', { bg: colors.bgRed, color: colors.white }), customStyle: true })
}
if (stagedFiles.length === 0 && changedFiles.length === 0) {
  exitProgram({ message: colors.green('No hay cambios en el repositorio'), customStyle: true })
}

if (stagedFiles.length > 0) {
  const { confirmResult } = await group(
    {
      resume: () => {
        const resume = `Los siguientes ficheros ya están staged\n[ ${stagedFiles.join(' | ')} ]`
        return note(resume, 'Antención')
      },
      confirmResult: () => confirm({
        message: '¿Quieres continuar?'
      })
    },
    {
      onCancel: () => {
        exitProgram()
      }
    }
  )
  if (!confirmResult || isCancel(confirmResult)) {
    exitProgram()
  }
}

const selectedFiles = await multiselect({
  message: colors.blue('Selecciona los ficheros que quieres añadir:'),
  options: changedFiles.map(file => ({ value: file, message: file })),
  required: stagedFiles.length === 0
})
if (isCancel(selectedFiles)) {
  exitProgram()
}

const commitType = await select({
  message: colors.blue('Selecciona el tipo de commit'),
  options: Object.entries(commitTypes).map(([key, value]) => {
    return { value: { ...value, key }, label: `${value.emoji} ${key.padEnd(10, ' ')} · ${value.description}` }
  })
})
if (isCancel(commitType)) {
  exitProgram()
}

const commitMessage = await text({
  message: colors.blue('Introduce el mensaje del commit:'),
  prompt: 'Mensaje',
  validate: (input) => {
    if (!input || input.length === 0) {
      return colors.red('El mensaje no puede estar vacío')
    }
    if (input.length > 50) {
      return colors.red('El mensaje no puede tener más de 100 caracteres')
    }
  }
})

const formattedMessage = `${commitType.emoji} (${commitType.key}): ${commitMessage}`

const { confirmResult } = await group(
  {
    resume: () => {
      const resume = `Ficheros añadidos  -> [ ${[...stagedFiles, ...selectedFiles].join(' | ')} ]
Mensaje del commit -> ${formattedMessage}`
      note(resume, colors.blue('Resumen'))
    },
    confirmResult: () => confirm({
      message: colors.blue('A continuación se realizara el commit, ¿desea continuar?')
    })
  },
  {
    onCancel: () => {
      exitProgram()
    }
  }
)
if (!confirmResult || isCancel(confirmResult)) {
  exitProgram()
}

if (selectedFiles.length > 0) {
  const [, err] = await trytm(gitAdd({ files: selectedFiles }))
  if (err !== null) {
    console.log(err)
    exitProgram({ code: 1, message: 'Ha ocurrido un error al añadir los ficheros seleccionados.' })
  }
}

const [, err] = await trytm(gitCommit({ message: formattedMessage }))
if (err !== null) {
  exitProgram({ code: 1, message: 'Ha ocurrido un error al realizar el commit' })
}

outro('✔️  Commit realizado, ¡Hasta la próxima!')
