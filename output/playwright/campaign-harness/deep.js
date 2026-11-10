async (page) => {
  await page.reload();
  await page.getByLabel('Campus record').selectOption('qa-long');
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  const results=[];
  const inspect=async(label)=>results.push({label,issues:await page.locator('svg[data-format]').evaluate(async el=>{await document.fonts.ready;return (await import('/@fs/C:/sulvatech/mealadmin/lib/campaign-export.ts')).campaignLayoutIssues(el);})});
  await inspect('long university/feed');
  await page.getByLabel('Output format').selectOption('story');
  await inspect('long university/story');
  await page.getByRole('button',{name:'27 Pocket Flyer'}).click();
  await page.getByRole('combobox',{name:'Side',exact:true}).selectOption('back');
  await inspect('A6 flyer/back');
  await page.getByRole('button',{name:'28 Packaging Insert'}).click();
  await page.getByRole('combobox',{name:'Side',exact:true}).selectOption('back');
  await inspect('A7 insert/back');
  await page.locator('svg[data-format]').screenshot({path:'output/playwright/campaign-a7-back.png'});
  await page.getByLabel('Campus record').selectOption('qa-unilag');
  await page.getByRole('button',{name:'24 Launch Event'}).click();
  for (const [label,value] of [['Event title *','Campus introduction'],['Date *','20 November 2026'],['Time *','2 pm'],['Venue *','Student common room']]) await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByLabel(/Event URL/).fill('https://example.com/event');
  await inspect('event with required logistics');
  await page.getByRole('button',{name:'19 Student Voice'}).click();
  await page.getByLabel('Campaign action').selectOption('quote');
  await page.getByLabel('Exact approved quote *',{exact:true}).fill('I could choose a meal and a delivery slot for my study break.');
  await page.getByLabel('Approved attribution *',{exact:true}).fill('QA example — test fixture');
  await inspect('student quote mode');
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('svg[data-format]').scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/campaign-studio-mobile.png'});
  results.push({label:'mobile horizontal overflow',overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  return results;
}

