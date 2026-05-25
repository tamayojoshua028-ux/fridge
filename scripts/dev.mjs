import { spawn } from 'node:child_process'

const scriptNames = ['dev:server', 'dev:client']
const isWindows = process.platform === 'win32'

const children = scriptNames.map((scriptName) =>
  isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', `npm run ${scriptName}`], {
        stdio: 'inherit',
        env: process.env,
      })
    : spawn('npm', ['run', scriptName], {
        stdio: 'inherit',
        env: process.env,
      }),
)

let shuttingDown = false

const stopChildren = (signal = 'SIGTERM') => {
  if (shuttingDown) return
  shuttingDown = true

  children.forEach((child) => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}

children.forEach((child) => {
  child.on('exit', (code) => {
    if (!shuttingDown) {
      stopChildren()
      process.exit(code ?? 0)
    }
  })
})

process.on('SIGINT', () => {
  stopChildren('SIGINT')
})

process.on('SIGTERM', () => {
  stopChildren('SIGTERM')
})
