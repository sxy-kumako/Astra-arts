// Run with playwright-cli run-code --filename=tests/loading-browser.js.
// The current origin should serve the model with gzip and its compressed Content-Length.
async page => {
  await page.addInitScript(() => {
    window.loadingPercentages = [];
    new MutationObserver(() => {
      const match = document.getElementById('loading')?.textContent.match(/(\d+)%/);
      if (match) window.loadingPercentages.push(Number(match[1]));
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.reload();
  await page.waitForFunction(() => window.__festival && !document.getElementById('loading'));
  const values = await page.evaluate(() => window.loadingPercentages);
  if (!values.length || values.some(value => value < 0 || value > 100)) {
    throw new Error(`Loading progress out of bounds: max=${Math.max(...values)}`);
  }
  if (values.some((value, i) => i && value < values[i - 1])) throw new Error('Progress moved backwards');
  return { passed: true, samples: values.length, maximum: Math.max(...values) };
}
