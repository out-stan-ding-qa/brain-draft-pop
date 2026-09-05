export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Maps a Topic Feature card name to the URL path segment (Quiz → quiz). */
export function featurePathSegment(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!slug) {
    throw new Error(`Cannot derive a Feature path segment from "${name}"`);
  }
  return slug;
}

export function resolveFeaturePathSegment(
  name: string,
  features: Record<string, { pathSegment: string }>,
): string {
  return features[name]?.pathSegment ?? featurePathSegment(name);
}
