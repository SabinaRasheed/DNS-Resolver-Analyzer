import {
  resolve4,
  resolve6,
  resolveMx,
  resolveNs,
  resolveTxt,
  resolveCname,
} from "dns/promises";
import { performance } from "perf_hooks";

//Get domain name from CLI input
const domain = process.argv[2];

if (!domain) {
  console.error(
    "❗ Please provide a domain. Example: node src/index.js google.com"
  );
  process.exit(1); // Exit if no domain provided
}

// async function queryDomain(domain) {
//   try {
//     // Call resolve4 with the domain name to get IPv4 addresses
//     const addresses = await resolve4(domain);
//     console.log(`IPv4 address(es) for ${domain}:`, addresses);
//   } catch (err) {
//     console.error(`Error resolving ${domain}:`, err.message);
//   }
// }

// Create a generic function to time any DNS query
async function measureQueryTime(domain, resolverFn, recordType) {
  try {
    const start = performance.now(); // Start timer
    const result = await resolverFn(domain); // Perform DNS resolution
    const end = performance.now(); // End timer

    const timeTaken = (end - start).toFixed(2);

    console.log(`\n📌 ${recordType} Record(s) for ${domain}:`);
    console.log(result);
    console.log(`⏱️  Response Time: ${timeTaken} ms`);

    // Check if the response time is slow
    if (timeTaken > 200) {
      //example threshold
      console.warn(
        `⚠️ Slow response for ${recordType} record: ${timeTaken} ms`
      );
    }
  } catch (err) {
    if (err.code === "ETIMEOUT") {
      console.error(`❌ Timeout error fetching ${recordType} for ${domain}`);
    } else if (err.code === "NXDOMAIN") {
      console.error(`❌ Domain ${domain} does not exist (NXDOMAIN)`);
    } else if (err.code === "ENOTFOUND") {
      console.error(`❌ DNS server could not be found for ${domain}`);
    } else if (err.code === "ECONNREFUSED") {
      console.error(`❌ Connection refused by DNS server for ${domain}`);
    } else if (err.code === "SERVFAIL") {
      console.error(
        `❌ DNS server failure occurred while resolving ${recordType} for ${domain}`
      );
    } else {
      console.error(
        `❌ Error fetching ${recordType} for ${domain}: ${err.message}`
      );
    }
  }
}

// Main function to run queries for different record types
async function queryDomainRecords(domain) {
  console.log(`\n🔍 Querying DNS records for: ${domain}`);

  //we can use promise.all() to run parallel queries

  await measureQueryTime(domain, resolve4, "A"); // IPv4
  await measureQueryTime(domain, resolve6, "AAAA"); // IPv6
  await measureQueryTime(domain, resolveMx, "MX"); // Mail
  await measureQueryTime(domain, resolveNs, "NS"); // Nameservers
  await measureQueryTime(domain, resolveTxt, "TXT"); // Text records
  await measureQueryTime(domain, resolveCname, "CNAME"); // Canonical name
}

// queryDomain("google.com");
// queryDomain("facebook.com");
queryDomainRecords(domain);
