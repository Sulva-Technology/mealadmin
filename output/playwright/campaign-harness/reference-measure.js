async (page) => {
 const rows=[];
 for(const [name,format] of [['09 Campus Routine','feed'],['14 Campus Ambassador','a4'],['04 Campus Awareness','square']]) {
 await page.getByRole('button',{name}).click(); await page.getByLabel('Output format').selectOption(format);
 rows.push({name,boxes:await page.locator('svg[data-format]').evaluate(el=>Array.from(el.querySelectorAll('g[data-text-box]')).map(g=>({name:g.dataset.fieldLabel,box:g.dataset.textBox,bounds:({x:g.getBBox().x,y:g.getBBox().y,width:g.getBBox().width,height:g.getBBox().height}),size:g.querySelector('text').getAttribute('font-size'),over:g.dataset.overflow,text:g.textContent})))});
 }
 return rows;
}
