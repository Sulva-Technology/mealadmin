async (page) => {
  await page.reload();
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const issues = [];
  const buttons = page.getByRole('complementary', {name:'Campaign library'}).getByRole('button');
  for (let index=0; index<28; index++) {
    const name = await buttons.nth(index).innerText();
    await buttons.nth(index).click();
    const formats = await page.getByLabel('Output format').locator('option').evaluateAll(options => options.map(o=>o.value));
    for (const format of formats) {
      await page.getByLabel('Output format').selectOption(format);
      const result = await page.locator('svg[data-format]').evaluate(async el => { await document.fonts.ready; const m = await import('/@fs/C:/sulvatech/mealadmin/lib/campaign-export.ts'); return m.campaignLayoutIssues(el); });
      if (result.length) issues.push({name,format,issues:result});
    }
  }
  return issues;
}
