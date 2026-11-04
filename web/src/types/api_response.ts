export interface IApiResponse<T> {
  data: T
}

export interface IFieldError {
  field:   string
  message: string
}

export interface IApiError {
  error:    string
  details?: IFieldError[]
}
