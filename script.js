// --- GOOGLE SHEETS CONFIGURATION ---
var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvl_9L2ZTnbOvXbWNsS3OmvufpBuOU0LE3smhocZ_qgNS1EMyN0JWfcP2uOrQ1JCAh/exec';

// --- BASIC SETUP ---
document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3,"0");

// --- SYNC STATUS DISPLAY ---
function showSyncStatus(message, type = 'success') {
  let statusDiv = document.querySelector('.sync-status');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.className = 'sync-status';
    document.body.appendChild(statusDiv);
  }
  statusDiv.textContent = message;
  statusDiv.className = `sync-status ${type}`;
  setTimeout(() => {
    if (statusDiv) statusDiv.remove();
  }, 3000);
}

// --- AUTO-EXPAND TEXTAREA FUNCTION ---
function autoExpand(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

// --- SETUP AUTO-EXPAND FOR ALL TEXTAREAS ---
function setupAutoExpandOnTextareas() {
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.removeEventListener('input', autoExpandHandler);
    textarea.addEventListener('input', autoExpandHandler);
    autoExpand(textarea);
  });
}

function autoExpandHandler() {
  autoExpand(this);
}

// --- CALCULATE TOTALS ---
function calculateTotals() {
  let serviceTotal = 0;
  document.querySelectorAll(".s-amt").forEach(i => serviceTotal += parseFloat(i.value) || 0);

  let partsTotal = 0;
  document.querySelectorAll("#partsBody tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += qty * amt;
  });

  const grand = serviceTotal + partsTotal;
  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("grandTotal").textContent = grand.toFixed(2);
}

