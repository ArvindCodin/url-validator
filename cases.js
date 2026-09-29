window.CASES = [
  ["https://www.example.com", 1], ["http://sub.domain.co.in/path/to/page?x=1&y=2#top", 1],
  ["ftp://files.example.org/readme.txt", 1], ["https://192.168.1.1:8080/admin", 1],
  ["http://localhost:3000", 1], ["https://user:pass@example.com/", 1],
  ["https://example.com/a%20b", 1], ["https://xn--bcher-kva.example/", 1],
  ["https://my-site.example.com:65535", 1], ["https://example.com?q=1", 1], ["https://a.io", 1],
  ["example.com", 0], ["http:/example.com", 0], ["http://exa mple.com", 0],
  ["https://-bad.example.com", 0], ["https://example..com", 0], ["https://256.1.1.1", 0],
  ["https://example.com:0", 0], ["https://example.com:70000", 0], ["https://example.com/a%zz", 0],
  ["https://example.com/<script>", 0], ["mailto:user@example.com", 0], [" https://example.com", 0],
  ["https://example", 0], ["https://exa_mple.com", 0], ["javascript:alert(1)", 0],
  ["https://example.com/{x}", 0], ["https://.example.com", 0]
];
if (typeof module !== "undefined") module.exports = window.CASES;
