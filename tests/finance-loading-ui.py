"""Exercise actual auth/snapshot handlers locally, with no real account access."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
mock = '''
localStorage.setItem('cbd_hadSession','1');
window.lucide={createIcons(){}};
window.qa={listeners:{},unsubscribed:0,writes:0};
const listen=(name)=>(options,callback,error)=>{
  qa.listeners[name]={callback,error};return ()=>qa.unsubscribed++;
};
window.firebase={initializeApp(){},auth(){return {onAuthStateChanged(cb){qa.auth=cb}}},
firestore(){return {collection(name){return {orderBy(){return {onSnapshot:listen(name)}},doc(){return {onSnapshot:listen(name)}}}},
batch(){qa.writes++;throw Error('Unexpected write')}}}};
qa.emit=(name,cache,docs=[])=>qa.listeners[name].callback({metadata:{fromCache:cache},docs:docs.map(d=>({id:d.id,data:()=>d})),exists:true,data:()=>({})});
'''
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome',headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
        context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) else r.abort())
        context.add_init_script(mock)
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.goto(origin+'/finanzas.html',wait_until='load')
        page.clock.install()
        assert not page.locator('#main-app').is_visible()
        page.evaluate('qa.auth({uid:"qa"})')
        page.evaluate('qa.emit("transacciones",true);qa.emit("config",true)')
        page.clock.fast_forward(9000)
        assert page.locator('#data-loading').is_visible()
        assert not page.locator('#main-app').is_visible()
        assert not page.locator('#bottom-nav').is_visible()
        assert 'tardando' in page.locator('#finance-loading-message').inner_text()
        # Config alone and incidental render requests cannot expose opening balances.
        page.evaluate('qa.emit("config",false);renderAll()')
        assert not page.locator('#main-app').is_visible()
        row={'id':'qa-income','fecha':'2026-09-16','hora':'09:00','tipo':'ingreso',
             'categoria':'Anticipo','motorVersion':1,'motorType':'income','monto':123456,
             'receptor':'Frank','responsible':'Frank','project':'QA','proyecto':'QA'}
        page.evaluate('(row)=>qa.emit("transacciones",false,[row])',row)
        assert page.locator('#main-app').is_visible()
        assert not page.locator('#data-loading').is_visible()
        assert page.evaluate('getFinanceState().cash') == 5425593
        before=page.locator('#cuenta-frank-val').inner_text()
        assert '2.774.525' in before # Exact on first paint, no animation from zero.
        assert page.locator('#sync-status').get_attribute('title') == 'Cuentas actualizadas'
        page.evaluate('qa.emit("transacciones",true)')
        assert page.locator('#cuenta-frank-val').inner_text() == before
        assert 'Reconectando' in page.locator('#sync-status').get_attribute('title')
        page.evaluate('qa.listeners.transacciones.error(new Error("offline"))')
        assert page.locator('#main-app').is_visible()
        assert page.locator('#cuenta-frank-val').inner_text() == before
        # Late snapshots from a signed-out session cannot reveal its data.
        page.evaluate('qa.old=qa.listeners.transacciones.callback;qa.auth(null);qa.old({metadata:{fromCache:false},docs:[]})')
        assert not page.locator('#main-app').is_visible()
        assert page.locator('#lock-screen').is_visible()
        assert page.evaluate('qa.unsubscribed') == 2
        page.evaluate('qa.auth({uid:"second"});qa.emit("transacciones",false)')
        assert not page.locator('#main-app').is_visible()
        page.evaluate('qa.listeners.config.error(new Error("permission-denied"))')
        assert 'No pudimos cargar' in page.locator('#finance-loading-message').inner_text()
        assert not page.locator('#main-app').is_visible()
        # An authoritative empty dataset may display opening balances only after both sources.
        page.evaluate('qa.emit("config",false)')
        assert page.locator('#main-app').is_visible()
        assert page.evaluate('getFinanceState().cash') == 5302137
        assert page.evaluate('qa.writes') == 0
        assert not errors,errors
        browser.close()
        print('PASS: delayed auth/data, >8s wait, cached empty snapshots, both source orders, first-paint values, disconnect, listener errors, logout, late callbacks; zero database writes')
finally:
    server.shutdown()
