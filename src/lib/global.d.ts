import { Mongoose } from "mongoose";

declare global {
  /* eslint-enable no-var */
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}