// --- FUNCTION TO LOAD RECEIPT INTO FORM ---
function loadReceiptIntoForm(receipt) {
  const serviceBody = document.getElementById("serviceBody");
  const partsBody = document.getElementById("partsBody");
  
  serviceBody.innerHTML = "";
  partsBody.innerHTML = "";
  
  document.getElementById("custName").value = receipt.customer || "";
  document.getElementById("vehicle").value = receipt.vehicle || "";
  document.getElementById("fromName").value = receipt.fromStaff || receipt.from || "";
  document.getElementById("signedBy").value = receipt.signedBy || "";
  
  // Load service rows
  const services = receipt.services || receipt.service || [];
  if (services.length > 0) {
    services.forEach(service => {
      const r = document.createElement("tr");
      r.innerHTML = `<tr><textarea class="s-desc" placeholder="Service description" rows="1">${escapeHtml(service.desc)}</textarea></td>
                     <td><input type="number" class="s-amt" min="0" step="0.01" value="${service.amt || service.amount || 0}"></td>`;
      serviceBody.appendChild(r);
      setupNewTextarea(r.querySelector('.s-desc'));
      r.querySelector(".s-amt").addEventListener("input", calculateTotals);
    });
  } else {
    const r = document.createElement("tr");
    r.innerHTML = `<tr><textarea class="s-desc" placeholder="Service description" rows="1"></textarea></td>
                   <td><input type="number" class="s-amt" min="0" step="0.01" value="0.00"></td>`;
    serviceBody.appendChild(r);
    setupNewTextarea(r.querySelector('.s-desc'));
    r.querySelector(".s-amt").addEventListener("input", calculateTotals);
  }
  
  // Load parts rows
  const parts = receipt.parts || [];
  if (parts.length > 0) {
    parts.forEach(part => {
      const r = document.createElement("tr");
      r.innerHTML = `<td><input type="number" class="qty" min="1" value="${part.qty || 1}"></td>
                     <td><textarea class="desc" placeholder="Part name" rows="1">${escapeHtml(part.desc)}</textarea></td>
                     <td><input type="number" class="amt" min="0" step="0.01" value="${part.amt || part.amount || 0}"></td>`;
      partsBody.appendChild(r);
      setupNewTextarea(r.querySelector('.desc'));
      r.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
    });
  } else {
    const r = document.createElement("tr");
    r.innerHTML = `<tr><input type="number" class="qty" min="1" value="1"></td>
                   <td><textarea class="desc" placeholder="Part name" rows="1"></textarea></td>
                   <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
    partsBody.appendChild(r);
    setupNewTextarea(r.querySelector('.desc'));
    r.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
  }
  
  calculateTotals();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showSyncStatus(`✅ Loaded invoice #${receipt.invoiceNo}`, 'success');
}

function setupNewTextarea(textarea) {
  textarea.addEventListener('input', autoExpandHandler);
  autoExpand(textarea);
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- ADD SERVICE ROW ---
document.getElementById("addService").addEventListener("click", () => {
  const r = document.createElement("tr");
  r.innerHTML = `<tr><textarea class="s-desc" placeholder="Service description" rows="1"></textarea></td>
                 <tr><input type="number" class="s-amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("serviceBody").appendChild(r);
  setupNewTextarea(r.querySelector('.s-desc'));
  r.querySelector(".s-amt").addEventListener("input", calculateTotals);
  calculateTotals();
});

// --- ADD PART ROW ---
document.getElementById("addPart").addEventListener("click", () => {
  const r = document.createElement("tr");
  r.innerHTML = `<tr><input type="number" class="qty" min="1" value="1"></td>
                 <td><textarea class="desc" placeholder="Part name" rows="1"></textarea></td>
                 <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("partsBody").appendChild(r);
  setupNewTextarea(r.querySelector('.desc'));
  r.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
  calculateTotals();
});

// --- GET CURRENT RECEIPT DATA ---
function getCurrentReceiptData() {
  calculateTotals();
  return {
    invoiceNo: invoiceNo.toString().padStart(3, "0"),
    date: document.getElementById("date").textContent,
    customer: document.getElementById("custName").value.trim(),
    vehicle: document.getElementById("vehicle").value.trim(),
    fromStaff: document.getElementById("fromName").value.trim(),
    signedBy: document.getElementById("signedBy").value.trim(),
    serviceTotal: document.getElementById("serviceTotal").textContent,
    partsTotal: document.getElementById("partsTotal").textContent,
    grandTotal: document.getElementById("grandTotal").textContent,
    services: [],
    parts: []
  };
}

function collectServicesAndParts(receipt) {
  document.querySelectorAll("#serviceBody tr").forEach(row => {
    receipt.services.push({
      desc: row.querySelector(".s-desc").value,
      amt: row.querySelector(".s-amt").value
    });
  });
  document.querySelectorAll("#partsBody tr").forEach(row => {
    receipt.parts.push({
      qty: row.querySelector(".qty").value,
      desc: row.querySelector(".desc").value,
      amt: row.querySelector(".amt").value
    });
  });
  return receipt;
}

// --- SAVE TO LOCALSTORAGE ---
function saveToLocalStorage(receipt) {
  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));
}

// --- SAVE TO GOOGLE SHEETS ---
async function saveToGoogleSheets(receipt) {
  try {
    showSyncStatus('☁️ Syncing to cloud...', 'syncing');
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receipt)
    });
    showSyncStatus('✅ Synced to cloud!', 'success');
    return true;
  } catch (error) {
    console.error('Google Sheets sync failed:', error);
    showSyncStatus('⚠️ Cloud sync failed (saved locally)', 'error');
    return false;
  }
}

// --- LOAD FROM GOOGLE SHEETS ---
async function loadFromGoogleSheets() {
  try {
    showSyncStatus('☁️ Loading from cloud...', 'syncing');
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const receipts = await response.json();
    showSyncStatus(`✅ Loaded ${receipts.length} receipts from cloud`, 'success');
    return receipts;
  } catch (error) {
    console.error('Failed to load from Google Sheets:', error);
    showSyncStatus('⚠️ Could not load from cloud', 'error');
    return null;
  }
}

// --- MERGE RECEIPTS ---
function mergeReceipts(cloudReceipts, localReceipts) {
  if (!cloudReceipts || cloudReceipts.length === 0) return localReceipts;
  
  const merged = [...localReceipts];
  cloudReceipts.forEach(cloudReceipt => {
    const exists = merged.some(r => r.invoiceNo === cloudReceipt.invoiceNo);
    if (!exists) {
      merged.push(cloudReceipt);
    }
  });
  return merged;
}

