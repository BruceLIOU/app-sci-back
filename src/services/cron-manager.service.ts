import cron, { ScheduledTask } from 'node-cron'
import { runMateraChargeSync } from './charge-automation.service'

let cronTask: ScheduledTask | null = null

export function startCron(schedule: string, enabled: boolean = true): void {
  if (cronTask) {
    cronTask.stop()
    cronTask = null
  }
  if (!enabled || !schedule) return
  if (!cron.validate(schedule)) {
    console.error(`[CRON] Schedule invalide : "${schedule}"`)
    return
  }
  cronTask = cron.schedule(schedule, () => {
    console.log('[MATERA SYNC] Déclenchement cron...')
    runMateraChargeSync().catch((err: Error) =>
      console.error('[MATERA SYNC] Erreur inattendue :', err.message)
    )
  })
  console.log(`🕐 Cron MATERA démarré (schedule: "${schedule}", activé: ${enabled})`)
}

export function stopCron(): void {
  if (cronTask) {
    cronTask.stop()
    cronTask = null
    console.log('🛑 Cron MATERA arrêté')
  }
}
