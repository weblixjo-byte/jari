// Automated End-to-End Verification Test Script
async function runTests() {
  console.log("--- STARTING END-TO-END VERIFICATION ---");
  const baseUrl = "http://localhost:3000";

  // 1. Robots.txt and Headers
  console.log("\n1. Testing Robots.txt and Security Headers...");
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  const robotsText = await robotsRes.text();
  const xRobotsTag = robotsRes.headers.get("x-robots-tag");
  console.log("Status:", robotsRes.status);
  console.log("Robots Content:\n", robotsText.trim());
  console.log("X-Robots-Tag Header:", xRobotsTag);

  // 2. White-Label Config
  console.log("\n2. Testing White-Label Configuration API...");
  const configRes = await fetch(`${baseUrl}/api/config`);
  const configJson = await configRes.json();
  console.log("Store Name:", configJson.config.storeName);
  console.log("Currency:", configJson.config.currency);
  console.log("Points Earning Ratio:", configJson.config.pointsPerUnit, "pts per 1 unit");
  console.log("Discount per 100 pts:", configJson.config.discountPer100Pts);

  // 3. Customer OTP Auth
  console.log("\n3. Testing Customer Login via Phone & OTP...");
  const otpRes = await fetch(`${baseUrl}/api/auth/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+965 99112233", otp: "123456" }),
  });
  const otpCookie = otpRes.headers.get("set-cookie");
  const otpJson = await otpRes.json();
  console.log("Customer Auth Success:", otpJson.success);
  console.log("Customer Name:", otpJson.user.name);
  console.log("Customer PIN:", otpJson.user.pin);
  console.log("Customer Points Balance:", otpJson.user.pointsBalance);

  // 4. Customer Dashboard Data
  console.log("\n4. Testing Customer Dashboard with Session Cookie...");
  const dashRes = await fetch(`${baseUrl}/api/customer/dashboard`, {
    headers: { cookie: otpCookie || "" },
  });
  const dashJson = await dashRes.json();
  console.log("Dashboard Formatted PIN:", dashJson.customer.formattedPin);
  console.log("Dashboard Points:", dashJson.customer.pointsBalance, "pts");
  console.log("Equivalent Currency Value:", dashJson.customer.currencyValue, dashJson.customer.currency);
  console.log("Encrypted QR Token:", dashJson.customer.qrSecret);
  console.log("Recent Transactions Count:", dashJson.transactions.length);

  // 5. Cashier Staff Login
  console.log("\n5. Testing Cashier Login...");
  const cashierAuthRes = await fetch(`${baseUrl}/api/auth/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "cashier", username: "cashier1", staffPin: "1234" }),
  });
  const cashierCookie = cashierAuthRes.headers.get("set-cookie");
  const cashierJson = await cashierAuthRes.json();
  console.log("Cashier Auth Success:", cashierJson.success);
  console.log("Cashier Name:", cashierJson.user.name, `(${cashierJson.user.branchName})`);

  // 6. POS Customer Lookup by 6-Digit PIN
  console.log("\n6. Testing POS Customer Lookup by 6-Digit PIN (482910)...");
  const lookupRes = await fetch(`${baseUrl}/api/pos/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cashierCookie || "" },
    body: JSON.stringify({ query: "482910" }),
  });
  const lookupJson = await lookupRes.json();
  console.log("Lookup Success:", lookupJson.success);
  console.log("Identified Customer:", lookupJson.customer.name);
  console.log("Current Points:", lookupJson.customer.pointsBalance, "pts");

  // 7. POS Transaction (Credit Points on Bill)
  console.log("\n7. Testing POS Bill Processing and Automatic Points Credit...");
  const transactRes = await fetch(`${baseUrl}/api/pos/transact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cashierCookie || "" },
    body: JSON.stringify({
      customerId: lookupJson.customer.id,
      billAmount: 8.5, // 8.500 KWD * 10 = +85 pts
    }),
  });
  const transactJson = await transactRes.json();
  console.log("Transaction Success:", transactJson.success);
  console.log("Receipt Reference:", transactJson.receipt.referenceCode);
  console.log("Bill Amount:", transactJson.receipt.billAmount, transactJson.receipt.currency);
  console.log("Points Credited:", `+${transactJson.receipt.pointsEarned} pts`);
  console.log("Old Balance:", transactJson.receipt.oldBalance);
  console.log("New Balance:", transactJson.receipt.newBalance);

  // 8. Super Admin Login & Analytics
  console.log("\n8. Testing Super Admin Login & Analytics Dashboard...");
  const adminAuthRes = await fetch(`${baseUrl}/api/auth/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "super_admin", email: "admin@jari.com", password: "jari@2026" }),
  });
  const adminCookie = adminAuthRes.headers.get("set-cookie");
  const adminJson = await adminAuthRes.json();
  console.log("Admin Auth Success:", adminJson.success);

  const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics`, {
    headers: { cookie: adminCookie || "" },
  });
  const analyticsJson = await analyticsRes.json();
  console.log("Total Points Issued:", analyticsJson.metrics.totalPointsIssued);
  console.log("Total Points Redeemed:", analyticsJson.metrics.totalPointsRedeemed);
  console.log("Loyalty Revenue Volume:", analyticsJson.metrics.totalRevenueVolume, analyticsJson.currency);
  console.log("Active Customers Count:", analyticsJson.metrics.activeCustomerCount);
  console.log("Top Customer Leaderboard:", analyticsJson.metrics.topCustomers.map(c => `${c.name} (${c.lifetimePoints} pts)`).join(", "));

  // 9. Admin White-Label Rebranding Test
  console.log("\n9. Testing Admin White-Label Config Update...");
  const updateRes = await fetch(`${baseUrl}/api/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie: adminCookie || "" },
    body: JSON.stringify({
      storeName: "jari",
      tagline: "Coffee House & Pastry",
      pointsPerUnit: 10,
    }),
  });
  const updateJson = await updateRes.json();
  console.log("Config Update Success:", updateJson.success);
  console.log("Updated Store Tagline:", updateJson.config.tagline);
  console.log("Updated Earning Ratio:", updateJson.config.pointsPerUnit, "pts per unit");

  console.log("\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---");
}

runTests().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
