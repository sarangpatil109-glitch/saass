export function applyDateFilter<T>(query: T, searchParams: { from?: string, to?: string }, column = 'created_at'): T {
  let updatedQuery: any = query;
  
  if (searchParams.from) {
    // If the string already contains a 'T', we leave it alone, else we append T00:00:00.000Z
    const fromStr = searchParams.from.includes('T') ? searchParams.from : `${searchParams.from}T00:00:00.000Z`;
    updatedQuery = updatedQuery.gte(column, fromStr);
  }
  
  if (searchParams.to) {
    const toStr = searchParams.to.includes('T') ? searchParams.to : `${searchParams.to}T23:59:59.999Z`;
    updatedQuery = updatedQuery.lte(column, toStr);
  }
  
  return updatedQuery as T;
}
