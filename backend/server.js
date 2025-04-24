import express from "express";
import cors from "cors";
import {
  resolve4,
  resolve6,
  resolveMx,
  resolveNs,
  resolveCname,
} from "dns/promises";
import { performance } from "perf_hooks";

const app = express();
const PORT = 3000;

app.use(cors());

const resolvers = {
  A: resolve4,
  AAAA: resolve6,
  MX: async (domain) => {
    const mx = await resolveMx(domain);
    return mx.map(
      (entry) => `${entry.exchange} (Priority: ${entry.priority})`
    );
  },
  NS: resolveNs,
  CNAME: resolveCname,
};

const generateTrace = (domain) => {
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  const secondLevel = parts[parts.length - 2];
  const subdomain = parts.slice(0, -2).join(".");

  const trace = ["Root DNS Server"];

  if (tld) trace.push(`TLD Server (.${tld})`);
  if (secondLevel) trace.push(`Authoritative Server (${secondLevel}.${tld})`);
  if (subdomain) trace.push(`Subdomain (${subdomain})`);
  trace.push(`Domain Queried (${domain})`);

  return trace;
};

app.get("/api/resolve", async (req, res) => {
  const { domain, type } = req.query;

  if (!domain || !type) {
    return res.status(400).json({ error: "Missing domain or record type" });
  }

  const resolverFn = resolvers[type];
  if (!resolverFn) {
    return res.status(400).json({ error: "Unsupported DNS record type" });
  }

  try {
    const start = performance.now();
    const records = await resolverFn(domain);
    const end = performance.now();
    const time = (end - start).toFixed(2);
    const trace = generateTrace(domain);

    res.json({ records, time, trace });
  } catch (err) {
    let message = err.message;

    switch (err.code) {
      case "ETIMEOUT":
        message = "DNS query timed out.";
        break;
      case "ENOTFOUND":
        message = "DNS server could not find the domain.";
        break;
      case "NXDOMAIN":
        message = "The domain does not exist (NXDOMAIN).";
        break;
      case "ECONNREFUSED":
        message = "Connection refused by DNS server.";
        break;
      case "SERVFAIL":
        message = "DNS server failed to resolve the query.";
        break;
    }

    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`DNS Resolver API is running on http://localhost:${PORT}`);
});
