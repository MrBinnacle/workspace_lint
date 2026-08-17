/* Headless check for PROTOTYPE-ref001-observed.html.
 *
 * The prototype is throwaway, but its verdicts are cited, so they are executed
 * rather than asserted. Run:  node prototypes/PROTOTYPE-check.js
 *
 * No dependencies. Extracts the <script> block from the HTML, stubs the four
 * DOM calls it makes at load, and runs the assertions in the same scope.
 */
const fs = require('fs');
const path = require('path');

global.document = { getElementById: () => ({ set innerHTML(v) {}, get innerHTML() { return ''; }, set className(v) {} }) };

const html = fs.readFileSync(path.join(__dirname, 'PROTOTYPE-ref001-observed.html'), 'utf8');
const src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

const tests = `
let fails = 0;
const check = (name, got, want) => {
  const ok = String(got) === String(want); if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + ': got=' + got + ' want=' + want);
};
const head = (s) => console.log('\\n== ' + s + ' ==');

head('RED TEST (S009 checkpoint) - fixture as it stands 2026-08-17');
W = { rootReachable:true, outsideGrantConnected:false, revokeChildConnected:false,
      paginationCompletes:true, budgetExhausted:false, authFailure:false, coverageThreshold:1.0 };
let r = scan(W), a = assess(r, W);
const ref = r.findings.find(f => f.rule === 'REF001');
check('REF001 fires on the link to wl-outside-grant', !!ref, true);
check('certainty', ref && ref.certainty, 'confirmed');
check('target_state', ref && ref.target_state, 'unreachable');
check('run does NOT emit an unqualified verdict', a.disposition !== 'unqualified', true);
console.log('      disposition=' + a.disposition + ' exit=' + a.exit + ' coverage=' + a.evaluated + '/' + a.applicable);

head('THE SILENT CASE - link target reconnected, revoked child still revoked');
W.outsideGrantConnected = true;
r = scan(W); a = assess(r, W);
check('no REF001 finding', !r.findings.find(f => f.rule === 'REF001'), true);
check('the revoked child produces NO finding of any kind', !r.findings.find(f => String(f.resource).includes('revoke')), true);
check('disposition', a.disposition, 'unqualified');
check('exit', a.exit, 0);
console.log('      ^ a clean, verdict-rendering run over a workspace containing a revoked page.');

head('UNBOUNDED GAP -> disclaimed');
W = { ...W, revokeChildConnected:true, paginationCompletes:false };
r = scan(W); a = assess(r, W);
check('disposition', a.disposition, 'disclaimed');
check('exit', a.exit, 2);

head('BOUNDED GAP -> qualified, coverage outranks findings');
W = { ...W, paginationCompletes:true, budgetExhausted:true };
r = scan(W); a = assess(r, W);
check('disposition', a.disposition, 'qualified');
check('exit', a.exit, 3);

head('UNREACHABLE DECLARED ROOT -> pervasiveness condition (a)');
W = { ...W, budgetExhausted:false, rootReachable:false };
r = scan(W); a = assess(r, W);
check('disposition', a.disposition, 'disclaimed');
check('exit', a.exit, 2);

head('AUTH FAILURE');
W = { ...W, rootReachable:true, authFailure:true };
r = scan(W); a = assess(r, W);
check('exit', a.exit, 4);

head('ounique REFUSES true OVER A PARTIAL LIST');
const u1 = ounique(partial([{k:1},{k:2}], 'enumeration abandoned'), x => x.k);
check('partial + no duplicate -> stays partial', u1.state, 'partial');
check('partial + no duplicate -> unique is null, never true', u1.value.unique, null);
const u2 = ounique(partial([{k:1},{k:1}], 'abandoned'), x => x.k);
check('partial + duplicate -> PROVED false', u2.state + ':' + u2.value.unique, 'complete:false');
const u3 = ounique(complete([{k:1},{k:2}]), x => x.k);
check('complete + no duplicate -> may answer true', u3.state + ':' + u3.value.unique, 'complete:true');
check('unreachable propagates', ounique(unreachable('404'), x => x.k).state, 'unreachable');

head('NO ESCAPE HATCH');
check('no unwrap', typeof globalThis.unwrap, 'undefined');
check('no getOrThrow', typeof globalThis.getOrThrow, 'undefined');

head('ADR-0010 MATCHER - issue #31 counterexample');
const bl = [{ rule:'REQ001', resource:'page-1', keys:{ 'propertyId/v1':'x', 'propertyName/v1':'y' } },
            { rule:'REQ001', resource:'page-1', keys:{ 'propertyId/v1':'w', 'propertyName/v1':'z' } }];
const fd = [{ rule:'REQ001', resource:'page-1', keys:{ 'propertyId/v1':'x', 'propertyName/v1':'z' } }];
const t = matchBaseline(fd, bl, ['propertyId/v1','propertyName/v1']);
check('B matched exactly one baseline entry', t.split('\\u2194').length - 1, 1);
check('B matched A on propertyId (higher precision), not C', /finding#0/.test(t) && /baseline#0/.test(t), true);
check('C left unmatched -> unverified/resolved', /baseline#1 . unverified/.test(t), true);
check('no merge of A, B and C', !/baseline#1 . finding/.test(t), true);

console.log('');
console.log(fails ? fails + ' FAILURE(S)' : 'ALL CHECKS PASS');
process.exit(fails ? 1 : 0);
`;

eval(src + '\n' + tests);
