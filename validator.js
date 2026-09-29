(function (root) {
  const LABEL = "[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?";
  const DOMAIN = `(?:${LABEL}\\.)+[A-Za-z]{2,63}`;
  const OCT = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
  const IPV4 = `(?:${OCT}\\.){3}${OCT}`;
  const HOST = `(?:${DOMAIN}|${IPV4}|localhost)`;
  const PORTNUM = "(?:6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-5]\\d{4}|[1-9]\\d{0,3})";
  const PCT = "%[0-9A-Fa-f]{2}";
  const PCH = `(?:[A-Za-z0-9._~!$&'()*+,;=:@-]|${PCT})`;
  const PATH = `(?:/${PCH}*)*`;
  const QF = `(?:[A-Za-z0-9._~!$&'()*+,;=:@/?-]|${PCT})*`;
  const USERC = `(?:[A-Za-z0-9._~!$&'()*+,;=:-]|${PCT})`;
  const URL_RE = new RegExp(
    `^(?=.{1,2048}$)(?<scheme>https?|ftp)://(?:(?<user>${USERC}+)@)?(?<host>${HOST})` +
    `(?::(?<port>${PORTNUM}))?(?<path>${PATH})(?:\\?(?<query>${QF}))?(?:#(?<frag>${QF}))?$`
  );
  const NAIVE = /^https?:\/\/\S+$/;
  const INTER = /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/;
  const hostRe = new RegExp(`^${HOST}$`);
  const portRe = new RegExp(`^${PORTNUM}$`);
  const userRe = new RegExp(`^${USERC}+$`);

  const isValid = (s) => typeof s === "string" && URL_RE.test(s);
  const parse = (s) => { const m = typeof s === "string" && URL_RE.exec(s); return m ? m.groups : null; };

  // Returns [stageIndex, message]; stage: 0 scheme, 1 user info, 2 host, 3 port, 4 path/query/fragment
  function diagnose(s) {
    if (!s.length) return [0, "Nothing entered yet."];
    if (s.length > 2048) return [0, "Longer than 2,048 characters."];
    if (/\s/.test(s)) return [0, "Contains whitespace. Remove spaces before validating."];
    const sm = s.match(/^([A-Za-z][A-Za-z0-9+.-]*):\/\/(.*)$/);
    if (!sm) return [0, 'Missing a scheme. Start with "http://", "https://" or "ftp://".'];
    if (!/^(https?|ftp)$/.test(sm[1])) return [0, `Scheme "${sm[1]}" is not allowed. Use http, https or ftp.`];
    const rest = sm[2];
    const auth = rest.split(/[\/?#]/)[0];
    const at = auth.lastIndexOf("@");
    let hp = at >= 0 ? auth.slice(at + 1) : auth;
    if (at >= 0 && !userRe.test(auth.slice(0, at))) return [1, "User info has an illegal character."];
    const ci = hp.lastIndexOf(":");
    if (ci >= 0) {
      const port = hp.slice(ci + 1); hp = hp.slice(0, ci);
      if (!portRe.test(port)) return [3, `Port "${port}" is outside 1 to 65535.`];
    }
    if (!hostRe.test(hp)) {
      let m = "Host is not a valid domain, IPv4 address or localhost.";
      if (!hp) m = "Host is missing.";
      else if (/^[\d.]+$/.test(hp)) m = "Not a valid IPv4 address: octets must be 0 to 255 with no leading zeros.";
      else if (/\.\.|^\./.test(hp)) m = "Host has an empty label (leading or consecutive dots).";
      else if (/(^|\.)-|-(\.|$)/.test(hp)) m = "A host label cannot start or end with a hyphen.";
      else if (/[^A-Za-z0-9.-]/.test(hp)) m = `Host contains "${hp.match(/[^A-Za-z0-9.-]/)[0]}", which is not allowed.`;
      else if (!hp.includes(".")) m = "Host needs at least one dot and an alphabetic top-level domain.";
      return [2, m];
    }
    const tail = rest.slice(auth.length);
    if (/%(?![0-9A-Fa-f]{2})/.test(tail)) return [4, "Malformed percent-encoding. Use % followed by two hex digits."];
    const bad = tail.match(/[^A-Za-z0-9._~!$&'()*+,;=:@\/?#%-]/);
    if (bad) return [4, `Illegal character "${bad[0]}" in the path, query or fragment.`];
    return [4, "The path, query or fragment breaks the grammar."];
  }

  const api = { URL_RE, NAIVE, INTER, isValid, parse, diagnose, parts: { LABEL, DOMAIN, OCT, IPV4, PORTNUM, PCH, PATH, QF } };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.V = api;
})(this);
