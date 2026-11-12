async (page) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  await page.getByLabel('Output format').selectOption('feed');
  await page.locator('svg[data-format]').screenshot({path:'output/playwright/reference-launch.png'});
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'output/playwright/reference-studio.png'});
  const png = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download proof PNG'}).click();
  await (await png).saveAs('output/playwright/reference-launch-export.png');
  const svg = page.waitForEvent('download');
  await page.getByRole('button',{name:'Editable proof SVG'}).click();
  await (await svg).saveAs('output/playwright/reference-launch-export.svg');
  return 'Both reference-style exports downloaded.';
}
