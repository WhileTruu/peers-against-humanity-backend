export function RoomsException(message) { // eslint-disable-line
  this.message = message
  this.name = 'RoomsException'
}

RoomsException.prototype.toString = function toString() {
  return `${this.name}: ${this.message}`
}
