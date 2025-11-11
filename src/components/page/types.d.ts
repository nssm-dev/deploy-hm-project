export type TSaveTestEntryDataFun = (
  index: number,
  fields: string[],
  values: { [index: string]: string },
  refs: { [index: string]: string },
  comment: string
) => void;
