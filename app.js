const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const COLORS = { scheme: "#5fd0ff", user: "#ff9ed2", host: "#7dffa8", port: "#ffc233", path: "#c4a8ff", query: "#ffab6b", frag: "#ff8c9a" };
const STAGES = [["scheme", "scheme"], ["user", "user info"], ["host", "host"], ["port", "port"], ["path", "path"], ["query", "query"], ["frag", "fragment"]];
const SAMPLES = ["https://www.example.com/docs?page=2", "http://192.168.1.1:8080/admin", "ftp://files.example.org/a.txt",
  "https://example.com:70000", "https://256.1.1.1", "https://-bad.example.com", "https://example.com/a%zz", "example.com"];

function render() {
  const s = $("u").value, g = V.parse(s);
  const c = $("colored"), t = $("track"), v = $("verdict");
  let reached, failAt = -1, msg = "";
  if (g) {
    const seg = (k, pre, post) => g[k] != null && g[k] !== "" ? `<span style="color:${COLORS[k]}">${pre}${esc(g[k])}${post}</span>` : "";
    c.innerHTML = seg("scheme", "", "://") + seg("user", "", "@") + seg("host", "", "") + seg("port", ":", "") + seg("path", "", "") + seg("query", "?", "") + seg("frag", "#", "");
    reached = 8;
  } else {
    const [st, m] = V.diagnose(s); failAt = st; msg = m; c.textContent = s; reached = st;
  }
  t.innerHTML = STAGES.map(([k, name], i) => {
    let cls = "st";
    if (g) cls += g[k] != null && g[k] !== "" ? " on" : "";
    else if (i < reached || (i === 4 && failAt < 4 ? false : false)) cls += " on";
    if (!g && (i === failAt || (failAt === 4 && i >= 4 && i <= 6 && i === 4))) cls = "st bad";
    if (!g && failAt === 4 && i > 4) cls = "st";
    return `<span class="${cls}">${name}</span><span class="arrow">→</span>`;
  }).join("") + `<span class="st fin ${g ? "on" : ""}">accept</span>`;
  if (g) { v.className = "verdict ok"; v.innerHTML = "Accepted. The string ends in a final state."; }
  else { v.className = "verdict no"; v.innerHTML = `Rejected<small>${esc(msg)}</small>`; }

  $("parts").innerHTML = "<tr><th>Component</th><th>Value</th></tr>" + STAGES.map(([k, n]) =>
    `<tr><td style="color:${COLORS[k]}">${n}</td><td><code>${g && g[k] ? esc(g[k]) : "<span style='color:var(--dim)'>none</span>"}</code></td></tr>`).join("");
  const res = [["Naive", V.NAIVE.test(s)], ["Intermediate", V.INTER.test(s)], ["Proposed", !!g]];
  $("cmp").innerHTML = "<tr><th>Validator</th><th>Verdict</th></tr>" + res.map(([n, r]) =>
    `<tr><td>${n}</td><td class="${r ? "ok" : "no"}">${r ? "accepts" : "rejects"}</td></tr>`).join("");
}

$("chips").innerHTML = SAMPLES.map((x) => `<button class="chip" type="button">${esc(x)}</button>`).join("");
$("chips").addEventListener("click", (e) => { if (e.target.classList.contains("chip")) { $("u").value = e.target.textContent; render(); } });
$("u").addEventListener("input", render);

const P = V.parts;
$("pat").innerHTML = "<tr><th>Component</th><th>Rule</th><th>Construct</th></tr>" + [
  ["Scheme", "http, https or ftp", "(?:https?|ftp)://"],
  ["User info", "optional, percent-encoding allowed", "(?:U+@)?"],
  ["Domain", "labels of 1 to 63 characters, alphabetic TLD", "(?:L\\.)+[A-Za-z]{2,63}"],
  ["IPv4", "each octet 0 to 255, no leading zeros", "(?:O\\.){3}O"],
  ["Port", "1 to 65535", ":(?:6553[0-5]|…|[1-9]\\d{0,3})"],
  ["Path", "slash-led segments", "(?:/P*)*"],
  ["Query, fragment", "path characters plus / and ?", "(?:\\?Q*)?(?:#Q*)?"]
].map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${esc(r[2])}</td></tr>`).join("");
$("src").textContent = V.URL_RE.source;

const rows = CASES.map(([u, exp]) => {
  const r = [V.NAIVE.test(u), V.INTER.test(u), V.isValid(u)].map((x) => (x ? 1 : 0) === exp);
  return { u, exp, r };
});
const tot = [0, 1, 2].map((i) => rows.filter((x) => x.r[i]).length);
$("scores").innerHTML = ["Naive", "Intermediate", "Proposed"].map((n, i) =>
  `<div class="score ${i === 2 ? "best" : ""}"><b>${Math.round((tot[i] / rows.length) * 100)}%</b><span>${n}: ${tot[i]} of ${rows.length} correct</span></div>`).join("");
$("suite").innerHTML = "<tr><th>URL</th><th>Should be</th><th>Naive</th><th>Intermediate</th><th>Proposed</th></tr>" + rows.map((x) =>
  `<tr><td><code>${esc(x.u)}</code></td><td>${x.exp ? "valid" : "invalid"}</td>` +
  x.r.map((ok) => `<td class="${ok ? "ok" : "no"}">${ok ? "✓" : "✗ wrong"}</td>`).join("") + "</tr>").join("");

$("stress").addEventListener("click", () => {
  const tests = [["One 5,000-character label", "https://" + "a".repeat(5000) + ".com"],
    ["Alternating letter and hyphen", "https://" + "a-".repeat(2500) + ".com"],
    ["Long path, then an illegal space", "https://example.com/" + "a/".repeat(2400) + " "],
    ["Thousands of short labels, then a digit", "https://" + "a.".repeat(2400) + "1"]];
  $("stressOut").innerHTML = "<tr><th>Input</th><th>Length</th><th>Verdict</th><th>Time</th></tr>" + tests.map(([n, s]) => {
    const t0 = performance.now(), r = V.isValid(s), ms = performance.now() - t0;
    return `<tr><td>${n}</td><td>${s.length}</td><td class="${r ? "ok" : "no"}">${r ? "accepted" : "rejected"}</td><td>${ms.toFixed(2)} ms</td></tr>`;
  }).join("");
});
render();
