export const STORE_URL = (process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop').replace(/\/$/, '');

export function getStoreProductUrl(slug) {
  return `${STORE_URL}/shop/${slug}`;
}

export function getStoreBlogUrl(slug) {
  return `${STORE_URL}/blog/${slug}`;
}

export function getStoreCollectionUrl(slug) {
  return `${STORE_URL}/shop?category=${slug}`;
}
