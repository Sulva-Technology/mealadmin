async (page) => {
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  await page.getByLabel('Output format').selectOption('feed');
  await page.locator('svg[data-format]').screenshot({path:'output/playwright/reference-launch.png'});
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'output/playwright/reference-studio.png'});
  return await page.locator('svg[data-format]').evaluate(async el=>(await import('/@fs/C:/sulvatech/mealadmin/lib/campaign-export.ts')).campaignLayoutIssues(el));
}
