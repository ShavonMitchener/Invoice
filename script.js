// --- BASIC SETUP ---
document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3,"0");

// --- AUTO-EXPAND TEXTAREA FUNCTION ---
function autoExpand(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

// --- SETUP AUTO-EXPAND FOR ALL TEXTAREAS ---
function setupAutoExpandOnTextareas() {
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', function() {
      autoExpand(this);
    });
    autoExpand(textarea);
  });
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
    r.innerHTML = `<td><input type="number" class="qty" min="1" value="1"></td>
                   <td><textarea class="desc" placeholder="Part name" rows="1"></textarea></td>
                   <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
    partsBody.appendChild(r);
    setupNewTextarea(r.querySelector('.desc'));
    r.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
  }
  
  calculateTotals();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  alert(`✅ Loaded invoice #${receipt.invoiceNo}`);
}

function setupNewTextarea(textarea) {
  textarea.addEventListener('input', function() {
    autoExpand(this);
  });
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
  r.innerHTML = `<td><input type="number" class="qty" min="1" value="1"></td>
                 <td><textarea class="desc" placeholder="Part name" rows="1"></textarea></td>
                 <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("partsBody").appendChild(r);
  setupNewTextarea(r.querySelector('.desc'));
  r.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
  calculateTotals();
});

// --- SAVE RECEIPT ---
document.getElementById("saveBtn").addEventListener("click", () => {
  calculateTotals();
  const receipt = {
    invoiceNo: invoiceNo.toString().padStart(3,"0"),
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

  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));

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
      From: ${r.fromStaff || ''} | Signed: ${r.signedBy || 'N/A'}<br>
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

// --- SETUP ---
setupAutoExpandOnTextareas();
calculateTotals();
