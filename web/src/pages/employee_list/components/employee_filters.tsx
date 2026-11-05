import { Group, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

import { SEARCH_LABEL, SEARCH_PLACEHOLDER } from '@src/constants/employee_messages'
import type { IListUrlState } from '@src/hooks/use_list_url_state'
import { useSearchInput } from '@src/pages/employee_list/hooks/use_search_input'
import type { TEmployeeFilterKey } from '@src/types/employee'

interface IEmployeeFiltersProps {
  listState: IListUrlState<TEmployeeFilterKey>
}

const ICON_SIZE: number = 16

export function EmployeeFilters({ listState }: IEmployeeFiltersProps): React.JSX.Element {
  const searchInput: { value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void } =
    useSearchInput(listState.search, listState.setSearch)

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
    </Group>
  )
}
