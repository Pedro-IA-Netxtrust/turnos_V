import { bulkInsertPlanningDaily } from '@/lib/crud/planning';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

describe('Planning CRUD', () => {
  const mockSupabase = supabase as unknown as {
    from: jest.Mock;
    insert: jest.Mock;
    select: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockReturnValue({
      insert: mockSupabase.insert,
      select: mockSupabase.select,
    });
  });

  it('rejects planning records more than 3 days in the future', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await expect(
      bulkInsertPlanningDaily([
        {
          employee_id: '00000000-0000-0000-0000-000000000000',
          plan_date: futureDate,
          status: 'P',
          hours_worked: 8,
          notes: null,
          approved_by: null,
          approved_at: null,
          created_by: '00000000-0000-0000-0000-000000000000',
        },
      ]),
    ).rejects.toThrow(/plan_date cannot be more than 3 days in the future/);
  });

  it('rejects duplicate employee/day combinations within the same batch', async () => {
    const date = new Date().toISOString().slice(0, 10);
    await expect(
      bulkInsertPlanningDaily([
        {
          employee_id: '00000000-0000-0000-0000-000000000000',
          plan_date: date,
          status: 'P',
          hours_worked: 8,
          notes: null,
          approved_by: null,
          approved_at: null,
          created_by: '00000000-0000-0000-0000-000000000000',
        },
        {
          employee_id: '00000000-0000-0000-0000-000000000000',
          plan_date: date,
          status: 'P',
          hours_worked: 8,
          notes: null,
          approved_by: null,
          approved_at: null,
          created_by: '00000000-0000-0000-0000-000000000000',
        },
      ]),
    ).rejects.toThrow(/Duplicate employee_id and plan_date combination/);
  });
});
