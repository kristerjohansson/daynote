export type anniversary = {
  date: number;
  note: string;
};
export type AnniversariesIndexes = 'date';
export type AnniversariesWhereQueryType<IndexName extends AnniversariesIndexes> = IndexName extends 'date'
  ? number
  : never;
export type AnniversariesAddArgs = {
  date: number;
  note: string;
};
export type AnniversariesPutArgs =
  | AnniversariesAddArgs
  | {
      date: number;
      note: string;
    };
export type AnniversariesDeleteArgs =
  | number
  | {
      date: number;
    };
export type AnniversariesGetArgs =
  | number
  | {
      date: number;
    };
const isAnniversariesDateIndex = (
  arg: AnniversariesGetArgs | AnniversariesDeleteArgs,
): arg is {
  date: number;
} => {
  return typeof arg === 'object' && Object.keys(arg).length === 1 && Reflect.has(arg, 'date');
};
export function getAnniversariesId(arg: AnniversariesGetArgs | AnniversariesDeleteArgs) {
  const id = isAnniversariesDateIndex(arg) ? arg.date : arg;
  return id;
}
