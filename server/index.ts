import { app } from './app'
import { serverEnv } from './config/env'

app.listen(serverEnv.API_PORT, () => {
  console.log(`FreshTrack API listening on http://localhost:${serverEnv.API_PORT}`)
})
