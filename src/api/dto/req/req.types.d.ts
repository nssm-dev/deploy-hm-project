export interface IReqPageSize {
  pageNumber: number;
  pageSize: number;
}

export interface ILabTestCreate {
  labTestCode: string;
  labTestName: string;
  fields: string;
  userName: string;
}
