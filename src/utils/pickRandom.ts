import type { Locator } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstLine(text: string): string {
  return (
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? text.trim()
  );
}

export async function clickNamedOrRandom(locator: Locator, name?: string): Promise<string> {
  await locator.first().waitFor({ state: 'visible', timeout: 20_000 });
  const count = await locator.count();
  if (count === 0) {
    throw new Error('No matching items to click');
  }

  if (name) {
    const match = locator.filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`, 'i') }).first();
    await match.click();
    return name;
  }

  const item = locator.nth(Math.floor(Math.random() * count));
  const chosen = firstLine(await item.innerText());
  await item.click();
  return chosen;
}
