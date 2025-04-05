// js/simulation.js

document.addEventListener("DOMContentLoaded", () => {
  // Initial balances
  const INITIAL_CBS_BALANCE = 1000;
  const INITIAL_TOKEN_BALANCE = 0;

  // Off-chain (CBS) Ledger
  let cbs = {
    A: INITIAL_CBS_BALANCE,
    B: INITIAL_CBS_BALANCE
  };

  // On-chain (Token) Ledger
  let token = {
    A: INITIAL_TOKEN_BALANCE,
    B: INITIAL_TOKEN_BALANCE
  };

  // Current model: "backed" or "native"
  let currentModel = "backed";
  let modelLocked = false; // locked after the first operation

  // DOM elements
  const modelRadios = document.getElementsByName("model");
  const cbsAEl = document.getElementById("cbs-a");
  const cbsBEl = document.getElementById("cbs-b");
  const tokenAEl = document.getElementById("token-a");
  const tokenBEl = document.getElementById("token-b");

  // Fund
  const fundBranchEl = document.getElementById("fund-branch");
  const fundAmountEl = document.getElementById("fund-amount");
  const fundBtn = document.getElementById("fund-btn");

  // Transfer
  const transferSourceEl = document.getElementById("transfer-source");
  const transferDestEl = document.getElementById("transfer-dest");
  const transferAmountEl = document.getElementById("transfer-amount");
  const transferBtn = document.getElementById("transfer-btn");

  // Defund
  const defundBranchEl = document.getElementById("defund-branch");
  const defundAmountEl = document.getElementById("defund-amount");
  const defundBtn = document.getElementById("defund-btn");

  // Reset / Log
  const resetBtn = document.getElementById("reset-btn");
  const logList = document.getElementById("log-list");

  // Update display
  function updateDisplay() {
    cbsAEl.textContent = cbs.A.toFixed(2);
    cbsBEl.textContent = cbs.B.toFixed(2);
    tokenAEl.textContent = token.A.toFixed(2);
    tokenBEl.textContent = token.B.toFixed(2);
  }

  // Log function
  function appendLog(message) {
    const li = document.createElement("li");
    li.textContent = message;
    logList.appendChild(li);
  }

  // Lock the model after the first operation
  function lockModelIfNeeded() {
    if (!modelLocked) {
      modelLocked = true;
      // disable radio buttons
      modelRadios.forEach(r => (r.disabled = true));
      appendLog("First operation executed. Model is now locked.");
    }
  }

  // Model selection
  modelRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (modelLocked) {
        // revert any change
        radio.checked = (radio.value === currentModel);
        appendLog("Model is locked. Please reset to change.");
      } else {
        currentModel = radio.value;
        appendLog("Model changed to: " + currentModel);
      }
    });
  });

  // ----------------------
  // FUND (CBS -> Token)
  // ----------------------
  fundBtn.addEventListener("click", () => {
    const branch = fundBranchEl.value; // "A" or "B"
    const amount = parseFloat(fundAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Fund.");
      return;
    }
    if (cbs[branch] < amount) {
      alert(`Insufficient CBS balance in branch ${branch}.`);
      return;
    }

    // Lock model if first operation
    lockModelIfNeeded();

    // For both Backed and Native, move from CBS to Token
    cbs[branch] -= amount;
    token[branch] += amount;

    appendLog(`[Fund] Moved $${amount.toFixed(2)} from CBS(${branch}) to Token(${branch}). (Model: ${currentModel})`);
    updateDisplay();
  });

  // ----------------------
  // TRANSFER (On-chain)
  // ----------------------
  transferBtn.addEventListener("click", () => {
    const source = transferSourceEl.value;  // "A" or "B"
    const dest = transferDestEl.value;      // "A" or "B"
    const amount = parseFloat(transferAmountEl.value);

    if (source === dest) {
      alert("Source and destination must be different.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Transfer.");
      return;
    }
    if (token[source] < amount) {
      alert(`Insufficient token balance in branch ${source}.`);
      return;
    }

    // Lock model if needed
    lockModelIfNeeded();

    // 1) Token Ledger: source -> dest
    token[source] -= amount;
    token[dest] += amount;

    if (currentModel === "backed") {
      // In Backed model, also mirror in CBS
      cbs[source] -= amount;
      cbs[dest] += amount;
      appendLog(`[Transfer - Backed] $${amount.toFixed(2)} from ${source} to ${dest}. Token updated + CBS mirrored.`);
    } else {
      // Native model: no CBS update
      appendLog(`[Transfer - Native] $${amount.toFixed(2)} from ${source} to ${dest} on Token ledger only.`);
    }

    updateDisplay();
  });

  // ----------------------
  // DEFUND (Token -> CBS)
  // ----------------------
  defundBtn.addEventListener("click", () => {
    const branch = defundBranchEl.value; // "A" or "B"
    const amount = parseFloat(defundAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Defund.");
      return;
    }
    if (token[branch] < amount) {
      alert(`Insufficient token balance in branch ${branch}.`);
      return;
    }

    // Lock model if needed
    lockModelIfNeeded();

    // For both Backed and Native, move from Token to CBS
    token[branch] -= amount;
    cbs[branch] += amount;

    appendLog(`[Defund] Moved $${amount.toFixed(2)} from Token(${branch}) to CBS(${branch}). (Model: ${currentModel})`);
    updateDisplay();
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    // Reset balances
    cbs.A = INITIAL_CBS_BALANCE;
    cbs.B = INITIAL_CBS_BALANCE;
    token.A = INITIAL_TOKEN_BALANCE;
    token.B = INITIAL_TOKEN_BALANCE;

    // Unlock and revert to 'backed' by default
    currentModel = "backed";
    modelLocked = false;
    modelRadios.forEach(radio => {
      radio.disabled = false;
      radio.checked = (radio.value === "backed");
    });

    // Reset input fields
    fundBranchEl.value = "A";
    fundAmountEl.value = 100;
    transferSourceEl.value = "A";
    transferDestEl.value = "B";
    transferAmountEl.value = 50;
    defundBranchEl.value = "A";
    defundAmountEl.value = 50;

    // Clear log
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state. Model is now unlocked.");
    updateDisplay();
  });

  // Initialize
  updateDisplay();
  appendLog(`Current model: ${currentModel} (changeable until first operation).`);
});
