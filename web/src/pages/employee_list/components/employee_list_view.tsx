import { Button, Stack } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import { ICON_SIZE } from '@src/constants/app_constants'
import { ADD_EMPLOYEE_LABEL } from '@src/constants/employee_messages'
import { EMPLOYEES_PAGE_TITLE } from '@src/constants/navigation_constants'
import { EmployeeFilters } from '@src/pages/employee_list/components/employee_filters'
import { EmployeeFormModal } from '@src/pages/employee_list/components/employee_form_modal'
import { EmployeeListContent } from '@src/pages/employee_list/components/employee_list_content'
import { useDeleteEmployeeModal } from '@src/pages/employee_list/hooks/use_delete_employee_modal'
import { useEmployeeFormModal } from '@src/pages/employee_list/hooks/use_employee_form_modal'
import { useEmployeeList } from '@src/pages/employee_list/hooks/use_employee_list'
import type { IEmployee, IEmployeeSelectOptions } from '@src/types/employee'
import { PageHeader } from '@src/ui/layout/page_header'

interface IEmployeeListViewProps {
  options: IEmployeeSelectOptions
}

// The page once the dropdown lists have loaded: header action, filters, table and modals.
export function EmployeeListView({ options }: IEmployeeListViewProps): React.JSX.Element {
  const { listState, employeesQuery } = useEmployeeList(options)
  const formModal: ReturnType<typeof useEmployeeFormModal> = useEmployeeFormModal()
  const openDeleteModal: (employee: IEmployee) => void = useDeleteEmployeeModal()

  return (
    <>
      <PageHeader
        action={(
          <Button leftSection={<IconPlus aria-hidden size={ICON_SIZE} />} onClick={formModal.openCreate}>
            {ADD_EMPLOYEE_LABEL}
          </Button>
        )}
        title={EMPLOYEES_PAGE_TITLE}
      />
      <Stack gap="lg">
        <EmployeeFilters listState={listState} options={options} />
        <EmployeeListContent
          countryNameByCode={options.countryNameByCode}
          employeesQuery={employeesQuery}
          listState={listState}
          onDelete={openDeleteModal}
          onEdit={formModal.openEdit}
        />
      </Stack>
      <EmployeeFormModal
        employee={formModal.employee}
        formKey={formModal.formKey}
        opened={formModal.opened}
        options={options}
        onClose={formModal.close}
      />
    </>
  )
}
