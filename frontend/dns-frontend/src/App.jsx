import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Credits from "./Credits";

const allRecordTypes = ["A", "AAAA", "MX", "NS", "CNAME"];

export default function App() {
  const [domain, setDomain] = useState("");
  const [selectedTypes, setSelectedTypes] = useState(["A", "MX"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [traceInfo, setTraceInfo] = useState([]);

  const toggleRecordType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const isValidDomain = (domain) => {
    const regex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
    return regex.test(domain);
  };

  const handleQuery = async () => {
    if (!isValidDomain(domain)) {
      toast.error("Please enter a valid domain name (e.g. facebook.com)");
      return;
    }

    setLoading(true);
    setResults([]);
    setTraceInfo([]);

    try {
      const res = await Promise.all(
        selectedTypes.map(async (type) => {
          const response = await fetch(
            `http://localhost:3000/api/resolve?domain=${domain}&type=${type}`
          );
          const data = await response.json();
          return { type, ...data };
        })
      );

      const traces = res
        .filter((r) => !r.error && r.trace)
        .map((r) => r.trace)
        .flat();

      setTraceInfo([...new Set(traces)]);
      setResults(res);
    } catch (err) {
      toast.error("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyError = (type) => {
    const map = {
      A: "IP address resolution failed.",
      AAAA: "IPv6 address not found.",
      MX: "Mail server not found.",
      NS: "Nameserver lookup failed",
      CNAME: "Couldn’t retrieve CNAME records. Try again later.",
    };
    return map[type] || "No records found.";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
      <Toaster position="top-center" reverseOrder={false} />

      <motion.div
        layout
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-[#1e293b] rounded-3xl shadow-2xl p-8 border border-gray-700 space-y-8 flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold text-center text-cyan-400">
          DNS Resolver & Query Analyzer
        </h1>

        <input
          className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          placeholder="Enter domain (e.g. example.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value.trim())}
        />

        <div className="w-full">
          <p className="font-semibold text-sm text-cyan-300 mb-2">
            Select Record Types:
          </p>
          <div className="flex flex-wrap gap-3">
            {allRecordTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleRecordType(type)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition cursor-pointer
                  ${
                    selectedTypes.includes(type)
                      ? "bg-cyan-600 text-white border-cyan-400"
                      : "bg-[#0f172a] text-gray-300 border-gray-600 hover:bg-gray-700"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl cursor-pointer shadow-lg transition-transform transform hover:scale-105"
          onClick={handleQuery}
        >
          {loading ? "Querying..." : "Query DNS"}
        </button>

        <AnimatePresence>
          {loading && (
            <motion.div
              className="text-center mt-4 text-cyan-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ClipLoader color="#06b6d4" size={50} />
              <div>Querying DNS records...</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!loading && traceInfo.length > 0 && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                🌐 How Your Query Was Resolved
              </h3>
              <motion.div
                className="flex flex-wrap justify-center gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.15,
                    },
                  },
                }}
              >
                {traceInfo.map((hop, i) => (
                  <motion.div
                    key={i}
                    className="bg-cyan-800 px-3 py-1 rounded-full text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {hop}{" "}
                    {i < traceInfo.length - 1 && (
                      <span className="mx-1">→</span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!loading &&
            results.length > 0 &&
            results.map((r) => (
              <motion.div
                key={r.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#0f172a] rounded-xl p-4 border border-gray-600 mt-4 w-full"
              >
                <h3 className="text-lg font-bold text-cyan-400 mb-1">
                  {r.type} Record
                </h3>
                {r.error ? (
                  <div className="flex items-center text-red-400">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01M19.071 4.929a10 10 0 1 0 0 14.142 10 10 0 0 0 0-14.142z"
                      />
                    </svg>
                    {getFriendlyError(r.type)}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-2">⏱️ {r.time} ms</p>
                    <ul className="text-sm list-disc list-inside text-gray-300">
                      {r.records.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            ))}
        </AnimatePresence>

        {results.filter((r) => !r.error).length > 0 && (
          <motion.div
            className="mt-10 w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">
              Query Resolution Time
            </h3>
            <div
              style={{ width: "100%", height: "300px", position: "relative" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.filter((r) => !r.error)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="type"
                    stroke="#ccc"
                    label={{
                      value: "Record Type",
                      position: "insideBottomRight",
                    }}
                  />
                  <YAxis
                    stroke="#ccc"
                    label={{
                      value: "Time (ms)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    domain={[0, 1200]}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke="#06b6d4"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
        <Credits />
      </motion.div>
    </div>
  );
}
