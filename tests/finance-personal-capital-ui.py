"""Local browser integration test. Firebase is mocked; all external requests blocked."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
mock = '''
window.lucide = {createIcons(){}};
window.__writes=[];
window.__serial=0;
window.__charts={};
window.Chart=class {constructor(ctx,config){window.__charts[ctx.canvas.id]=config}destroy(){}};
const qaDb={collection(){return {doc(id){return {id:id || 'qa-'+(++window.__serial),async set(data){window.__writes.push(data)}}}}},
batch(){return {set(ref,data){window.__writes.push(data)},update(){},async commit(){}}}};
window.firebase={initializeApp(){},auth(){return {currentUser:{uid:'local-qa',email:'qa@example.invalid'},onAuthStateChanged(){}}},firestore(){return qaDb}};
'''
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome',headless=True)
        context=browser.new_context(viewport={'width':390,'height':844}, reduced_motion='reduce', service_workers='block')
        context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(origin) else route.abort())
        context.add_init_script(mock)
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.goto(origin+'/finanzas.html',wait_until='load')
        page.evaluate('''() => {
          document.getElementById('lock-screen').classList.add('hidden');
          document.getElementById('main-app').classList.remove('hidden');
          document.getElementById('data-loading').style.display='none';
          financeTransactionsLoaded=true;proyectosEstadoLoaded=true;resetTransactionForm(); showTab('nuevo'); setTipo('gasto'); setReceptor('Frank');
        }''')
        assert page.locator('#tx-funding').input_value() == 'personal'
        page.locator('#tx-monto').fill('200000')
        page.locator('#tx-descripcion').fill('Pago personal QA')
        page.locator('#btn-submit').click()
        page.wait_for_function('window.__writes.length === 1')
        assert page.evaluate('getFinanceState().personalDue.frank') == 200000
        assert page.evaluate('getFinanceState().cash') == 5302137
        assert page.evaluate('getFinanceState().validation.valid')
        assert not page.locator('#personal-capital-summary').is_visible()
        assert 'capital personal' not in page.locator('#panel-resumen').inner_text().lower()
        assert page.locator('#btn-equilibrar').get_attribute('data-amount') == '100000'
        assert page.locator('#btn-equilibrar').is_visible()
        for width,height in [(390,844),(1366,768),(1920,900)]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate("editTransaction(transactions[0].id)")
            assert page.locator('#tx-funding').input_value() == 'personal'
            assert page.locator('#campo-capital-personal').is_visible()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        # Reclassifying an existing payment does not duplicate it.
        page.locator('#tx-funding').select_option('company')
        page.locator('#btn-submit').click()
        page.wait_for_function('getFinanceState().personalDueTotal === 0')
        assert page.evaluate('transactions.length') == 1
        page.evaluate('editTransaction(transactions[0].id)')
        page.locator('#tx-funding').select_option('personal')
        page.locator('#btn-submit').click()
        page.wait_for_function('getFinanceState().personalDueTotal === 200000')
        # Rehydrate exactly the stored record, as after a Firestore reload.
        page.evaluate('transactions = [{id:"rehydrated", ...window.__writes.at(-1)}]; renderAll()')
        assert page.evaluate('getFinanceState().personalDue.frank') == 200000
        page.evaluate("resetTransactionForm();showTab('nuevo');setTipo('gasto');setReceptor('Cristian')")
        page.locator('#tx-categoria').select_option(label='Devolución de capital personal')
        assert page.locator('#campo-devolucion-personal').is_visible()
        assert not page.locator('#campo-capital-personal').is_visible()
        page.locator('#tx-beneficiary').select_option('frank')
        page.locator('#tx-monto').fill('50000')
        page.locator('#btn-submit').click()
        page.wait_for_function('getFinanceState().personalDueTotal === 150000')
        assert page.evaluate('getFinanceState().cash') == 5252137
        assert page.evaluate('getFinanceState().validation.valid')
        assert page.locator('#btn-equilibrar').is_visible()
        page.evaluate("showTab('estadisticas')")
        assert page.locator('#personal-capital-summary').is_visible()
        assert '150.000' in page.locator('#personal-capital-summary').inner_text()
        assert page.locator('.personal-capital-partner').count() == 2
        assert page.locator('.personal-capital-row').count() == 2
        report_text=page.locator('#personal-capital-summary').inner_text()
        report_text=report_text.replace('\xa0',' ')
        assert 'Pago personal QA' in report_text
        assert 'Prueba' not in report_text
        assert 'APORTADO' in report_text and '$ 200.000' in report_text
        assert 'DEVUELTO' in report_text and '$ 50.000' in report_text
        assert 'PENDIENTE' in report_text and '$ 150.000' in report_text
        assert 'Sin movimientos de capital personal' in report_text
        page.evaluate("closeMasDrawer();document.getElementById('toast').style.display='none'")
        for width,height in [(390,844),(1366,768),(1920,900)]:
            page.set_viewport_size({'width':width,'height':height})
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
            (root/'artifacts').mkdir(exist_ok=True)
            page.screenshot(path=str(root/'artifacts'/f'capital-personal-report-{width}.png'),full_page=True)
        assert page.evaluate('__charts["chart-categorias"].data.datasets[0].data.reduce((a,b)=>a+b,0)') == 200000
        page.evaluate("setReportesVista('anio')")
        assert page.evaluate('__charts["chart-semanal"].data.datasets[0].data.reduce((a,b)=>a+b,0)') == -200000
        page.evaluate("resetTransactionForm();showTab('nuevo');setTipo('gasto');setReceptor('Cristian')")
        page.locator('#tx-categoria').select_option(label='Devolución de capital personal')
        page.locator('#tx-beneficiary').select_option('frank')
        page.locator('#tx-monto').fill('150000')
        page.locator('#btn-submit').click()
        page.wait_for_function('getFinanceState().personalDueTotal === 0')
        assert page.evaluate('getFinanceState().totalExpenses') == 11903959
        assert page.evaluate('getFinanceState().cash') == 5102137
        assert page.locator('#btn-equilibrar').is_visible()
        assert not errors,errors
        print(json.dumps({'result':'passed','viewports':[390,1366,1920], 'checks':['personal expense save','debt and cash','edit and reclassify','stored payload rehydration','partial and full repayment','combined distribution without blocking','no duplicate expense in charts','no overflow','no browser errors']}))
        # Separate zero-opening fixture, using real UI and a mocked database.
        zero=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',service_workers='block')
        def zero_route(route):
            if route.request.url == origin+'/finanzas.html':
                html=(root/'finanzas.html').read_text(encoding='utf-8').replace('const FINANCE_OPENING = FINANCE_ENGINE.OPENING_STATE;', 'const FINANCE_OPENING = {asOf:"2026-07-12",asOfTime:"19:02",cash:0,capital:{frank:0,cristian:0}};')
                route.fulfill(status=200,content_type='text/html',body=html)
            elif route.request.url.startswith(origin): route.continue_()
            else: route.abort()
        zero.route('**/*',zero_route)
        zero.add_init_script(mock)
        z=zero.new_page()
        z.on('pageerror',lambda err:errors.append(str(err)))
        z.on('dialog',lambda dialog:dialog.accept())
        z.goto(origin+'/finanzas.html',wait_until='load')
        z.evaluate("financeTransactionsLoaded=true;proyectosEstadoLoaded=true;document.getElementById('lock-screen').classList.add('hidden');document.getElementById('main-app').classList.remove('hidden');document.getElementById('data-loading').style.display='none';resetTransactionForm();showTab('nuevo');setTipo('gasto');setReceptor('Frank')")
        z.locator('#tx-hora').fill('08:00')
        z.locator('#tx-proyecto').fill('Prueba capital')
        z.locator('#tx-monto').fill('200000')
        z.locator('#btn-submit').click()
        z.wait_for_function('getFinanceState().personalDueTotal === 200000')
        z.evaluate("resetTransactionForm();showTab('nuevo');setTipo('ingreso');setReceptor('Cristian')")
        z.locator('#tx-hora').fill('09:00')
        z.locator('#tx-proyecto').fill('Prueba capital')
        z.locator('#tx-monto').fill('1000000')
        z.locator('#btn-submit').click()
        z.wait_for_function('getFinanceState().cash === 1000000')
        assert z.locator('#btn-equilibrar').get_attribute('data-amount') == '600000'
        assert z.locator('#btn-equilibrar').get_attribute('data-from') == 'Cristian'
        assert z.locator('#btn-equilibrar').get_attribute('data-to') == 'Frank'
        for width,height in [(390,844),(1366,768),(1920,900)]:
            z.set_viewport_size({'width':width,'height':height})
            assert not z.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
            assert 'capital personal' not in z.locator('#panel-resumen').inner_text().lower()
            (root/'artifacts').mkdir(exist_ok=True)
            z.screenshot(path=str(root/'artifacts'/f'capital-personal-v48-{width}.png'))
        z.locator('#btn-equilibrar').click()
        z.wait_for_function('getFinanceState().settlement === null')
        assert z.evaluate('getFinanceState().balanceByPartner') == {'frank':600000,'cristian':400000}
        assert not z.locator('#btn-equilibrar').is_visible()
        # User can withdraw once; the personal component is returned automatically.
        z.evaluate("retirarProfitSocio('Frank')")
        z.locator('#retiro-input').fill('600000')
        z.evaluate('confirmarRetiro()')
        z.wait_for_function('getFinanceState().personalDueTotal === 0')
        assert z.evaluate('getFinanceState().settlement') is None
        assert z.evaluate('getFinanceState().personalReturned.frank') == 200000
        assert z.evaluate('getFinanceState().cash') == 400000
        assert not errors,errors
        print('Combined transfer 600000, replay balance, automatic refund on withdrawal: passed')
        browser.close()
finally:
    server.shutdown()
