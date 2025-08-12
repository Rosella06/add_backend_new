import { EventEmitter } from 'events'

const systemEventEmitter = new EventEmitter()

export const SystemEvents = {
  PICKUP_COMPLETED: 'pickupCompleted',
  MACHINE_ONLINE: 'machineOnline',
  MACHINE_OFFLINE: 'machineOffline'
}

export default systemEventEmitter

export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))
