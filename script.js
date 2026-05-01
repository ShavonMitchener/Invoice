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

// --- SETUP ALL EXISTING TEXTAREAS ---
document.querySelectorAll("textarea").forEach(setupAutoExpand);

// --- CALCULATE TOTALS ---
function calculateTotals() {
  let serviceTotal = 0;
  document.querySelectorAll(".s-amt").forEach(input => {
    serviceTotal += parseFloat(input.value) || 0;
  });

  let partsTotal = 0;
  document.querySelectorAll("#partsBody tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += qty * amt;
  });

  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("grandTotal").textContent = (serviceTotal + partsTotal).toFixed(2);
}

// --- ADD SERVICE ROW (SAME PATTERN AS PARTS) ---
document.getElementById("addService").addEventListener("click", function() {
  const tbody = document.getElementById("serviceBody");
  const newRow = document.createElement("tr");
  
  newRow.innerHTML = `
    <td><textarea class="s-desc" placeholder="Service description" rows="2"></textarea></td>
    <td><input type="number" class="s-amt" min="0" step="0.01" value="0.00"></td>
  `;
  
  tbody.appendChild(newRow);
  
  const newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelector(".s-amt").addEventListener("input", calculateTotals);
  calculateTotals();
});

// --- ADD PART ROW ---
document.getElementById("addPart").addEventListener("click", function() {
  const tbody = document.getElementById("partsBody");
  const newRow = document.createElement("tr");
  
  newRow.innerHTML = `
    <td><input type="number" class="qty" min="1" value="1"></td>
    <td><textarea class="desc" placeholder="Part name" rows="2"></textarea></td>
    <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>
  `;
  
  tbody.appendChild(newRow);
  
  const newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", calculateTotals);
  });
  calculateTotals();
});

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
      <strong>Service Total: $${r.serviceTotal}</strong> | <strong>Parts Total: $${r.partsTotal}</strong><br>
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
      
      const serviceBody = document.getElementById("serviceBody");
      const partsBody = document.getElementById("partsBody");
      serviceBody.innerHTML = "";
      partsBody.innerHTML = "";
      
      r.services.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><textarea class="s-desc" rows="2">${escapeHtml(s.desc)}</textarea></td>
          <td><input type="number" class="s-amt" min="0" step="0.01" value="${s.amt}"></td>
        `;
        serviceBody.appendChild(row);
        setupAutoExpand(row.querySelector("textarea"));
        row.querySelector(".s-amt").addEventListener("input", calculateTotals);
      });
      
      r.parts.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="number" class="qty" min="1" value="${p.qty}"></td>
          <td><textarea class="desc" rows="2">${escapeHtml(p.desc)}</textarea></td>
          <td><input type="number" class="amt" min="0" step="0.01" value="${p.amt}"></td>
        `;
        partsBody.appendChild(row);
        setupAutoExpand(row.querySelector("textarea"));
        row.querySelectorAll("input").forEach(i => i.addEventListener("input", calculateTotals));
      });
      
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

// --- INITIAL CALCULATION ---
calculateTotals();

// --- CLEAR ANY EXTRA TEXT OUTSIDE TABLES (FIX FOR SERVICE SECTION) ---
// This removes any stray text nodes that might have been added
document.querySelectorAll("#serviceBody").forEach(body => {
  body.childNodes.forEach(node => {
    if (node.nodeType === 3 && node.textContent.trim() !== "") {
      node.remove();
    }
  });
});
