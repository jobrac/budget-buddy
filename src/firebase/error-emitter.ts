
import { EventEmitter } from 'events';

// It is safe to use a single global event emitter for this purpose.
// See: https://nodejs.org/api/events.html#passing-arguments-and-this-to-listeners
export const errorEmitter = new EventEmitter();
