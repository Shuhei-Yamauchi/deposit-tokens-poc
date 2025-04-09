// js/simulation.js

document.addEventListener("DOMContentLoaded", function() {
  // 初期値：各拠点のCBS台帳は1000、Token台帳は初期状態ではCBSと同じ (バックド型の場合)
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

  // 現在のモデル："backed" または "native"
  let currentModel = "backed";
  let modeLocked = false; // 初回送金後、モデル選択はロック

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

  // 総資産（各台帳ごとの合計）をログに出力する（注：両台帳は同じ資金の別表現なので、合算してはいけない）
  function logTotals() {
    const totalCBS = cbsLedger.A + cbsLedger.B;
    const totalToken = tokenLedger.A + tokenLedger.B;
    appendLog(`Total in CBS Ledger: $${totalCBS.toFixed(2)} | Total in Token Ledger: $${totalToken.toFixed(2)}`);
  }

  // シミュレーションリセット
  function resetSimulation() {
    cbsLedger = { A: initialBalance, B: initialBalance };
    tokenLedger = { A: initialBalance, B: initialBalance };
    updateDisplays();
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state.");
    modeLocked = false;
    // モデル選択を有効化し、デフォルトは "backed" に戻す
    Array.from(modelRadios).forEach(radio => {
      radio.disabled = false;
      if (radio.value === "backed") {
        radio.checked = true;
        currentModel = "backed";
      }
    });
    // 送金元・送金先も初期値に戻す
    sourceSelect.value = "A";
    destinationSelect.value = "B";
    appendLog("Current Model: " + currentModel);
    logTotals();
  }

  // モデル選択処理（送金前のみ変更可能）
  Array.from(modelRadios).forEach(radio => {
    radio.addEventListener("change", function() {
      if (modeLocked) {
        // 送金後はモデル変更不可
        this.checked = (this.value === currentModel);
        appendLog("Model change not allowed after first transfer. Please Reset first.");
        return;
      }
      currentModel = this.value;
      appendLog("Switched model to: " + currentModel);
      if (currentModel === "native") {
        // Native モードでは Token LedgerとCBS Ledgerは初期時点では同一
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
    // Backed、もしくは Native で送金可能な Token 残高チェック
    if (tokenLedger[source] < amount) {
      alert(`Insufficient token balance in branch ${source}.`);
      return;
    }

    // 送金処理
    if (currentModel === "backed") {
      // Backed モード：CBS Ledgerの更新
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      appendLog(`CBS Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
      // Token Ledger：送金元からBurn
      tokenLedger[source] -= amount;
      appendLog(`Token Ledger: Burn executed on ${source} for $${amount.toFixed(2)}`);
      // Token Ledger：送金先へMint
      tokenLedger[destination] += amount;
      appendLog(`Token Ledger: Mint executed for ${destination} for $${amount.toFixed(2)}`);
    } else if (currentModel === "native") {
      // Native モード：Token Ledgerのみを更新
      tokenLedger[source] -= amount;
      tokenLedger[destination] += amount;
      appendLog(`Native Transfer executed: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)} (CBS Ledger remains unchanged)`);
    }

    updateDisplays();
    logTotals();

    // 初回送金後、モデル選択はロック（送金元・送金先は変更可能）
    if (!modeLocked) {
      modeLocked = true;
      Array.from(modelRadios).forEach(r => r.disabled = true);
      appendLog("Model selection locked after first transfer. You can still change the source and destination branches for subsequent transfers.");
    }
  });

  resetBtn.addEventListener("click", resetSimulation);

  // 初期状態表示
  updateDisplays();
  appendLog("Current Model: " + currentModel);
  logTotals();
});
