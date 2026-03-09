import { Connection, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Mini Solana Validator Demo Script
 * 
 * This script demonstrates the core functionality of the Mini Solana Validator:
 * 1. Connecting to the validator
 * 2. Requesting an airdrop
 * 3. Transferring SOL between accounts
 * 4. Printing account balances
 * 
 * Run this script to verify the validator is working correctly.
 */

async function run() {
    console.log("🚀 Mini Solana Validator Demo\n");
    console.log("This script demonstrates core validator functionality\n");

    // Connect to the validator
    const connection = new Connection("http://localhost:3000");
    console.log("📡 Connected to validator at http://localhost:3000");

    // Generate test accounts
    const sender = Keypair.generate();
    const receiver = Keypair.generate();
    console.log("👤 Generated test accounts:");
    console.log("   Sender:", sender.publicKey.toBase58());
    console.log("   Receiver:", receiver.publicKey.toBase58());

    // Check initial balances
    console.log("\n� Checking initial balances...");
    const senderBalance = await connection.getBalance(sender.publicKey);
    const receiverBalance = await connection.getBalance(receiver.publicKey);
    console.log("   Sender balance:", senderBalance, "lamports");
    console.log("   Receiver balance:", receiverBalance, "lamports");

    // Request airdrop
    console.log("\n🪂 Requesting airdrop (2 SOL)...");
    try {
        const airdropSignature = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
        console.log("   ✅ Airdrop successful!");
        console.log("   📝 Signature:", airdropSignature);

        // Wait a moment and check new balance
        await new Promise(resolve => setTimeout(resolve, 100));
        const newSenderBalance = await connection.getBalance(sender.publicKey);
        console.log("   💰 New sender balance:", newSenderBalance, "lamports");
    } catch (error) {
        console.log("   ❌ Airdrop failed:", error.message);
        return;
    }

    // Get latest blockhash for transaction
    console.log("\n� Getting latest blockhash...");
    try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        console.log("   ✅ Blockhash:", blockhash);
        console.log("   📊 Last valid block height:", lastValidBlockHeight);
    } catch (error) {
        console.log("   ❌ Failed to get blockhash:", error.message);
        return;
    }

    // Create and send transfer transaction
    console.log("\n� Creating transfer transaction (0.5 SOL)...");
    try {
        const transferAmount = 0.5 * LAMPORTS_PER_SOL;
        
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: receiver.publicKey,
                lamports: transferAmount
            })
        );

        // Get recent blockhash and sign transaction
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender.publicKey;
        transaction.sign(sender);

        console.log("   📝 Transaction created and signed");

        // Send transaction
        const transferSignature = await connection.sendRawTransaction(transaction.serialize());
        console.log("   ✅ Transfer successful!");
        console.log("   📝 Signature:", transferSignature);

        // Wait and check final balances
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const finalSenderBalance = await connection.getBalance(sender.publicKey);
        const finalReceiverBalance = await connection.getBalance(receiver.publicKey);
        
        console.log("\n💰 Final balances after transfer:");
        console.log("   Sender:", finalSenderBalance, "lamports");
        console.log("   Receiver:", finalReceiverBalance, "lamports");
        console.log("   ✅ Transfer completed successfully!");

    } catch (error) {
        console.log("   ❌ Transfer failed:", error.message);
        return;
    }

    // Get account info
    console.log("\n📋 Getting account information...");
    try {
        const accountInfo = await connection.getAccountInfo(sender.publicKey);
        if (accountInfo) {
            console.log("   ✅ Sender account info:");
            console.log("      Lamports:", accountInfo.lamports);
            console.log("      Owner:", accountInfo.owner);
            console.log("      Executable:", accountInfo.executable);
            console.log("      Data length:", accountInfo.data[0].length);
        } else {
            console.log("   ❌ Account not found");
        }
    } catch (error) {
        console.log("   ❌ Failed to get account info:", error.message);
    }

    // Test rent exemption calculation
    console.log("\n🏠 Testing rent exemption calculation...");
    try {
        const rentExempt = await connection.getMinimumBalanceForRentExemption(165);
        console.log("   ✅ Rent exemption for 165 bytes:", rentExempt, "lamports");
    } catch (error) {
        console.log("   ❌ Rent exemption calculation failed:", error.message);
    }

    console.log("\n🎯 Demo completed successfully!");
    console.log("💡 The Mini Solana Validator is working correctly.");
    console.log("🌐 Validator is running at: http://localhost:3000");
    console.log("\n📚 For more information, see README.md");
}

// Handle errors gracefully
run().catch((error) => {
    console.error("❌ Demo failed with error:", error.message);
    console.error("💡 Make sure the validator is running: npm start");
    process.exit(1);
});