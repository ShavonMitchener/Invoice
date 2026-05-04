// --- BASIC SETUP ---
document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3, "0");

// --- AUTO-EXPAND TEXTAREA ---
function autoExpand(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + "px";
}

function setupAutoExpand(element) {
  element.addEventListener("input", function() {
    autoExpand(this);
  });
  autoExpand(element);
}

// --- CALCULATE TOTALS (WITH DEPOSIT) ---
function calculateTotals() {
  // Calculate service total
  let serviceTotal = 0;
  document.querySelectorAll(".s-amt").forEach(input => {
    serviceTotal += parseFloat(input.value) || 0;
  });

  // Calculate parts total
  let partsTotal = 0;
  document.querySelectorAll("#partsBody tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += qty * amt;
  });

  const grandTotal = serviceTotal + partsTotal;
  const deposit = parseFloat(document.getElementById("depositAmount").value) || 0;
  const balanceAfterDeposit = grandTotal - deposit;

  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
  document.getElementById("balanceAfterDeposit").textContent = balanceAfterDeposit.toFixed(2);
  
  // Make balance red if negative
  const balanceSpan = document.getElementById("balanceAfterDeposit");
  if (balanceAfterDeposit < 0) {
    balanceSpan.style.color = "#cc0000";
    balanceSpan.style.fontWeight = "bold";
  } else {
    balanceSpan.style.color = "#000";
    balanceSpan.style.fontWeight = "normal";
  }
}

// --- DELETE ROW FUNCTION ---
function deleteRow(button, isService) {
  const row = button.closest("tr");
  row.remove();
  calculateTotals();
}

// --- ADD SERVICE ROW ---
function addServiceRow(desc = "", amt = "0.00") {
  const tbody = document.getElementById("serviceBody");
  const newRow = document.createElement("tr");
  
  newRow.innerHTML = `
    <td><textarea class="s-desc" placeholder="Service description" rows="2">${escapeHtml(desc)}</textarea></td>
    <td><input type="number" class="s-amt" min="0" step="0.01" value="${amt}"></td>
    <td><button class="delete-btn" title="Remove">✖</button></td>
  `;
  
  tbody.appendChild(newRow);
  
  const newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelector(".s-amt").addEventListener("input", calculateTotals);
  newRow.querySelector(".delete-btn").addEventListener("click", function() {
    deleteRow(this, true);
  });
  
  calculateTotals();
}

// --- ADD PART ROW ---
function addPartRow(qty = "1", desc = "", amt = "0.00") {
  const tbody = document.getElementById("partsBody");
  const newRow = document.createElement("tr");
  
  newRow.innerHTML = `
    <td><input type="number" class="qty" min="1" value="${qty}"></td>
    <td><textarea class="desc" placeholder="Part name" rows="2">${escapeHtml(desc)}</textarea></td>
    <td><input type="number" class="amt" min="0" step="0.01" value="${amt}"></td>
    <td><button class="delete-btn" title="Remove">✖</button></td>
  `;
  
  tbody.appendChild(newRow);
  
  const newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", calculateTotals);
  });
  newRow.querySelector(".delete-btn").addEventListener("click", function() {
    deleteRow(this, false);
  });
  
  calculateTotals();
}

// --- SETUP EXISTING ROWS (for loading receipts) ---
function setupExistingRows() {
  document.querySelectorAll("#serviceBody tr").forEach(row => {
    const textarea = row.querySelector("textarea");
    if (textarea) setupAutoExpand(textarea);
    const deleteBtn = row.querySelector(".delete-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", function() { deleteRow(this, true); });
    row.querySelectorAll(".s-amt").forEach(i => i.addEventListener("input", calculateTotals));
  });
  
  document.querySelectorAll("#partsBody tr").forEach(row => {
    const textarea = row.querySelector("textarea");
    if (textarea) setupAutoExpand(textarea);
    const deleteBtn = row.querySelector(".delete-btn");
    if (deleteBtn) deleteBtn.addEventListener("click", function() { deleteRow(this, false); });
    row.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
  });
}

// --- ADD BUTTONS ---
document.getElementById("addService").addEventListener("click", () => addServiceRow());
document.getElementById("addPart").addEventListener("click", () => addPartRow());

