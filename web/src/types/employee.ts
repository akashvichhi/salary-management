export interface IEmployee {
  id:         number
  fullName:   string
  email:      string
  jobTitle:   string
  department: string
  country:    string
  // A decimal string ("85000.00"): money is never parsed into a number.
  salary:     string
  hireDate:   string
  createdAt:  string
  updatedAt:  string
}
