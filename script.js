// --- BASIC SETUP ---
document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3,"0");

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

// --- ADD ROWS ---
document.getElementById("addService").addEventListener("click",()=>{
  const r=document.createElement("tr");
  r.innerHTML=`<td><input type="text" class="s-desc" placeholder="Service description"></td>
               <td><input type="number" class="s-amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("serviceBody").appendChild(r);
  r.querySelectorAll("input").forEach(i=>i.addEventListener("input",calculateTotals));
});

document.getElementById("addPart").addEventListener("click",()=>{
  const r=document.createElement("tr");
  r.innerHTML=`<td><input type="number" class="qty" min="1" value="1"></td>
               <td><input type="text" class="desc" placeholder="Part name"></td>
               <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("partsBody").appendChild(r);
  r.querySelectorAll("input").forEach(i=>i.addEventListener("input",calculateTotals));
});

// --- SAVE RECEIPT ---
document.getElementById("saveBtn").addEventListener("click",()=>{
  calculateTotals();
  const receipt = {
    invoiceNo: invoiceNo.toString().padStart(3,"0"),
    date: document.getElementById("date").textContent,
    customer: document.getElementById("custName").value.trim(),
    vehicle: document.getElementById("vehicle").value.trim(),
    from: document.getElementById("fromName").value.trim(),
    signedBy: document.getElementById("signedBy").value.trim(),
    service: [],
    parts: [],
    totals: {
      service: document.getElementById("serviceTotal").textContent,
      parts: document.getElementById("partsTotal").textContent,
      grand: document.getElementById("grandTotal").textContent
    }
  };

  document.querySelectorAll("#serviceBody tr").forEach(row=>{
    const desc=row.querySelector(".s-desc").value;
    const amt=row.querySelector(".s-amt").value;
    receipt.service.push({desc,amt});
  });

  document.querySelectorAll("#partsBody tr").forEach(row=>{
    const qty=row.querySelector(".qty").value;
    const desc=row.querySelector(".desc").value;
    const amt=row.querySelector(".amt").value;
    receipt.parts.push({qty,desc,amt});
  });

  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));

  alert("✅ Receipt saved successfully!");
});

// --- SEARCH RECEIPTS ---
document.getElementById("searchBtn").addEventListener("click",()=>{
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

  matches.forEach((r, index)=>{
    const div=document.createElement("div");
    div.className="found-receipt";
    div.innerHTML=`
      <strong>Invoice #${r.invoiceNo}</strong> | ${r.date}<br>
      Customer: ${r.customer} | Vehicle: ${r.vehicle}<br>
      From: ${r.from}<br>
      Service Total: ${r.totals.service} | Parts Total: ${r.totals.parts} | Grand Total: ${r.totals.grand}<br>
      <button class="viewBtn">View</button>
      <button class="deleteBtn">🗑️ Delete</button>
      <hr>`;

    // VIEW button
    div.querySelector(".viewBtn").addEventListener("click",()=>{
      alert(
        `Invoice #${r.invoiceNo}\nCustomer: ${r.customer}\nVehicle: ${r.vehicle}\nService Total: ${r.totals.service}\nParts Total: ${r.totals.parts}\nGrand Total: ${r.totals.grand}`
      );
    });

    // DELETE button
    div.querySelector(".deleteBtn").addEventListener("click",()=>{
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
document.getElementById("printBtn").addEventListener("click",()=>window.print());
document.getElementById("newBtn").addEventListener("click",()=>{
  invoiceNo++;
  localStorage.setItem("invoiceNo",invoiceNo);
  window.location.reload();
});

// --- RESET INVOICE NUMBER ---
document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset invoice number back to 001?")){
    localStorage.removeItem("invoiceNo");
    window.location.reload();
  }
});
