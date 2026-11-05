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
  // The HTTP status, when the server answered at all (a network error has none).
  status?:  number
}
