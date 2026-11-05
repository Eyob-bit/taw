/**
 * Polyfill BigInt.prototype.toJSON so JSON.stringify converts BigInt to string
 * This prevents TypeError: Do not know how to serialize a BigInt
 * and avoids JS Number 53-bit precision loss for large Telegram IDs.
 */
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

/**
 * Safely parse a value into a BigInt, handling strings and numbers
 */
export function toBigInt(val) {
  if (val === undefined || val === null) return null;
  return BigInt(val.toString());
}
