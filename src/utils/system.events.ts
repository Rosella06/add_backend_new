import { EventEmitter } from 'events'

const systemEventEmitter = new EventEmitter()

export const SystemEvents = {
  PICKUP_COMPLETED: 'pickupCompleted'
}

export default systemEventEmitter
