async (page) => {
  await page.getByRole('button',{name:'01 Campus Launch'}).click();
  return await page.locator('svg[data-format]').evaluate(el => [...el.querySelectorAll('g[data-text-box]')].map(g => ({name:g.dataset.fieldLabel,box:g.dataset.textBox,overflow:g.dataset.overflow,bbox:Object.fromEntries(["x","y","width","height"].map(k=>[k,g.getBBox()[k]])),font:getComputedStyle(g.querySelector('text')).fontFamily})));
}

