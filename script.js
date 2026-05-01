// --- BASIC SETUP ---
document.getElementById("date").textContent = new Date().toLocaleDateString();
let invoiceNo = localStorage.getItem("invoiceNo") || 1;
document.getElementById("invoiceNo").textContent = invoiceNo.toString().padStart(3,"0");

// --- AUTO-EXPAND TEXTAREA FUNCTION ---
function autoExpand(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
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

// --- ADD SERVICE ROW (with textarea) ---
document.getElementById("addService").addEventListener("click",()=>{
  const r=document.createElement("tr");
  r.innerHTML=`<td><textarea class="s-desc" placeholder="Service description" rows="2"></textarea></td>
               <td><input type="number" class="s-amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("serviceBody").appendChild(r);
  
  // Setup auto-expand for the new textarea
  const newTextarea = r.querySelector('.s-desc');
  newTextarea.addEventListener('input', function() {
    autoExpand(this);
  });
  autoExpand(newTextarea);
  
  // Setup calculation for amount input
  r.querySelector(".s-amt").addEventListener("input", calculateTotals);
  calculateTotals();
});

// --- ADD PART ROW (with textarea for description) ---
document.getElementById("addPart").addEventListener("click",()=>{
  const r=document.createElement("tr");
  r.innerHTML=`<td><input type="number" class="qty" min="1" value="1"></td>
               <td><textarea class="desc" placeholder="Part name" rows="2"></textarea></td>
               <td><input type="number" class="amt" min="0" step="0.01" value="0.00"></td>`;
  document.getElementById("partsBody").appendChild(r);
  
  // Setup auto-expand for the new textarea
  const newTextarea = r.querySelector('.desc');
  newTextarea.addEventListener('input', function() {
    autoExpand(this);
  });
  autoExpand(newTextarea);
  
  // Setup calculations for inputs
  r.querySelectorAll("input").forEach(i=>i.addEventListener("input", calculateTotals));
  calculateTotals();
});

// --- SAVE RECEIPT (updated to handle textareas) ---
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

  // Save service rows (now using textareas)
  document.querySelectorAll("#serviceBody tr").forEach(row=>{
    const desc = row.querySelector(".s-desc").value;
    const amt = row.querySelector(".s-amt").value;
    receipt.service.push({desc, amt});
  });

  // Save parts rows (now using textareas for description)
  document.querySelectorAll("#partsBody tr").forEach(row=>{
    const qty = row.querySelector(".qty").value;
    const desc = row.querySelector(".desc").value;
    const amt = row.querySelector(".amt").value;
    receipt.parts.push({qty, desc, amt});
  });

  let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));

  alert("✅ Receipt saved successfully!");
});

// --- SEARCH RECEIPTS (updated to show full descriptions) ---
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
    
    // Create service list summary
    let serviceList = "";
    if (r.service && r.service.length > 0) {
      serviceList = "<br><strong>Services:</strong><br>";
      r.service.forEach(s => {
        serviceList += `• ${s.desc.substring(0, 50)}${s.desc.length > 50 ? '...' : ''} - $${s.amt}<br>`;
      });
    }
    
    // Create parts list summary
    let partsList = "";
    if (r.parts && r.parts.length > 0) {
      partsList = "<br><strong>Parts:</strong><br>";
      r.parts.forEach(p => {
        partsList += `• ${p.qty}x ${p.desc.substring(0, 50)}${p.desc.length > 50 ? '...' : ''} - $${p.amt}<br>`;
      });
    }
    
    div.innerHTML=`
      <strong>Invoice #${r.invoiceNo}</strong> | ${r.date}<br>
      Customer: ${r.customer} | Vehicle: ${r.vehicle}<br>
      From: ${r.from} | Signed: ${r.signedBy || 'N/A'}<br>
      ${serviceList}
      ${partsList}
      <strong>Service Total: $${r.totals.service}</strong> | <strong>Parts Total: $${r.totals.parts}</strong><br>
      <strong>Grand Total: $${r.totals.grand}</strong><br>
      <button class="viewBtn">📄 View Full Details</button>
      <button class="deleteBtn">🗑️ Delete</button>
      <hr>`;

    // VIEW button - show full details
    div.querySelector(".viewBtn").addEventListener("click",()=>{
      let fullDetails = `INVOICE #${r.invoiceNo}\n`;
      fullDetails += `Date: ${r.date}\n`;
      fullDetails += `Customer: ${r.customer}\n`;
      fullDetails += `Vehicle: ${r.vehicle}\n`;
      fullDetails += `From: ${r.from}\n`;
      fullDetails += `Signed by: ${r.signedBy || 'N/A'}\n\n`;
      
      fullDetails += `=== SERVICES ===\n`;
      if (r.service && r.service.length > 0) {
        r.service.forEach((s, i) => {
          fullDetails += `${i+1}. ${s.desc}\n   Amount: $${s.amt}\n`;
        });
      } else {
        fullDetails += `None\n`;
      }
      
      fullDetails += `\n=== PARTS ===\n`;
      if (r.parts && r.parts.length > 0) {
        r.parts.forEach((p, i) => {
          fullDetails += `${i+1}. ${p.qty}x ${p.desc}\n   Amount: $${p.amt}\n`;
        });
      } else {
        fullDetails += `None\n`;
      }
      
      fullDetails += `\n=== TOTALS ===\n`;
      fullDetails += `Service Total: $${r.totals.service}\n`;
      fullDetails += `Parts Total: $${r.totals.parts}\n`;
      fullDetails += `Grand Total: $${r.totals.grand}\n`;
      
      alert(fullDetails);
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

// --- SETUP AUTO-EXPAND FOR EXISTING TEXTAREAS ON PAGE LOAD ---
setupAutoExpandOnTextareas();

// --- OBSERVER FOR DYNAMICALLY ADDED TEXTAREAS (for any other dynamic content) ---
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1 && node.querySelectorAll) {
        node.querySelectorAll('textarea').forEach(textarea => {
          if (!textarea.hasExpandListener) {
            textarea.addEventListener('input', function() {
              autoExpand(this);
            });
            textarea.hasExpandListener = true;
            autoExpand(textarea);
          }
        });
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// --- INITIAL CALCULATION ---
calculateTotals();
