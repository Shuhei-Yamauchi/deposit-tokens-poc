// js/simulation.js

document.addEventListener("DOMContentLoaded", function() {
  // 初期値設定
  const initialBalance = 1000;
  // 初期状態：CBS台帳は各1000、Token台帳は初期状態では0（FUND操作前）
  let cbsLedger = { A: initialBalance, B: initialBalance };
  let tokenLedger = { A: 0, B: 0 };

  // DOM 要素の取得
  const cbsAEl = document.getElementById("cbs-a");
  const cbsBEl = document.getElementById("cbs-b");
  const tokenAEl = document.getElementById("token-a");
  const tokenBEl = document.getElementById("token-b");

  const fundBranchEl = document.getElementById("fund-branch");
  const fundAmountEl = document.getElementById("fund-amount");
  const fundBtn = document.getElementById("fund-btn");

  const transferSourceEl = document.getElementById("transfer-source");
  const transferDestEl = document.getElementById("transfer-dest");
  const transferAmountEl = document.getElementById("transfer-amount");
  const transferBtn = document.getElementById("transfer-btn");

  const defundBranchEl = document.getElementById("defund-branch");
  const defundAmountEl = document.getElementById("defund-amount");
  const defundBtn = document.getElementById("defund-btn");

  const resetBtn = document.getElementById("reset-btn");
  const logList = document.getElementById("log-list");

  const modelRadios = document.getElementsByName("model");

  // 現在のモデル："backed" or "native"
  let currentModel = "backed";
  let modeLocked = false; // 初回操作後にモデル選択をロック

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

  // 各台帳の総計をログ出力（各台帳は別表現なので合算はしない）
  function logTotals() {
    const totalCBS = cbsLedger.A + cbsLedger.B;
    const totalToken = tokenLedger.A + tokenLedger.B;
    appendLog(`Total in CBS Ledger: $${totalCBS.toFixed(2)} | Total in Token Ledger: $${totalToken.toFixed(2)}`);
  }

  // モデル変更をロックする（初回操作後）
  function lockModelIfNeeded() {
    if (!modeLocked) {
      modeLocked = true;
      Array.from(modelRadios).forEach(r => r.disabled = true);
      appendLog("First operation executed. Model is now locked.");
    }
  }

  // FUND 操作 (CBS → Token)
  fundBtn.addEventListener("click", () => {
    const branch = fundBranchEl.value; // "A" or "B"
    const amount = parseFloat(fundAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Fund.");
      return;
    }
    if (cbsLedger[branch] < amount) {
      alert(`Insufficient CBS balance in branch ${branch}.`);
      return;
    }
    lockModelIfNeeded();

    // FUND：CBS台帳から減少し、Token台帳へ加算
    cbsLedger[branch] -= amount;
    tokenLedger[branch] += amount;
    appendLog(`[Fund] Moved $${amount.toFixed(2)} from CBS(${branch}) to Token(${branch}). (Model: ${currentModel})`);
    updateDisplays();
    logTotals();
  });

  // TRANSFER 操作 (Token上で送金)
  transferBtn.addEventListener("click", () => {
    const amount = parseFloat(transferAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Transfer.");
      return;
    }
    const source = transferSourceEl.value;
    const destination = transferDestEl.value;
    if (source === destination) {
      alert("Source and Destination must be different.");
      return;
    }
    if (tokenLedger[source] < amount) {
      alert(`Insufficient token balance in branch ${source}.`);
      return;
    }
    lockModelIfNeeded();

    if (currentModel === "backed") {
      // Backed モード
      // CBS台帳更新：送金元から減少、送金先に加算
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      appendLog(`CBS Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);

      // Token台帳更新：Burn & Mint
      tokenLedger[source] -= amount;
      appendLog(`Token Ledger: Burn executed on ${source} for $${amount.toFixed(2)}`);
      tokenLedger[destination] += amount;
      appendLog(`Token Ledger: Mint executed for ${destination} for $${amount.toFixed(2)}`);
    } else if (currentModel === "native") {
      // Native モード：Token台帳のみ更新。CBS台帳はそのまま（初期状態の場合は変化なし）
      tokenLedger[source] -= amount;
      tokenLedger[destination] += amount;
      appendLog(`Native Transfer executed: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)} (CBS Ledger remains unchanged)`);
    }
    updateDisplays();
    logTotals();
  });

  // DEFUND 操作 (Token → CBS)
  defundBtn.addEventListener("click", () => {
    const branch = defundBranchEl.value;
    const amount = parseFloat(defundAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Defund.");
      return;
    }
    if (tokenLedger[branch] < amount) {
      alert(`Insufficient token balance in branch ${branch}.`);
      return;
    }
    lockModelIfNeeded();

    // DEFUND：Token台帳から減少し、CBS台帳へ加算
    tokenLedger[branch] -= amount;
    cbsLedger[branch] += amount;
    appendLog(`[Defund] Moved $${amount.toFixed(2)} from Token(${branch}) to CBS(${branch}). (Model: ${currentModel})`);
    updateDisplays();
    logTotals();
  });

  // モデル変更処理（送金前のみ許可）
  Array.from(modelRadios).forEach(radio => {
    radio.addEventListener("change", function() {
      if (modeLocked) {
        this.checked = (this.value === currentModel);
        appendLog("Model change not allowed after first operation. Please Reset first.");
        return;
      }
      currentModel = this.value;
      appendLog(`Model changed to: ${currentModel}`);
      if (currentModel === "native") {
        // Native モードの場合は、もしToken台帳が既に資金移動されているなら同期する
        if ((tokenLedger.A + tokenLedger.B) > 0) {
          tokenLedger.A = cbsLedger.A;
          tokenLedger.B = cbsLedger.B;
          appendLog("Native model: Token ledger synchronized with CBS ledger.");
          updateDisplays();
        } else {
          appendLog("Native model selected; however, no funds in Token ledger, so no synchronization performed.");
        }
      }
    });
  });

  // RESET 操作
  resetBtn.addEventListener("click", () => {
    cbsLedger = { A: initialBalance, B: initialBalance };
    tokenLedger = { A: 0, B: 0 };  // Token台帳は初期状態は0
    updateDisplays();
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state.");
    modeLocked = false;
    Array.from(modelRadios).forEach(radio => {
      radio.disabled = false;
      if (radio.value === "backed") {
        radio.checked = true;
        currentModel = "backed";
      }
    });
    sourceSelect.value = "A";
    destinationSelect.value = "B";
    fundBranchEl.value = "A";
    fundAmountEl.value = 100;
    transferSourceEl.value = "A";
    transferDestEl.value = "B";
    transferAmountEl.value = 50;
    defundBranchEl.value = "A";
    defundAmountEl.value = 50;
    appendLog("Current Model: " + currentModel);
    logTotals();
  });

  // 初期表示
  updateDisplays();
  appendLog(`Current Model: ${currentModel} (changeable until first operation)`);
  logTotals();
});
