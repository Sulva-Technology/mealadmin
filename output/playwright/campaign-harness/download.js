async (page) => {
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  const png = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download proof PNG'}).click();
  await (await png).saveAs('output/playwright/campaign-launch-proof.png');
  const svg = page.waitForEvent('download');
  await page.getByRole('button',{name:'Editable proof SVG'}).click();
  await (await svg).saveAs('output/playwright/campaign-launch-proof.svg');
  return 'PNG and editable SVG downloaded.';
}
