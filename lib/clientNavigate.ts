/**
 * Next.js can throw "Router action dispatched before initialization" when
 * router.push and router.refresh run back-to-back in the same task as an
 * async handler resolving. Defer to a macrotask so the router is ready.
 */
export type RouterPushRefresh = {
  push: (href: string) => void;
  refresh: () => void;
};

export function pushThenRefresh(router: RouterPushRefresh, href: string): void {
  setTimeout(() => {
    router.push(href);
    setTimeout(() => {
      router.refresh();
    }, 0);
  }, 0);
}
