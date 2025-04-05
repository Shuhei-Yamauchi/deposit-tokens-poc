// js/simulation.js

document.addEventListener("DOMContentLoaded", () => {
  // Initial Balances
  const INITIAL_BALANCE = 1000;

  // Off-chain CBS Ledger
  let cbsLedger = {
    A: INITIAL_BALANCE,
    B: INITIAL_BALANCE
  };

  // On-chain Token Ledger
  let tokenLedger = {
    A: INITIAL_BALANCE,
    B: INITIAL_BALANCE
  };

  // Current model ("backed" or "native"), locked after first transfer
  let currentModel = "backed";
  let modelLocked = false;

  // DOM elements
  const modelRadios = document.getElementsByName("model");
  const cbsBalAEl = document.getElementById("cbs-a");
  const cbsBalBEl = document.getElementById("cbs-b");
  const tokenBalAEl = document.getElementById("token-a");
  const tokenBalBEl = document.getElementById("token-b");

  const sourceSelect = document.getElementById("source");
  const destinationSelect = document.getElementById("destination");
  const amountInput = document.getElementById("amount");

  const transferBtn = document.getElementById("transfer-btn");
  const resetBtn = document.getElementById("reset-btn");

  const logList = document.getElementById("log-list");

  // Update displays
  function updateDisplay() {
    // In the Backed model, we show the real CBS and Token balances as separate values.
    // In the Native model (for demonstration), let's keep the CBS ledger static to illustrate
    // that once funds are on-chain, the off-chain ledger is NOT updated anymore.
    cbsBalAEl.textContent = cbsLedger.A.toFixed(2);
    cbsBalBEl.textContent = cbsLedger.B.toFixed(2);

    tokenBalAEl.textContent = tokenLedger.A.toFixed(2);
    tokenBalBEl.textContent = tokenLedger.B.toFixed(2);
  }

  // Append a log message
  function appendLog(msg) {
    const li = document.createElement("li");
    li.textContent = msg;
    logList.appendChild(li);
  }

  // Model selection
  modelRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (modelLocked) {
        // If locked, revert any change
        radio.checked = (radio.value === currentModel);
        appendLog("Model is already locked. Reset to change the model.");
      } else {
        currentModel = radio.value;
        appendLog(`Model changed to: ${currentModel}`);
        updateDisplay();
      }
    });
  });

  // Transfer button
  transferBtn.addEventListener("click", () => {
    const source = sourceSelect.value;      // "A" or "B"
    const destination = destinationSelect.value; // "A" or "B"
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
      alert("Invalid transfer amount.");
      return;
    }
    if (source === destination) {
      alert("Source and destination must be different.");
      return;
    }
    if (tokenLedger[source] < amount) {
      alert(`Insufficient token balance in branch ${source}.`);
      return;
    }

    // Lock the model after the first transfer
    if (!modelLocked) {
      modelLocked = true;
      modelRadios.forEach(r => r.disabled = true);
      appendLog("First transfer executed. Model locked.");
    }

    if (currentModel === "backed") {
      // Backed model: off-chain and on-chain must mirror
      // 1) Burn tokens at source
      tokenLedger[source] -= amount;
      // 2) Mint tokens at destination
      tokenLedger[destination] += amount;
      // 3) Also update the CBS ledger (off-chain)
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;

      appendLog(`[Backed] Transfer $${amount.toFixed(2)} from ${source} to ${destination}. Burn & Mint on-chain, and update CBS.`);
    } else {
      // Native model: only token ledger matters
      // No CBS update; cbsLedger remains the same
      tokenLedger[source] -= amount;
      tokenLedger[destination] += amount;

      appendLog(`[Native] Transfer $${amount.toFixed(2)} from ${source} to ${destination}. Off-chain ledger is not affected.`);
    }

    updateDisplay();
  });

  // Reset button
  resetBtn.addEventListener("click", () => {
    // Reset all balances
    cbsLedger.A = INITIAL_BALANCE;
    cbsLedger.B = INITIAL_BALANCE;
    tokenLedger.A = INITIAL_BALANCE;
    tokenLedger.B = INITIAL_BALANCE;

    // Unlock and revert to default model
    currentModel = "backed";
    modelLocked = false;
    modelRadios.forEach(radio => {
      radio.disabled = false;
      radio.checked = (radio.value === "backed");
    });

    // Restore default form values
    sourceSelect.value = "A";
    destinationSelect.value = "B";
    amountInput.value = "100";

    // Clear log
    logList.innerHTML = "";
    appendLog("Simulation has been reset. Model is now unlocked.");

    updateDisplay();
  });

  // Initialize
  updateDisplay();
  appendLog(`Current model: ${currentModel} (changeable until first transfer).`);
});
