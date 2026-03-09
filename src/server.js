import express from "express";
import { handleRpc } from "./rpcRouter.js";

/**
 * MINI SOLANA VALIDATOR - SERVER
 * 
 * Entry point for the single-node in-memory Solana JSON-RPC server.
 * Listens on port 3000 and routes all POST requests to the RPC router.
 */

const app = express();

// Use built-in Express JSON parser instead of body-parser
app.use(express.json({ limit: "10mb" }));

/**
 * Main RPC endpoint
 * Handles all JSON-RPC 2.0 requests at the root path.
 */
app.post("/", async (req, res) => {
    try {
        const response = await handleRpc(req.body);
        res.json(response);
    } catch (err) {
        console.error("Critical server error during handleRpc:", err);
        res.json({
            jsonrpc: "2.0",
            id: req.body?.id ?? null,
            error: {
                code: -32600,
                message: "Invalid request"
            }
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Mini Solana validator running on port ${PORT}`);
    console.log(`Ready for JSON-RPC 2.0 requests.`);
});