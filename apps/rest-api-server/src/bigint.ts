//  declare global block must be inside an external module, so we need to add an export {} statement to make the file an external module.
export {};

// Need to provide a toJSON method for BigInt to be able to serialize it
// See https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types#serializing-bigint,
// https://github.com/prisma/studio/issues/614#issuecomment-2476606171
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};
