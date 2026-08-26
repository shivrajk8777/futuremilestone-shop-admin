export const STORE_URL: string = (process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop').replace(/\/$/, '');

export function getStoreProductUrl(slug: string): string {
  return `${STORE_URL}/shop/${slug}`;
}

export function getStoreBlogUrl(slug: string): string {
  return `${STORE_URL}/blog/${slug}`;
}

export function getStoreCollectionUrl(slug: string): string {
  return `${STORE_URL}/shop?category=${slug}`;
}