// --- DEPOSIT INPUT LISTENER ---
document.getElementById("depositAmount").addEventListener("input", calculateTotals);

// --- SAVE RECEIPT ---
document.getElementById("saveBtn").addEventListener("click", function() {
  calculateTotals();
  
  const receipt = {
    invoiceNo: invoiceNo.toString().padStart(3, "0"),
    date: document.getElementById("date").textContent,
    customer: document.getElementById("custName").value.trim(),
    vehicle: document.getElementById("vehicle").value.trim(),
    fromStaff: document.getElementById("fromName").value.trim(),
    signedBy: document.getElementById("signedBy").value.trim(),
    deposit: document.getElementById("depositAmount").value,
    serviceTotal: document.getElementById("serviceTotal").textContent,
    partsTotal: document.getElementById("partsTotal").textContent,
    grandTotal: document.getElementById("grandTotal").textContent,
    balanceAfterDeposit: document.getElementById("balanceAfterDeposit").textContent,
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

  const receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));
  
  alert("Receipt saved successfully!");
});

// --- SEARCH RECEIPTS ---
document.getElementById("searchBtn").addEventListener("click", function() {
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

  matches.forEach(r => {
    const div = document.createElement("div");
    div.className = "found-receipt";
    div.innerHTML = `
      <strong>Invoice #${r.invoiceNo}</strong> | ${r.date}<br>
      Customer: ${r.customer} | Vehicle: ${r.vehicle}<br>
      From: ${r.fromStaff || ""} | Signed: ${r.signedBy || "N/A"}<br>
      Deposit: $${r.deposit || "0.00"} | Balance: $${r.balanceAfterDeposit || r.grandTotal}<br>
      <strong>Grand Total: $${r.grandTotal}</strong><br>
      <button class="viewBtn">View Full Details</button>
      <button class="deleteBtn">Delete</button>
      <hr>
    `;

    div.querySelector(".viewBtn").addEventListener("click", function() {
      // Load receipt into form
      document.getElementById("custName").value = r.customer || "";
      document.getElementById("vehicle").value = r.vehicle || "";
      document.getElementById("fromName").value = r.fromStaff || "";
      document.getElementById("signedBy").value = r.signedBy || "";
      document.getElementById("depositAmount").value = r.deposit || "0.00";
      
      const serviceBody = document.getElementById("serviceBody");
      const partsBody = document.getElementById("partsBody");
      serviceBody.innerHTML = "";
      partsBody.innerHTML = "";
      
      if (r.services && r.services.length > 0) {
        r.services.forEach(s => {
          addServiceRow(s.desc, s.amt);
        });
      } else {
        addServiceRow();
      }
      
      if (r.parts && r.parts.length > 0) {
        r.parts.forEach(p => {
          addPartRow(p.qty, p.desc, p.amt);
        });
      } else {
        addPartRow();
      }
      
      calculateTotals();
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("Loaded invoice #" + r.invoiceNo);
    });

    div.querySelector(".deleteBtn").addEventListener("click", function() {
      if (confirm("Delete invoice #" + r.invoiceNo + "?")) {
        let allReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
        allReceipts = allReceipts.filter(x => x.invoiceNo !== r.invoiceNo);
        localStorage.setItem("receipts", JSON.stringify(allReceipts));
        div.remove();
        alert("Invoice deleted.");
      }
    });

    resultsArea.appendChild(div);
  });
});

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- OTHER BUTTONS ---
document.getElementById("printBtn").addEventListener("click", function() {
  window.print();
});

document.getElementById("newBtn").addEventListener("click", function() {
  invoiceNo++;
  localStorage.setItem("invoiceNo", invoiceNo);
  window.location.reload();
});

document.getElementById("resetBtn").addEventListener("click", function() {
  if (confirm("Reset invoice number back to 001?")) {
    localStorage.removeItem("invoiceNo");
    window.location.reload();
  }
});

// --- INITIAL SETUP ---
// Add one empty service row
addServiceRow();
// Add one empty parts row
addPartRow();

setupExistingRows();
calculateTotals();
