export function humanTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function sortByPublished<T extends { data: { published: Date } }>(collection: T[]) {
  return collection.toSorted((a, b) => {
    return Number(b.data.published) - Number(a.data.published);
  });
}
