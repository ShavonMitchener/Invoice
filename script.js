document.getElementById("date").textContent = new Date().toLocaleDateString();

let currentInvoiceNo = localStorage.getItem("currentInvoiceNo") || "001";
document.getElementById("invoiceNo").value = currentInvoiceNo;

function autoExpand(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + "px";
}

function calculateTotals() {
  let serviceTotal = 0;
  let partsTotal = 0;
  
  document.querySelectorAll(".s-amt").forEach(function(input) {
    serviceTotal += parseFloat(input.value) || 0;
  });
  
  document.querySelectorAll("#partsBody tr").forEach(function(row) {
    let amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += amt;
  });
  
  let subtotal = serviceTotal + partsTotal;
  let deposit = parseFloat(document.getElementById("depositAmount").value) || 0;
  let grandTotal = subtotal - deposit;
  
  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
  
  let depositSection = document.getElementById("depositSection");
  if (deposit === 0) {
    depositSection.classList.add("hide-on-print");
  } else {
    depositSection.classList.remove("hide-on-print");
  }
}

function deleteRow(btn) {
  btn.parentElement.parentElement.remove();
  calculateTotals();
}

function calculatePartAmount(row) {
  let qty = parseFloat(row.querySelector(".qty").value) || 0;
  let unitPrice = parseFloat(row.querySelector(".unit-price").value) || 0;
  let amtInput = row.querySelector(".amt");
  let calculatedAmount = qty * unitPrice;
  amtInput.value = calculatedAmount.toFixed(2);
  calculateTotals();
}

function addServiceRow(desc, amt) {
  let body = document.getElementById("serviceBody");
  let row = document.createElement("tr");
  let d = desc || "";
  let a = amt || "0.00";
  
  row.innerHTML = '<td><textarea class="s-desc" placeholder="Service description" rows="2">' + d + '</textarea></td>' +
                  '<td><input type="number" class="s-amt" min="0" step="0.01" value="' + a + '"></td>' +
                  '<td><button class="delete-btn">✖</button></td>';
  
  body.appendChild(row);
  
  let ta = row.querySelector("textarea");
  ta.addEventListener("input", function() { autoExpand(this); });
  autoExpand(ta);
  
  row.querySelector(".s-amt").addEventListener("input", calculateTotals);
  row.querySelector(".delete-btn").addEventListener("click", function() { deleteRow(this); });
  calculateTotals();
}

function addPartRow(qty, desc, unitPrice, amt) {
  let body = document.getElementById("partsBody");
  let row = document.createElement("tr");
  let q = qty || "1";
  let d = desc || "";
  let up = unitPrice || "0.00";
  let a = amt || "0.00";
  
  row.innerHTML = '<td><input type="number" class="qty" min="0" step="any" value="' + q + '"></td>' +
                  '<td><textarea class="desc" placeholder="Part name" rows="2" style="width:100%; box-sizing:border-box;">' + d + '</textarea></td>' +
                  '<td><input type="number" class="unit-price" min="0" step="any" value="' + up + '"></td>' +
                  '<td><input type="number" class="amt" min="0" step="any" value="' + a + '" style="width:100%; box-sizing:border-box;"></td>' +
                  '<td><button class="delete-btn" style="margin:0 auto; display:block;">✖</button></td>';
  
  body.appendChild(row);
  
  let ta = row.querySelector("textarea");
  ta.addEventListener("input", function() { autoExpand(this); });
  autoExpand(ta);
  
  let qtyInput = row.querySelector(".qty");
  let unitPriceInput = row.querySelector(".unit-price");
  let amtInput = row.querySelector(".amt");
  
  qtyInput.addEventListener("input", function() { calculatePartAmount(row); });
  unitPriceInput.addEventListener("input", function() { calculatePartAmount(row); });
  amtInput.addEventListener("input", calculateTotals);
  
  row.querySelector(".delete-btn").addEventListener("click", function() { deleteRow(this); });
  calculateTotals();
}

document.getElementById("addService").addEventListener("click", function() { addServiceRow(); });
document.getElementById("addPart").addEventListener("click", function() { addPartRow(); });
document.getElementById("depositAmount").addEventListener("input", calculateTotals);

document.getElementById("saveBtn").addEventListener("click", function() {
  calculateTotals();
  
  let receipt = {
    invoiceNo: document.getElementById("invoiceNo").value,
    date: document.getElementById("date").textContent,
    customer: document.getElementById("custName").value.trim(),
    vehicle: document.getElementById("vehicle").value.trim(),
    mileage: document.getElementById("mileage").value.trim(),
    fromStaff: document.getElementById("fromName").value.trim(),
    signedBy: document.getElementById("signedBy").value.trim(),
    deposit: document.getElementById("depositAmount").value,
    serviceTotal: document.getElementById("serviceTotal").textContent,
    partsTotal: document.getElementById("partsTotal").textContent,
    subtotal: document.getElementById("subtotal").textContent,
    grandTotal: document.getElementById("grandTotal").textContent,
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
      unitPrice: row.querySelector(".unit-price").value,
      amt: row.querySelector(".amt").value
    });
  });
  
  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  
  let existingIndex = receipts.findIndex(function(r) { return r.invoiceNo === receipt.invoiceNo; });
  if (existingIndex !== -1) {
    if (confirm("Invoice #" + receipt.invoiceNo + " already exists. Overwrite?")) {
      receipts[existingIndex] = receipt;
      localStorage.setItem("receipts", JSON.stringify(receipts));
      alert("Receipt updated!");
    }
  } else {
    receipts.push(receipt);
    localStorage.setItem("receipts", JSON.stringify(receipts));
    alert("Receipt saved!");
  }
  
  localStorage.setItem("currentInvoiceNo", receipt.invoiceNo);
});

