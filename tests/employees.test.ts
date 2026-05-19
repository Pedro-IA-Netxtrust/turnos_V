import { createEmployee } from '@/lib/crud/employees';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Employee CRUD', () => {
  const insertMock = jest.fn();
  const selectMock = jest.fn();
  const singleMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase as unknown as { from: jest.Mock }).from.mockReturnValue({
      insert: insertMock,
      select: selectMock,
      single: singleMock,
    });
    insertMock.mockReturnThis();
    selectMock.mockReturnThis();
    singleMock.mockResolvedValue({ data: { id: 'test-id', employee_code: 'EMP001', first_name: 'Juan', last_name: 'Pérez', area_id: 'area-id', position: null, fte_percentage: 100, is_active: true, hire_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, error: null });
  });

  it('creates an employee with valid data', async () => {
    const result = await createEmployee({
      employee_code: 'EMP001',
      first_name: 'Juan',
      last_name: 'Pérez',
      area_id: '00000000-0000-0000-0000-000000000000',
    });

    expect(result.employee_code).toBe('EMP001');
    expect(insertMock).toHaveBeenCalled();
    expect(selectMock).toHaveBeenCalled();
    expect(singleMock).toHaveBeenCalled();
  });
});
