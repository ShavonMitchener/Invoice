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
  let serviceTotal = 0;
  document.querySelectorAll(".s-amt").forEach(function(input) {
    serviceTotal += parseFloat(input.value) || 0;
  });

  let partsTotal = 0;
  document.querySelectorAll("#partsBody tr").forEach(function(row) {
    var qty = parseFloat(row.querySelector(".qty").value) || 0;
    var amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += qty * amt;
  });

  var grandTotal = serviceTotal + partsTotal;
  var deposit = parseFloat(document.getElementById("depositAmount").value) || 0;
  var balanceAfterDeposit = grandTotal - deposit;

  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
  document.getElementById("balanceAfterDeposit").textContent = balanceAfterDeposit.toFixed(2);
  
  var balanceSpan = document.getElementById("balanceAfterDeposit");
  if (balanceAfterDeposit < 0) {
    balanceSpan.style.color = "#cc0000";
    balanceSpan.style.fontWeight = "bold";
  } else {
    balanceSpan.style.color = "#000";
    balanceSpan.style.fontWeight = "normal";
  }
}

// --- DELETE ROW FUNCTION ---
function deleteRow(button) {
  var row = button.parentElement.parentElement;
  row.remove();
  calculateTotals();
}

// --- ADD SERVICE ROW ---
function addServiceRow(desc, amt) {
  var tbody = document.getElementById("serviceBody");
  var newRow = document.createElement("tr");
  
  var descValue = desc || "";
  var amtValue = amt || "0.00";
  
  newRow.innerHTML = '<td><textarea class="s-desc" placeholder="Service description" rows="2">' + escapeHtml(descValue) + '</textarea></td>' +
                     '<td><input type="number" class="s-amt" min="0" step="0.01" value="' + amtValue + '"></td>' +
                     '<td><button class="delete-btn" title="Remove">✖</button></td>';
  
  tbody.appendChild(newRow);
  
  var newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelector(".s-amt").addEventListener("input", calculateTotals);
  newRow.querySelector(".delete-btn").addEventListener("click", function() {
    deleteRow(this);
  });
  
  calculateTotals();
}

// --- ADD PART ROW ---
function addPartRow(qty, desc, amt) {
  var tbody = document.getElementById("partsBody");
  var newRow = document.createElement("tr");
  
  var qtyValue = qty || "1";
  var descValue = desc || "";
  var amtValue = amt || "0.00";
  
  newRow.innerHTML = '<td><input type="number" class="qty" min="1" value="' + qtyValue + '"></td>' +
                     '<td><textarea class="desc" placeholder="Part name" rows="2">' + escapeHtml(descValue) + '</textarea></td>' +
                     '<td><input type="number" class="amt" min="0" step="0.01" value="' + amtValue + '"></td>' +
                     '<td><button class="delete-btn" title="Remove">✖</button></td>';
  
  tbody.appendChild(newRow);
  
  var newTextarea = newRow.querySelector("textarea");
  setupAutoExpand(newTextarea);
  
  newRow.querySelectorAll("input").forEach(function(input) {
    input.addEventListener("input", calculateTotals);
  });
  newRow.querySelector(".delete-btn").addEventListener("click", function() {
    deleteRow(this);
  });
  
  calculateTotals();
}

function escapeHtml(text) {
  if (!text) return "";
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- ADD BUTTONS ---
document.getElementById("addService").addEventListener("click", function() {
  addServiceRow();
});

document.getElementById("addPart").addEventListener("click", function() {
  addPartRow();
});

// --- DEPOSIT INPUT LISTENER ---
document.getElementById("depositAmount").addEventListener("input", calculateTotals);

// --- SAVE RECEIPT ---
document.getElementById("saveBtn").addEventListener("click", function() {
  calculateTotals();
  
  var receipt = {
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

  document.querySelectorAll("#serviceBody tr").forEach(function(row) {
    receipt.services.push({
      desc: row.querySelector(".s-desc").value,
      amt: row.querySelector(".s-amt").value
    });
  });

  document.querySelectorAll("#partsBody tr").forEach(function(row) {
    receipt.parts.push({
      qty: row.querySelector(".qty").value,
      desc: row.querySelector(".desc").value,
      amt: row.querySelector(".amt").value
    });
  });

  var receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));
  
  alert("Receipt saved successfully!");
});

// --- SEARCH RECEIPTS ---
document.getElementById("searchBtn").addEventListener("click", function() {
  var query = document.getElementById("searchInput").value.trim().toLowerCase();
  var resultsArea = document.getElementById("searchResults");
  resultsArea.innerHTML = "";
  
  var receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  var matches = receipts.filter(function(r) {
    return r.invoiceNo.toLowerCase().includes(query) || r.customer.toLowerCase().includes(query);
  });

  if (matches.length === 0) {
    resultsArea.innerHTML = "<p>No receipts found.</p>";
    return;
  }

  matches.forEach(function(r) {
    var div = document.createElement("div");
    div.className = "found-receipt";
    div.innerHTML = '<strong>Invoice #' + r.invoiceNo + '</strong> | ' + r.date + '<br>' +
                    'Customer: ' + r.customer + ' | Vehicle: ' + r.vehicle + '<br>' +
                    'From: ' + (r.fromStaff || "") + ' | Signed: ' + (r.signedBy || "N/A") + '<br>' +
                    'Deposit: $' + (r.deposit || "0.00") + ' | Balance: $' + (r.balanceAfterDeposit || r.grandTotal) + '<br>' +
                    '<strong>Grand Total: $' + r.grandTotal + '</strong><br>' +
                    '<button class="viewBtn">View Full Details</button>' +
                    '<button class="deleteBtn">Delete</button><hr>';
    
    div.querySelector(".viewBtn").addEventListener("click", function() {
      document.getElementById("custName").value = r.customer || "";
      document.getElementById("vehicle").value = r.vehicle || "";
      document.getElementById("fromName").value = r.fromStaff || "";
      document.getElementById("signedBy").value = r.signedBy || "";
      document.getElementById("depositAmount").value = r.deposit || "0.00";
      
      var serviceBody = document.getElementById("serviceBody");
      var partsBody = document.getElementById("partsBody");
      serviceBody.innerHTML = "";
      partsBody.innerHTML = "";
      
      if (r.services && r.services.length > 0) {
        r.services.forEach(function(s) {
          addServiceRow(s.desc, s.amt);
        });
      } else {
        addServiceRow();
      }
      
      if (r.parts && r.parts.length > 0) {
        r.parts.forEach(function(p) {
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
        var allReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
        allReceipts = allReceipts.filter(function(x) {
          return x.invoiceNo !== r.invoiceNo;
        });
        localStorage.setItem("receipts", JSON.stringify(allReceipts));
        div.remove();
        alert("Invoice deleted.");
      }
    });

    resultsArea.appendChild(div);
  });
});

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
addServiceRow();
addPartRow();
calculateTotals();
