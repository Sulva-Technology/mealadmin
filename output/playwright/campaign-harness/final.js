async (page) => {
  await page.getByRole('button',{name:'04 Campus Awareness'}).click();
  await page.getByLabel('Output format').selectOption('feed');
  await page.locator('svg[data-format]').screenshot({path:'output/playwright/campaign-awareness-proof.png'});
  const inspect=async()=>page.locator('svg[data-format]').evaluate(async el=>(await import('/@fs/C:/sulvatech/mealadmin/lib/campaign-export.ts')).campaignLayoutIssues(el));
  const results=[{name:'three-step layout',issues:await inspect()}];
  await page.getByRole('button',{name:'23 Counter QR'}).click();
  await page.getByLabel('Participating vendor (optional)',{exact:true}).fill('Campus Kitchen');
  results.push({name:'counter vendor',issues:await inspect(),visible:await page.locator('svg[data-format]').textContent()});
  await page.getByRole('button',{name:'28 Packaging Insert'}).click();
  await page.getByRole('combobox',{name:'Side',exact:true}).selectOption('back');
  await page.getByLabel('Order help (optional)',{exact:true}).fill('help@mealdirectly.com');
  results.push({name:'insert with help',issues:await inspect()});
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  await page.getByLabel('Output format').selectOption('feed');
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'output/playwright/campaign-studio-desktop.png',fullPage:false});
  return results;
}
