export type note = {
  date: number;
  note: string;
  photo: string;
};
export type NotesIndexes = 'date';
export type NotesWhereQueryType<IndexName extends NotesIndexes> = IndexName extends 'date' ? number : never;
export type NotesAddArgs = {
  date: number;
  note: string;
  photo: string;
};
export type NotesPutArgs =
  | NotesAddArgs
  | {
      date: number;
      note: string;
      photo: string;
    };
export type NotesDeleteArgs =
  | number
  | {
      date: number;
    };
export type NotesGetArgs =
  | number
  | {
      date: number;
    };
const isNotesDateIndex = (
  arg: NotesGetArgs | NotesDeleteArgs,
): arg is {
  date: number;
} => {
  return typeof arg === 'object' && Object.keys(arg).length === 1 && Reflect.has(arg, 'date');
};
export function getNotesId(arg: NotesGetArgs | NotesDeleteArgs) {
  const id = isNotesDateIndex(arg) ? arg.date : arg;
  return id;
}
