import type { Locator, TestInfo } from '@playwright/test';

/** Phones (<768px) show one full-screen window at a time and open on a single tap. */
export const isPhone = (info: TestInfo) => info.project.name === 'mobile';

/** Phones and tablets open windows zoomed. */
export const opensZoomed = (info: TestInfo) =>
  info.project.name === 'mobile' || info.project.name === 'tablet';

/** If a window opened zoomed (tablets), restore it so it can be moved and resized. */
export async function unzoom(window: Locator) {
  const restore = window.getByRole('button', { name: /^Restore / });
  if (await restore.count()) await restore.click();
}
