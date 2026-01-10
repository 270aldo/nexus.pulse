import { vi } from "vitest";

type SupabaseResponse<T> = {
  data: T;
  error: null | { message: string };
};

const createResponse = <T,>(data: T): SupabaseResponse<T> => ({
  data,
  error: null,
});

export const createQueryMock = () => {
  const response = createResponse([] as unknown[]);
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    is_: vi.fn(() => query),
    insert: vi.fn(() => Promise.resolve(response)),
    update: vi.fn(() => Promise.resolve(response)),
    upsert: vi.fn(() => Promise.resolve(response)),
    delete: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(createResponse(null))),
    single: vi.fn(() => Promise.resolve(createResponse(null))),
    then: (resolve: (value: SupabaseResponse<unknown[]>) => void) =>
      Promise.resolve(response).then(resolve),
  };

  return query;
};

export const createSupabaseMock = () => ({
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: { id: "test-user" } } })
    ),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  },
  from: vi.fn(() => createQueryMock()),
});
