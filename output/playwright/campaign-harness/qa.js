async (page) => {
  await page.setViewportSize({width:1600,height:1100});
  await page.screenshot({path:'output/playwright/campaign-studio-desktop.png',fullPage:false});
  return await page.locator('svg[data-format]').evaluate(async el => { await document.fonts.ready; const m = await import('/@fs/C:/sulvatech/mealadmin/lib/campaign-export.ts'); return m.campaignLayoutIssues(el); });
}
