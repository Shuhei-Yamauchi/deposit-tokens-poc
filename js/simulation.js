// js/simulation.js

document.addEventListener("DOMContentLoaded", function() {
  // 初期値
  const initialBalance = 1000;
  let cbsLedger = { A: initialBalance, B: initialBalance };
  let tokenLedger = { A: initialBalance, B: initialBalance };

  // DOM 要素の取得
  const cbsAEl = document.getElementById("cbs-a");
  const cbsBEl = document.getElementById("cbs-b");
  const tokenAEl = document.getElementById("token-a");
  const tokenBEl = document.getElementById("token-b");
  const amountInput = document.getElementById("amount");
  const transferBtn = document.getElementById("transfer-btn");
  const resetBtn = document.getElementById("reset-btn");
  const logList = document.getElementById("log-list");
  const modelRadios = document.getElementsByName("model");
  const sourceSelect = document.getElementById("source");
  const destinationSelect = document.getElementById("destination");

  // 現在のモード："backed" または "native"
  let currentMode = "backed";
  let modeLocked = false; // 初回送金後、モード選択はロック

  // 各台帳の表示更新
  function updateDisplays() {
    cbsAEl.textContent = cbsLedger.A.toFixed(2);
    cbsBEl.textContent = cbsLedger.B.toFixed(2);
    tokenAEl.textContent = tokenLedger.A.toFixed(2);
    tokenBEl.textContent = tokenLedger.B.toFixed(2);
  }

  // ログ出力
  function appendLog(message) {
    const li = document.createElement("li");
    li.textContent = message;
    logList.appendChild(li);
  }

  // シミュレーションリセット
  function resetSimulation() {
    cbsLedger = { A: initialBalance, B: initialBalance };
    tokenLedger = { A: initialBalance, B: initialBalance };
    updateDisplays();
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state.");
    modeLocked = false;
    // モード選択を有効化し、デフォルトは "backed" に戻す
    modelRadios.forEach(radio => {
      radio.disabled = false;
      if (radio.value === "backed") {
        radio.checked = true;
        currentMode = "backed";
      }
    });
    // 送金元・送金先も初期値に戻す
    sourceSelect.value = "A";
    destinationSelect.value = "B";
    appendLog("Current Mode: " + currentMode);
  }

  // モード切替処理（送金前のみ可能）
  modelRadios.forEach(radio => {
    radio.addEventListener("change", function() {
      if (modeLocked) {
        // 送金後はモード変更不可
        this.checked = (this.value === currentMode);
        appendLog("Mode change not allowed after first transfer. Please Reset first.");
        return;
      }
      currentMode = this.value;
      appendLog("Switched mode to: " + currentMode);
      if (currentMode === "native") {
        // NativeモードではToken Ledgerは常にCBS Ledgerと同一
        tokenLedger.A = cbsLedger.A;
        tokenLedger.B = cbsLedger.B;
        updateDisplays();
      }
    });
  });

  // 送金操作処理
  transferBtn.addEventListener("click", function() {
    let amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    let source = sourceSelect.value;
    let destination = destinationSelect.value;
    if (source === destination) {
      alert("Source and Destination must be different.");
      return;
    }
    if (cbsLedger[source] < amount) {
      alert(`Insufficient funds in ${source} branch.`);
      return;
    }

    if (currentMode === "backed") {
      // Backed モード：CBS Ledgerの更新
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      appendLog(`CBS Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
      
      // Token Ledger：Burn と Mint を分けて実行
      tokenLedger[source] -= amount;
      appendLog(`Token Ledger: Burn executed on ${source} for $${amount.toFixed(2)}`);
      tokenLedger[destination] += amount;
      appendLog(`Token Ledger: Mint executed for ${destination} for $${amount.toFixed(2)}`);
    } else if (currentMode === "native") {
      // Native モード：単一の台帳として同時更新
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      tokenLedger[source] = cbsLedger[source];
      tokenLedger[destination] = cbsLedger[destination];
      appendLog(`Native Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
    }
    updateDisplays();

    // 初回送金後、モード選択はロック（送金元・送金先は変更可能）
    if (!modeLocked) {
      modeLocked = true;
      modelRadios.forEach(r => r.disabled = true);
      appendLog("Mode selection locked after first transfer. You can still change the source and destination branches.");
    }
  });

  resetBtn.addEventListener("click", resetSimulation);

  updateDisplays();
  appendLog("Current Mode: " + currentMode);
});