// --- SYNC BUTTON HANDLER ---
document.getElementById("syncBtn").addEventListener("click", async () => {
  showSyncStatus('☁️ Syncing with cloud...', 'syncing');
  const cloudReceipts = await loadFromGoogleSheets();
  if (cloudReceipts) {
    const localReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    const merged = mergeReceipts(cloudReceipts, localReceipts);
    localStorage.setItem("receipts", JSON.stringify(merged));
    showSyncStatus(`✅ Synced! ${merged.length} total receipts`, 'success');
    setTimeout(() => location.reload(), 1500);
  }
});

// --- SAVE RECEIPT BUTTON ---
document.getElementById("saveBtn").addEventListener("click", async () => {
  calculateTotals();
  let receipt = getCurrentReceiptData();
  receipt = collectServicesAndParts(receipt);
  
  saveToLocalStorage(receipt);
  await saveToGoogleSheets(receipt);
  
  alert("✅ Receipt saved successfully!");
});

// --- SEARCH RECEIPTS ---
document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultsArea = document.getElementById("searchResults");
  resultsArea.innerHTML = "";
  const receipts = JSON.parse(localStorage.getItem("receipts") || "[]");

  const matches = receipts.filter(r =>
    r.invoiceNo.toLowerCase().includes(query) ||
    r.customer.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    resultsArea.innerHTML = "<p>No receipts found.</p>";
    return;
  }

  matches.forEach((r) => {
    const div = document.createElement("div");
    div.className = "found-receipt";
    
    div.innerHTML = `
      <strong>Invoice #${r.invoiceNo}</strong> | ${r.date}<br>
      Customer: ${r.customer} | Vehicle: ${r.vehicle}<br>
      From: ${r.fromStaff || r.from || ''} | Signed: ${r.signedBy || 'N/A'}<br>
      <strong>Service Total: $${r.serviceTotal}</strong> | <strong>Parts Total: $${r.partsTotal}</strong><br>
      <strong>Grand Total: $${r.grandTotal}</strong><br>
      <button class="viewBtn">📄 View Full Details</button>
      <button class="deleteBtn">🗑️ Delete</button>
      <hr>`;

    div.querySelector(".viewBtn").addEventListener("click", () => {
      loadReceiptIntoForm(r);
    });

    div.querySelector(".deleteBtn").addEventListener("click", () => {
      if(confirm(`Delete invoice #${r.invoiceNo}?`)){
        let allReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
        allReceipts = allReceipts.filter(x => x.invoiceNo !== r.invoiceNo);
        localStorage.setItem("receipts", JSON.stringify(allReceipts));
        div.remove();
        alert("🗑️ Invoice deleted.");
      }
    });

    resultsArea.appendChild(div);
  });
});

// --- PRINT + NEW INVOICE ---
document.getElementById("printBtn").addEventListener("click", () => window.print());
document.getElementById("newBtn").addEventListener("click", () => {
  invoiceNo++;
  localStorage.setItem("invoiceNo", invoiceNo);
  window.location.reload();
});

// --- RESET INVOICE NUMBER ---
document.getElementById("resetBtn").addEventListener("click", () => {
  if(confirm("Reset invoice number back to 001?")){
    localStorage.removeItem("invoiceNo");
    window.location.reload();
  }
});

// --- AUTO LOAD CLOUD RECEIPTS ON STARTUP ---
async function autoLoadCloudReceipts() {
  const cloudReceipts = await loadFromGoogleSheets();
  if (cloudReceipts && cloudReceipts.length > 0) {
    const localReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    const merged = mergeReceipts(cloudReceipts, localReceipts);
    if (merged.length > localReceipts.length) {
      localStorage.setItem("receipts", JSON.stringify(merged));
      console.log(`Auto-synced ${merged.length - localReceipts.length} new receipts from cloud`);
    }
  }
}

// --- SETUP AUTO-EXPAND FOR EXISTING TEXTAREAS ON PAGE LOAD ---
setupAutoExpandOnTextareas();

// --- INITIAL CALCULATION ---
calculateTotals();

// --- AUTO LOAD FROM CLOUD ---
autoLoadCloudReceipts();