function loadReceiptIntoForm(r) {
  document.getElementById("invoiceNo").value = r.invoiceNo;
  document.getElementById("custName").value = r.customer || "";
  document.getElementById("vehicle").value = r.vehicle || "";
  document.getElementById("mileage").value = r.mileage || "";
  document.getElementById("fromName").value = r.fromStaff || "";
  document.getElementById("signedBy").value = r.signedBy || "";
  document.getElementById("depositAmount").value = r.deposit || "0.00";
  
  document.getElementById("serviceBody").innerHTML = "";
  document.getElementById("partsBody").innerHTML = "";
  
  if (r.services && r.services.length > 0) {
    r.services.forEach(function(s) { addServiceRow(s.desc, s.amt); });
  } else { addServiceRow(); }
  
  if (r.parts && r.parts.length > 0) {
    r.parts.forEach(function(p) { addPartRow(p.qty, p.desc, p.unitPrice, p.amt); });
  } else { addPartRow(); }
  
  calculateTotals();
  window.scrollTo({ top: 0, behavior: "smooth" });
  alert("Loaded invoice #" + r.invoiceNo);
}

document.getElementById("searchBtn").addEventListener("click", function() {
  let query = document.getElementById("searchInput").value.trim().toLowerCase();
  let results = document.getElementById("searchResults");
  results.innerHTML = "";
  
  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  let matches = receipts.filter(function(r) {
    return r.invoiceNo.toLowerCase().includes(query) || r.customer.toLowerCase().includes(query);
  });
  
  if (matches.length === 0) {
    results.innerHTML = "<p>No receipts found.</p>";
    return;
  }
  
  matches.forEach(function(r) {
    let div = document.createElement("div");
    div.className = "found-receipt";
    div.innerHTML = '<strong>Invoice #' + r.invoiceNo + '</strong> | ' + r.date + '<br>' +
                    'Customer: ' + r.customer + ' | Vehicle: ' + r.vehicle + '<br>' +
                    'Mileage: ' + (r.mileage || "N/A") + ' | From: ' + (r.fromStaff || "") + ' | Signed: ' + (r.signedBy || "N/A") + '<br>' +
                    'Deposit: $' + (r.deposit || "0.00") + ' | Grand Total: $' + r.grandTotal + '<br>' +
                    '<button class="viewBtn">Load Invoice</button> ' +
                    '<button class="deleteBtn">Delete</button><hr>';
    
    div.querySelector(".viewBtn").addEventListener("click", function() {
      loadReceiptIntoForm(r);
    });
    
    div.querySelector(".deleteBtn").addEventListener("click", function() {
      if (confirm("Delete invoice #" + r.invoiceNo + "?")) {
        let all = JSON.parse(localStorage.getItem("receipts") || "[]");
        let filtered = all.filter(function(x) { return x.invoiceNo !== r.invoiceNo; });
        localStorage.setItem("receipts", JSON.stringify(filtered));
        div.remove();
        alert("Invoice deleted.");
      }
    });
    
    results.appendChild(div);
  });
});

document.getElementById("exportBtn").addEventListener("click", function() {
  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  let data = { receipts: receipts };
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "receipts_backup_" + new Date().toISOString().split("T")[0] + ".json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Exported " + receipts.length + " receipts!");
});

document.getElementById("importBtn").addEventListener("click", function() {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", function(event) {
  let file = event.target.files[0];
  if (!file) return;
  
  let reader = new FileReader();
  reader.onload = function(e) {
    try {
      let data = JSON.parse(e.target.result);
      let existingReceipts = JSON.parse(localStorage.getItem("receipts") || "[]");
      let mergedReceipts = [...existingReceipts];
      
      if (data.receipts && data.receipts.length > 0) {
        data.receipts.forEach(function(newReceipt) {
          let exists = mergedReceipts.some(function(r) { return r.invoiceNo === newReceipt.invoiceNo; });
          if (!exists) {
            mergedReceipts.push(newReceipt);
          }
        });
      }
      
      localStorage.setItem("receipts", JSON.stringify(mergedReceipts));
      alert("Imported " + data.receipts.length + " receipts!");
      location.reload();
    } catch(err) {
      alert("Invalid file!");
    }
  };
  reader.readAsText(file);
});

document.getElementById("printBtn").addEventListener("click", function() { 
  calculateTotals();
  window.print(); 
});

document.getElementById("newBtn").addEventListener("click", function() {
  let newNumber = (parseInt(currentInvoiceNo) + 1).toString().padStart(3, "0");
  document.getElementById("invoiceNo").value = newNumber;
  currentInvoiceNo = newNumber;
  localStorage.setItem("currentInvoiceNo", currentInvoiceNo);
  
  document.getElementById("custName").value = "";
  document.getElementById("vehicle").value = "";
  document.getElementById("mileage").value = "";
  document.getElementById("fromName").value = "";
  document.getElementById("signedBy").value = "";
  document.getElementById("depositAmount").value = "0.00";
  document.getElementById("serviceBody").innerHTML = "";
  document.getElementById("partsBody").innerHTML = "";
  
  addServiceRow();
  addPartRow();
  calculateTotals();
});

document.getElementById("resetBtn").addEventListener("click", function() {
  if (confirm("Reset invoice number back to 001?")) {
    document.getElementById("invoiceNo").value = "001";
    currentInvoiceNo = "001";
    localStorage.setItem("currentInvoiceNo", "001");
  }
});

addServiceRow();
addPartRow();
calculateTotals();
