import { useCallback } from 'react'

import { Group, Select, TextInput } from '@mantine/core'
import type { ComboboxData } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

import { ICON_SIZE } from '@src/constants/app_constants'
import { EMPLOYEE_COLUMN_LABELS } from '@src/constants/employee_constants'
import { SEARCH_LABEL, SEARCH_PLACEHOLDER } from '@src/constants/employee_messages'
import type { IListUrlState } from '@src/hooks/use_list_url_state'
import type { ISearchInput } from '@src/pages/employee_list/hooks/use_search_input'
import type { IEmployeeSelectOptions, TEmployeeFilterKey } from '@src/types/employee'

interface IEmployeeFiltersProps {
  listState:   IListUrlState<TEmployeeFilterKey>
  searchInput: ISearchInput
  options:     IEmployeeSelectOptions
}

interface IFilterSelectProps {
  filterKey: TEmployeeFilterKey
  data:      ComboboxData
  value:     string | null
  onFilter:  (key: TEmployeeFilterKey, value: string | null) => void
}

function FilterSelect({ filterKey, data, value, onFilter }: IFilterSelectProps): React.JSX.Element {
  const handleChange: (nextValue: string | null) => void = useCallback((nextValue: string | null): void => {
    onFilter(filterKey, nextValue)
  }, [filterKey, onFilter])

  return (
    <Select
      clearable
      searchable
      data={data}
      label={EMPLOYEE_COLUMN_LABELS[filterKey]}
      value={value}
      onChange={handleChange}
    />
  )
}

export function EmployeeFilters({ listState, searchInput, options }: IEmployeeFiltersProps): React.JSX.Element {
  const { filters, setFilter } = listState

  return (
    <Group align="flex-end" gap="md">
      <TextInput
        label={SEARCH_LABEL}
        leftSection={<IconSearch aria-hidden size={ICON_SIZE} />}
        placeholder={SEARCH_PLACEHOLDER}
        type="search"
        value={searchInput.value}
        onChange={searchInput.onChange}
      />
      <FilterSelect data={options.countries} filterKey="country" value={filters.country} onFilter={setFilter} />
      <FilterSelect data={options.jobTitles} filterKey="jobTitle" value={filters.jobTitle} onFilter={setFilter} />
      <FilterSelect data={options.departments} filterKey="department" value={filters.department} onFilter={setFilter} />
    </Group>
  )
}
