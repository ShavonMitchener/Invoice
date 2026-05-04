document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3, "0");

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
    let qty = parseFloat(row.querySelector(".qty").value) || 0;
    let amt = parseFloat(row.querySelector(".amt").value) || 0;
    partsTotal += qty * amt;
  });
  
  let subtotal = serviceTotal + partsTotal;
  let deposit = parseFloat(document.getElementById("depositAmount").value) || 0;
  let grandTotal = subtotal - deposit;
  
  document.getElementById("serviceTotal").textContent = serviceTotal.toFixed(2);
  document.getElementById("partsTotal").textContent = partsTotal.toFixed(2);
  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

function deleteRow(btn) {
  btn.parentElement.parentElement.remove();
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

function addPartRow(qty, desc, amt) {
  let body = document.getElementById("partsBody");
  let row = document.createElement("tr");
  let q = qty || "1";
  let d = desc || "";
  let a = amt || "0.00";
  
  row.innerHTML = '<td><input type="number" class="qty" min="1" value="' + q + '"></td>' +
                  '<td><textarea class="desc" placeholder="Part name" rows="2">' + d + '</textarea></td>' +
                  '<td><input type="number" class="amt" min="0" step="0.01" value="' + a + '"></td>' +
                  '<td><button class="delete-btn">✖</button></td>';
  
  body.appendChild(row);
  
  let ta = row.querySelector("textarea");
  ta.addEventListener("input", function() { autoExpand(this); });
  autoExpand(ta);
  
  row.querySelectorAll("input").forEach(function(i) { i.addEventListener("input", calculateTotals); });
  row.querySelector(".delete-btn").addEventListener("click", function() { deleteRow(this); });
  calculateTotals();
}

document.getElementById("addService").addEventListener("click", function() { addServiceRow(); });
document.getElementById("addPart").addEventListener("click", function() { addPartRow(); });
document.getElementById("depositAmount").addEventListener("input", calculateTotals);

document.getElementById("saveBtn").addEventListener("click", function() {
  calculateTotals();
  
  let receipt = {
    invoiceNo: invoiceNo.toString().padStart(3, "0"),
    date: document.getElementById("date").textContent,
    customer: document.getElementById("custName").value.trim(),
    vehicle: document.getElementById("vehicle").value.trim(),
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
      amt: row.querySelector(".amt").value
    });
  });
  
  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));
  alert("Receipt saved!");
});

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
                    'From: ' + (r.fromStaff || "") + ' | Signed: ' + (r.signedBy || "N/A") + '<br>' +
                    'Deposit: $' + (r.deposit || "0.00") + ' | Grand Total: $' + r.grandTotal + '<br>' +
                    '<button class="viewBtn">Load Invoice</button> ' +
                    '<button class="deleteBtn">Delete</button><hr>';
    
    div.querySelector(".viewBtn").addEventListener("click", function() {
      document.getElementById("custName").value = r.customer || "";
      document.getElementById("vehicle").value = r.vehicle || "";
      document.getElementById("fromName").value = r.fromStaff || "";
      document.getElementById("signedBy").value = r.signedBy || "";
      document.getElementById("depositAmount").value = r.deposit || "0.00";
      
      document.getElementById("serviceBody").innerHTML = "";
      document.getElementById("partsBody").innerHTML = "";
      
      if (r.services && r.services.length > 0) {
        r.services.forEach(function(s) { addServiceRow(s.desc, s.amt); });
      } else { addServiceRow(); }
      
      if (r.parts && r.parts.length > 0) {
        r.parts.forEach(function(p) { addPartRow(p.qty, p.desc, p.amt); });
      } else { addPartRow(); }
      
      calculateTotals();
      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("Loaded invoice #" + r.invoiceNo);
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

document.getElementById("printBtn").addEventListener("click", function() { window.print(); });
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

addServiceRow();
addPartRow();
calculateTotals();
