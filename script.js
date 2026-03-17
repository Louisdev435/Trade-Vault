// ========== TRADEVAULT - MAIN SCRIPT ==========

// Initialize trades from localStorage
let trades = JSON.parse(localStorage.getItem('trades')) || [];

// Portfolio balance
let portfolioBalance = parseFloat(localStorage.getItem('portfolioBalance')) || 10000;

// DOM Elements
const tradeTableBody = document.getElementById('tradeTableBody');
const recentTradesBody = document.getElementById('recentTradesBody');
const totalPnlEl = document.getElementById('totalPnl');
const winRateEl = document.getElementById('winRate');
const winDetailsEl = document.getElementById('winDetails');
const totalTradesEl = document.getElementById('totalTrades');
const todayTradesEl = document.getElementById('todayTrades');
const plFactorEl = document.getElementById('plFactor');
const winCountEl = document.getElementById('winCount');
const lossCountEl = document.getElementById('lossCount');
const winPercentEl = document.getElementById('winPercent');
const greetingEl = document.getElementById('greeting');

// Modal elements
const modal = document.getElementById('tradeModal');
const addTradeBtn = document.getElementById('addTradeBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const tradeForm = document.getElementById('tradeForm');
const modalTitle = document.getElementById('modalTitle');
const editTradeId = document.getElementById('editTradeId');

// View modal elements
const viewModal = document.getElementById('viewModal');
const closeViewBtn = document.getElementById('closeViewBtn');
const viewContent = document.getElementById('viewContent');

// Delete modal elements
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let tradeToDelete = null;

// Calendar elements
const calendarGrid = document.getElementById('calendarGrid');
const monthYearEl = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Compound variables
let compoundEnabled = false;
let compoundMode = 'separate';
let currentPartCount = 1;

// ========== TOAST NOTIFICATION SYSTEM ==========

// Create toast container
function createToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

// Show toast notification
function showToast(message, type = 'success', duration = 3000) {
  createToastContainer();
  
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : 
               type === 'info' ? 'fa-circle-info' : 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// Show small success message (bottom right, auto dismiss)
function showSuccessMessage(message) {
  const msg = document.createElement('div');
  msg.className = 'success-message';
  msg.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
  document.body.appendChild(msg);
  
  setTimeout(() => {
    if (msg.parentElement) msg.remove();
  }, 3000);
}

// ========== CONFIRMATION MODAL WITH "DON'T SHOW AGAIN" ==========

let dontShowConfirm = JSON.parse(localStorage.getItem('dontShowConfirm')) || {};

function showConfirmModal(message, onConfirm, onCancel, options = {}) {
  const { id = 'default', confirmText = 'Confirm', cancelText = 'Cancel', title = 'Confirm Action' } = options;
  
  // Check if user chose "don't show again" for this action
  if (dontShowConfirm[id]) {
    if (onConfirm) onConfirm();
    return;
  }
  
  // Create modal if it doesn't exist
  let confirmModal = document.getElementById('confirmModal');
  
  if (!confirmModal) {
    confirmModal = document.createElement('div');
    confirmModal.id = 'confirmModal';
    confirmModal.className = 'modal';
    
    confirmModal.innerHTML = `
      <div class="modal-content confirm-modal">
        <h2 id="confirmTitle">Confirm Action</h2>
        <p id="confirmMessage" style="margin: 20px 0; color: #666;"></p>
        
        <div class="dont-show-again">
          <input type="checkbox" id="dontShowCheckbox">
          <label for="dontShowCheckbox">Don't show this again</label>
        </div>
        
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirmCancelBtn">Cancel</button>
          <button class="btn btn-primary" id="confirmOkBtn">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmModal);
  }
  
  // Set message
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmOkBtn').textContent = confirmText;
  document.getElementById('confirmCancelBtn').textContent = cancelText;
  
  // Show modal
  confirmModal.classList.add('active');
  
  // Remove old listeners
  const okBtn = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');
  const dontShowCheck = document.getElementById('dontShowCheckbox');
  
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new listeners
  newOkBtn.addEventListener('click', () => {
    if (dontShowCheck.checked) {
      dontShowConfirm[id] = true;
      localStorage.setItem('dontShowConfirm', JSON.stringify(dontShowConfirm));
    }
    
    confirmModal.classList.remove('active');
    if (onConfirm) onConfirm();
  });
  
  newCancelBtn.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    if (onCancel) onCancel();
  });
  
  // Close when clicking outside
  confirmModal.onclick = (e) => {
    if (e.target === confirmModal) {
      confirmModal.classList.remove('active');
      if (onCancel) onCancel();
    }
  };
}

// ========== UTILITY FUNCTIONS ==========

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function calculateRMultiple(entry, exit, sl) {
  if (!sl || sl === 0) return 0;
  const risk = Math.abs(entry - sl);
  const profit = Math.abs(exit - entry);
  return (profit / risk).toFixed(2);
}

function updateGreeting() {
  if (!greetingEl) return;
  const hour = new Date().getHours();
  if (hour < 12) greetingEl.textContent = "Good morning";
  else if (hour < 18) greetingEl.textContent = "Good afternoon";
  else greetingEl.textContent = "Good evening";
}

// ========== SCREENSHOT HANDLING ==========

let currentScreenshot = null;

function setupScreenshotPaste() {
  const screenshotPreview = document.getElementById('screenshotPreview');
  const screenshotInput = document.getElementById('screenshotInput');
  const screenshotImage = document.getElementById('screenshotImage');
  
  if (!screenshotPreview || !screenshotInput || !screenshotImage) return;
  
  // Handle paste event
  document.addEventListener('paste', (e) => {
    if (!modal.classList.contains('active')) return;
    
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        
        reader.onload = (event) => {
          currentScreenshot = event.target.result;
          screenshotImage.src = currentScreenshot;
          screenshotImage.style.display = 'block';
          screenshotPreview.querySelector('i').style.display = 'none';
          screenshotPreview.querySelector('p').style.display = 'none';
        };
        
        reader.readAsDataURL(blob);
        break;
      }
    }
  });
  
  // Handle file upload
  screenshotInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentScreenshot = event.target.result;
        screenshotImage.src = currentScreenshot;
        screenshotImage.style.display = 'block';
        screenshotPreview.querySelector('i').style.display = 'none';
        screenshotPreview.querySelector('p').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Click preview to upload
  screenshotPreview.addEventListener('click', () => {
    screenshotInput.click();
  });
}

function clearScreenshot() {
  currentScreenshot = null;
  const screenshotImage = document.getElementById('screenshotImage');
  const screenshotPreview = document.getElementById('screenshotPreview');
  if (screenshotImage) {
    screenshotImage.src = '';
    screenshotImage.style.display = 'none';
  }
  if (screenshotPreview) {
    const icon = screenshotPreview.querySelector('i');
    const text = screenshotPreview.querySelector('p');
    if (icon) icon.style.display = 'block';
    if (text) text.style.display = 'block';
  }
}

// ========== PORTFOLIO MANAGEMENT ==========

function showPortfolioModal() {
  let portfolioModal = document.getElementById('portfolioModal');
  
  if (!portfolioModal) {
    portfolioModal = document.createElement('div');
    portfolioModal.id = 'portfolioModal';
    portfolioModal.className = 'modal';
    
    portfolioModal.innerHTML = `
      <div class="modal-content" style="max-width: 450px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-size: 24px; margin: 0;">💰 Portfolio Settings</h2>
          <button id="closePortfolioBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #888;">&times;</button>
        </div>
        
        <div style="background: #f8f9fc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <div class="form-group">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Current Account Balance ($)</label>
            <input type="number" id="portfolioInput" step="100" min="0" value="${portfolioBalance}" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="resetPortfolioBtn" class="btn btn-secondary" style="flex: 1;">Reset to $10k</button>
          <button id="savePortfolioBtn" class="btn btn-primary" style="flex: 2;">Save Balance</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(portfolioModal);
    
    document.getElementById('closePortfolioBtn').addEventListener('click', () => {
      portfolioModal.classList.remove('active');
    });
    
    document.getElementById('savePortfolioBtn').addEventListener('click', () => {
      const newBalance = parseFloat(document.getElementById('portfolioInput').value);
      if (newBalance && newBalance > 0) {
        portfolioBalance = newBalance;
        localStorage.setItem('portfolioBalance', portfolioBalance);
        updatePortfolioDisplay();
        portfolioModal.classList.remove('active');
        showSuccessMessage('Portfolio updated!');
      } else {
        showToast('Please enter a valid balance', 'warning');
      }
    });
    
    document.getElementById('resetPortfolioBtn').addEventListener('click', () => {
      showConfirmModal(
        'Reset portfolio to $10,000?',
        () => {
          portfolioBalance = 10000;
          localStorage.setItem('portfolioBalance', portfolioBalance);
          document.getElementById('portfolioInput').value = portfolioBalance;
          updatePortfolioDisplay();
          showSuccessMessage('Portfolio reset!');
        },
        null,
        { id: 'resetPortfolio', title: 'Reset Portfolio' }
      );
    });
    
    portfolioModal.addEventListener('click', (e) => {
      if (e.target === portfolioModal) {
        portfolioModal.classList.remove('active');
      }
    });
  }
  
  const input = document.getElementById('portfolioInput');
  if (input) input.value = portfolioBalance;
  
  portfolioModal.classList.add('active');
}

function updatePortfolioAfterTrade(pnl) {
  portfolioBalance += pnl;
  localStorage.setItem('portfolioBalance', portfolioBalance);
  updatePortfolioDisplay();
}

function updatePortfolioDisplay() {
  let portfolioDisplay = document.getElementById('portfolioDisplay');
  
  if (!portfolioDisplay) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    portfolioDisplay = document.createElement('div');
    portfolioDisplay.id = 'portfolioDisplay';
    portfolioDisplay.style.marginTop = '20px';
    portfolioDisplay.style.padding = '15px 10px';
    portfolioDisplay.style.background = '#111';
    portfolioDisplay.style.borderRadius = '10px';
    portfolioDisplay.style.border = '1px solid #333';
    portfolioDisplay.style.textAlign = 'center';
    
    const backupButtons = document.getElementById('backupButtons');
    if (backupButtons) {
      sidebar.insertBefore(portfolioDisplay, backupButtons);
    } else {
      sidebar.appendChild(portfolioDisplay);
    }
  }
  
  portfolioDisplay.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
      <i class="fa-solid fa-wallet" style="color: #2ecc71;"></i>
      <span style="font-weight: 600; color: white;">Portfolio</span>
    </div>
    <div style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 10px;">
      $${portfolioBalance.toFixed(2)}
    </div>
    <button id="editPortfolioBtn" style="background: #2ecc71; color: white; border: none; padding: 8px; border-radius: 6px; width: 100%; cursor: pointer; font-size: 13px; font-weight: 600;">
      <i class="fa-solid fa-pencil"></i> Update Balance
    </button>
  `;
  
  document.getElementById('editPortfolioBtn')?.addEventListener('click', showPortfolioModal);
}

// ========== TRADE STATISTICS ==========

function calculateStats() {
  const total = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  
  const today = new Date().toDateString();
  const todayTrades = trades.filter(t => new Date(t.date).toDateString() === today);
  const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
  
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  
  if (totalPnlEl) {
    totalPnlEl.textContent = formatCurrency(totalPnl);
    totalPnlEl.className = totalPnl >= 0 ? 'stat-value positive' : 'stat-value negative';
  }
  
  if (winRateEl) winRateEl.textContent = winRate + '%';
  if (winDetailsEl) winDetailsEl.textContent = `${wins} wins / ${total} trades`;
  if (totalTradesEl) totalTradesEl.textContent = total;
  if (todayTradesEl) todayTradesEl.textContent = todayTrades.length;
  
  if (plFactorEl) {
    plFactorEl.textContent = todayPnl >= 0 ? '+' + formatCurrency(todayPnl) : formatCurrency(todayPnl);
    plFactorEl.className = todayPnl >= 0 ? 'positive' : 'negative';
  }
  
  if (winCountEl) winCountEl.textContent = wins;
  if (lossCountEl) lossCountEl.textContent = losses;
  if (winPercentEl) winPercentEl.textContent = winRate + '%';
  
  calculateProfitFactor();
  calculateAdvancedStats();
  
  updateWinLossCircle(winRate);
}

function updateWinLossCircle(winRate) {
  const circle = document.querySelector('.circle-progress');
  if (!circle) return;
  
  const degrees = (winRate / 100) * 360;
  circle.style.background = `conic-gradient(var(--success) ${degrees}deg, var(--danger) ${degrees}deg)`;
}

// ========== RENDER TRADES ==========

function renderTradeHistory() {
  if (!tradeTableBody) return;
  
  if (trades.length === 0) {
    tradeTableBody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 40px;">No trades yet. Click the + button to add your first trade.</td></tr>`;
    return;
  }
  
  const sortedTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  tradeTableBody.innerHTML = sortedTrades.map(trade => {
    const pnlClass = trade.pnl >= 0 ? 'positive' : 'negative';
    const rMultiple = trade.sl ? calculateRMultiple(trade.entry, trade.exit, trade.sl) : '-';
    const result = trade.pnl > 0 ? '✅' : (trade.pnl < 0 ? '❌' : '⚖️');
    const hasScreenshot = trade.screenshot ? true : false;
    
    let symbolDisplay = trade.symbol;
    if (trade.compoundData && trade.compoundData.mode === 'separate') {
      symbolDisplay = `${trade.symbol} (${trade.compoundData.parts.length})`;
    } else if (trade.compoundData && trade.compoundData.mode === 'merge') {
      symbolDisplay = `${trade.symbol} (M)`;
    }
    
    return `
      <tr>
        <td>${formatDate(trade.date)}</td>
        <td>${symbolDisplay}</td>
        <td><span class="badge ${trade.direction}">${trade.direction}</span></td>
        <td>${trade.size || 1}</td>
        <td>$${trade.entry}</td>
        <td>$${trade.exit}</td>
        <td>${trade.sl ? '$' + trade.sl : '-'}</td>
        <td>${trade.tp ? '$' + trade.tp : '-'}</td>
        <td>${trade.be ? '✓' : '-'}</td>
        <td class="${pnlClass}">${formatCurrency(trade.pnl)} ${result}</td>
        <td>${rMultiple}</td>
        <td>
          ${hasScreenshot ? '<i class="fa-solid fa-image" style="color: #3498db;" title="Has screenshot"></i>' : '-'}
        </td>
        <td>
          <button class="action-btn view-btn" onclick="viewTrade('${trade.id}')" title="View Details">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="action-btn edit-btn" onclick="editTrade('${trade.id}')" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteTrade('${trade.id}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentTrades() {
  if (!recentTradesBody) return;
  
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);
  
  if (recentTrades.length === 0) {
    recentTradesBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">No recent trades</td></tr>`;
    return;
  }
  
  recentTradesBody.innerHTML = recentTrades.map(trade => {
    const pnlClass = trade.pnl >= 0 ? 'positive' : 'negative';
    const result = trade.pnl > 0 ? '✅' : (trade.pnl < 0 ? '❌' : '⚖️');
    
    return `
      <tr>
        <td>${formatDate(trade.date)}</td>
        <td>${trade.symbol}</td>
        <td><span class="badge ${trade.direction}">${trade.direction}</span></td>
        <td class="${pnlClass}">${formatCurrency(trade.pnl)} ${result}</td>
        <td>${trade.notes ? trade.notes.substring(0, 20) + '...' : '-'}</td>
      </tr>
    `;
  }).join('');
}

// ========== EDIT / DELETE FUNCTIONS ==========

window.editTrade = function(id) {
  const trade = trades.find(t => t.id == id);
  if (!trade) return;
  
  document.getElementById('modalTitle').textContent = 'Edit Trade';
  document.getElementById('editTradeId').value = trade.id;
  document.getElementById('tradeDate').value = trade.date;
  document.getElementById('symbol').value = trade.symbol;
  
  if (trade.screenshot) {
    currentScreenshot = trade.screenshot;
    const screenshotImage = document.getElementById('screenshotImage');
    const screenshotPreview = document.getElementById('screenshotPreview');
    if (screenshotImage && screenshotPreview) {
      screenshotImage.src = currentScreenshot;
      screenshotImage.style.display = 'block';
      screenshotPreview.querySelector('i').style.display = 'none';
      screenshotPreview.querySelector('p').style.display = 'none';
    }
  } else {
    clearScreenshot();
  }
  
  if (trade.direction === 'long') {
    document.getElementById('directionLong').checked = true;
    document.querySelector('.direction-option.long').classList.add('selected');
    document.querySelector('.direction-option.short').classList.remove('selected');
  } else {
    document.getElementById('directionShort').checked = true;
    document.querySelector('.direction-option.short').classList.add('selected');
    document.querySelector('.direction-option.long').classList.remove('selected');
  }
  
  if (trade.compoundData) {
    const toggle = document.getElementById('compoundToggle');
    const panel = document.getElementById('compoundPanel');
    if (toggle) toggle.classList.add('active');
    if (panel) panel.classList.add('visible');
    compoundEnabled = true;
    
    if (trade.compoundData.mode === 'separate') {
      document.getElementById('modeSeparate').click();
      const container = document.getElementById('compoundPartsList');
      if (container) {
        container.innerHTML = '';
        currentPartCount = 0;
        trade.compoundData.parts.forEach((part, index) => {
          if (index === 0) {
            document.getElementById('partEntry1').value = part.entry;
            document.getElementById('partSize1').value = part.size;
            if (part.tp) document.getElementById('partTP1').value = part.tp;
            if (part.sl) document.getElementById('partSL1').value = part.sl;
            currentPartCount = 1;
          } else {
            addCompoundPart();
            document.getElementById(`partEntry${currentPartCount}`).value = part.entry;
            document.getElementById(`partSize${currentPartCount}`).value = part.size;
            if (part.tp) document.getElementById(`partTP${currentPartCount}`).value = part.tp;
            if (part.sl) document.getElementById(`partSL${currentPartCount}`).value = part.sl;
          }
        });
      }
    } else {
      document.getElementById('modeMerge').click();
      document.getElementById('mergeTotalSize').value = trade.compoundData.totalSize;
      document.getElementById('mergeAvgPrice').value = trade.compoundData.avgPrice;
      if (trade.compoundData.tp) document.getElementById('mergeTP').value = trade.compoundData.tp;
      if (trade.compoundData.sl) document.getElementById('mergeSL').value = trade.compoundData.sl;
      updateMergeSummary();
    }
  } else {
    const toggle = document.getElementById('compoundToggle');
    const panel = document.getElementById('compoundPanel');
    if (toggle) toggle.classList.remove('active');
    if (panel) panel.classList.remove('visible');
    compoundEnabled = false;
    
    document.getElementById('positionSize').value = trade.size || 1;
    document.getElementById('entryPrice').value = trade.entry;
    document.getElementById('exitPrice').value = trade.exit;
    document.getElementById('stopLoss').value = trade.sl || '';
    document.getElementById('takeProfit').value = trade.tp || '';
    document.getElementById('breakeven').checked = trade.be || false;
    document.getElementById('notes').value = trade.notes || '';
    document.getElementById('pnl').value = trade.pnl;
  }
  
  modal.classList.add('active');
};

window.deleteTrade = function(id) {
  tradeToDelete = id;
  deleteModal.classList.add('active');
};

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    if (tradeToDelete) {
      const trade = trades.find(t => t.id == tradeToDelete);
      if (trade) {
        portfolioBalance -= trade.pnl;
        localStorage.setItem('portfolioBalance', portfolioBalance);
        updatePortfolioDisplay();
      }
      
      trades = trades.filter(t => t.id != tradeToDelete);
      localStorage.setItem('trades', JSON.stringify(trades));
      
      calculateStats();
      renderTradeHistory();
      renderRecentTrades();
      renderCalendar();
      
      deleteModal.classList.remove('active');
      tradeToDelete = null;
      showSuccessMessage('Trade deleted!');
    }
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
    tradeToDelete = null;
  });
}

// ========== CALENDAR ==========

let currentDate = new Date();

function renderCalendar() {
  if (!calendarGrid || !monthYearEl) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  monthYearEl.textContent = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  let calendarHTML = '';
  
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += '<div class="calendar-day empty"></div>';
  }
  
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const dayTrades = trades.filter(t => t.date === dateStr);
    const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    let dayClass = '';
    if (dayPnl > 0) dayClass = 'positive-day';
    else if (dayPnl < 0) dayClass = 'negative-day';
    
    calendarHTML += `
      <div class="calendar-day">
        <div class="day-number">${d}</div>
        ${dayTrades.length > 0 ? `
          <div class="trade-indicator ${dayClass}">
            ${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''} • ${formatCurrency(dayPnl)}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  calendarGrid.innerHTML = calendarHTML;
}

// ========== TRADE MODAL SETUP ==========

function setupDirectionButtons() {
  const longOption = document.querySelector('.direction-option.long');
  const shortOption = document.querySelector('.direction-option.short');
  const longInput = document.getElementById('directionLong');
  const shortInput = document.getElementById('directionShort');
  
  if (!longOption || !shortOption) return;
  
  longOption.addEventListener('click', () => {
    longOption.classList.add('selected');
    shortOption.classList.remove('selected');
    longInput.checked = true;
  });
  
  shortOption.addEventListener('click', () => {
    shortOption.classList.add('selected');
    longOption.classList.remove('selected');
    shortInput.checked = true;
  });
}

if (addTradeBtn) {
  addTradeBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add New Trade';
    document.getElementById('editTradeId').value = '';
    tradeForm.reset();
    clearScreenshot();
    
    const longOption = document.querySelector('.direction-option.long');
    const shortOption = document.querySelector('.direction-option.short');
    if (longOption && shortOption) {
      longOption.classList.add('selected');
      shortOption.classList.remove('selected');
      document.getElementById('directionLong').checked = true;
    }
    
    const toggle = document.getElementById('compoundToggle');
    const panel = document.getElementById('compoundPanel');
    if (toggle) toggle.classList.remove('active');
    if (panel) panel.classList.remove('visible');
    compoundEnabled = false;
    compoundMode = 'separate';
    currentPartCount = 1;
    
    const container = document.getElementById('compoundPartsList');
    if (container) {
      container.innerHTML = `
        <div class="compound-part-card" id="basePart">
          <div class="compound-part-header">
            <div class="compound-part-title">Part 1 (Base)</div>
          </div>
          <div class="compound-part-grid">
            <div class="compound-part-field">
              <label>Entry Price</label>
              <input type="number" id="partEntry1" step="0.01" placeholder="0.00" value="100">
            </div>
            <div class="compound-part-field">
              <label>Size (Units)</label>
              <input type="number" id="partSize1" step="0.01" placeholder="0.00" value="1">
            </div>
            <div class="compound-part-field">
              <label>Take Profit</label>
              <input type="number" id="partTP1" step="0.01" placeholder="Optional">
            </div>
            <div class="compound-part-field">
              <label>Stop Loss</label>
              <input type="number" id="partSL1" step="0.01" placeholder="Optional">
            </div>
          </div>
          <div class="compound-part-progress">
            <div class="compound-part-progress-fill" id="progress1" style="width: 0%;"></div>
          </div>
        </div>
      `;
    }
    
    const modeSeparate = document.getElementById('modeSeparate');
    const modeMerge = document.getElementById('modeMerge');
    if (modeSeparate) modeSeparate.classList.add('selected');
    if (modeMerge) modeMerge.classList.remove('selected');
    
    const separateContainer = document.getElementById('separateModeContainer');
    const mergeContainer = document.getElementById('mergeModeContainer');
    if (separateContainer) separateContainer.style.display = 'block';
    if (mergeContainer) mergeContainer.style.display = 'none';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tradeDate').value = today;
    
    modal.classList.add('active');
  });
}

function closeModal() {
  modal.classList.remove('active');
  tradeForm.reset();
  clearScreenshot();
  
  compoundEnabled = false;
  compoundMode = 'separate';
  currentPartCount = 1;
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
  if (e.target === deleteModal) deleteModal.classList.remove('active');
});

if (tradeForm) {
  tradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editTradeId').value;
    const date = document.getElementById('tradeDate').value;
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const direction = document.getElementById('directionLong').checked ? 'long' : 'short';
    const notes = document.getElementById('notes').value;
    
    let trade;
    let pnl;
    
    if (compoundEnabled) {
      const compoundData = getCompoundData();
      pnl = 0;
      
      trade = {
        id: id || Date.now(),
        date,
        symbol,
        direction,
        notes,
        compoundData,
        isCompound: true,
        timestamp: new Date().toISOString()
      };
      
      const exitPrice = parseFloat(document.getElementById('exitPrice')?.value);
      if (exitPrice) {
        trade.exit = exitPrice;
        trade.pnl = calculateCompoundPnL(trade, exitPrice);
      }
    } else {
      const size = parseFloat(document.getElementById('positionSize').value) || 1;
      const entry = parseFloat(document.getElementById('entryPrice').value);
      const exit = parseFloat(document.getElementById('exitPrice').value);
      const sl = document.getElementById('stopLoss').value ? parseFloat(document.getElementById('stopLoss').value) : null;
      const tp = document.getElementById('takeProfit').value ? parseFloat(document.getElementById('takeProfit').value) : null;
      const be = document.getElementById('breakeven').checked;
      pnl = parseFloat(document.getElementById('pnl').value);
      
      if (!date || !symbol || !entry || !exit) {
        showToast('Please fill in all required fields', 'warning');
        return;
      }
      
      trade = {
        id: id || Date.now(),
        date,
        symbol,
        direction,
        size,
        entry,
        exit,
        sl,
        tp,
        be,
        pnl,
        notes,
        screenshot: currentScreenshot || null,
        timestamp: new Date().toISOString()
      };
    }
    
    if (id) {
      const oldTrade = trades.find(t => t.id == id);
      if (oldTrade) {
        portfolioBalance -= oldTrade.pnl;
      }
      trades = trades.map(t => t.id == id ? trade : t);
    } else {
      trades.push(trade);
    }
    
    localStorage.setItem('trades', JSON.stringify(trades));
    if (!id) updatePortfolioAfterTrade(pnl);
    
    calculateStats();
    renderTradeHistory();
    renderRecentTrades();
    renderCalendar();
    
    closeModal();
    showSuccessMessage(id ? 'Trade updated!' : 'Trade added!');
  });
}

// ========== BACKUP SYSTEM ==========

let lastBackupTime = null;
let lastTradeCount = 0;

function addBackupButtons() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  if (document.getElementById('backupButtons')) return;
  
  const backupDiv = document.createElement('div');
  backupDiv.id = 'backupButtons';
  backupDiv.style.marginTop = '20px';
  backupDiv.style.padding = '20px 0 10px 0';
  backupDiv.style.borderTop = '1px solid #333';
  
  backupDiv.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="howItWorksBtn" style="background: #f39c12; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; width: 100%;">
        <i class="fa-solid fa-question-circle"></i> How Backup Works
      </button>
      <button id="saveBackupBtn" style="background: #2ecc71; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; width: 100%;">
        <i class="fa-solid fa-download"></i> Save Backup File
      </button>
      <button id="loadBackupBtn" style="background: #3498db; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; width: 100%;">
        <i class="fa-solid fa-upload"></i> Restore From Backup
      </button>
    </div>
    <div id="backupStatus" style="color: #2ecc71; font-size: 11px; margin-top: 8px; text-align: center; min-height: 16px;"></div>
  `;
  
  sidebar.appendChild(backupDiv);
  
  document.getElementById('howItWorksBtn').addEventListener('click', showBackupGuide);
  document.getElementById('saveBackupBtn').addEventListener('click', saveBackup);
  document.getElementById('loadBackupBtn').addEventListener('click', loadBackup);
  
  lastTradeCount = trades.length;
}

function showBackupGuide() {
  let guideModal = document.getElementById('guideModal');
  
  if (!guideModal) {
    guideModal = document.createElement('div');
    guideModal.id = 'guideModal';
    guideModal.className = 'modal';
    
    guideModal.innerHTML = `
      <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding: 10px 0;">
          <h2 style="font-size: 28px; margin: 0;">📘 Complete User Guide</h2>
          <button id="closeGuideBtn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #888;">&times;</button>
        </div>
        
        <div style="background: #000; color: white; padding: 20px; border-radius: 16px; margin-bottom: 25px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 22px;">✨ What's New in TradeVault</h3>
          <p style="margin: 0; opacity: 0.9; font-size: 15px;">Compound Trading • Saved Pairs • One-Click Backup • Profit Factor • Equity Curves</p>
        </div>
        
        <!-- Quick Start -->
        <div style="background: #f8f9fc; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
          <h3 style="display: flex; align-items: center; gap: 10px; margin-top: 0;">
            <span style="background: #2ecc71; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">1</span>
            ⚡ Quick Start (30 Seconds)
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 12px;">
              <strong>💰 Set Portfolio</strong>
              <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Click "Update Balance" in sidebar to set your account balance</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 12px;">
              <strong>📝 Add Trade</strong>
              <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Click the + button anywhere, or use Quick Entry in Trade Log</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 12px;">
              <strong>💾 Backup Once</strong>
              <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Click "Save Backup File" - always uses ONE file, just replace</p>
            </div>
          </div>
        </div>
        
        <!-- Compound Trading Guide -->
        <div style="background: #f3e5f5; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
          <h3 style="display: flex; align-items: center; gap: 10px; margin-top: 0;">
            <i class="fa-solid fa-layer-group" style="color: #9b59b6;"></i> 🔄 Compound Trading (NEW)
          </h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: white; border-radius: 12px; padding: 15px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="background: #9b59b6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">1</span>
                <strong>Separate Mode</strong>
              </div>
              <p style="font-size: 13px; color: #555; margin: 0;">
                Each addition stays independent. Add multiple entries with their own TP/SL.
                Perfect when each addition is tracked separately.
              </p>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 15px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="background: #2ecc71; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">2</span>
                <strong>Merge Mode</strong>
              </div>
              <p style="font-size: 13px; color: #555; margin: 0;">
                All additions blend into one average price. Set total size and average entry.
                Perfect when positions combine automatically.
              </p>
            </div>
          </div>
          
          <div style="margin-top: 15px; background: #fff3e0; border-radius: 10px; padding: 12px;">
            <strong>📘 How to use:</strong>
            <ul style="margin: 8px 0 0 20px; font-size: 13px;">
              <li>Click the <strong>Compound Trading toggle</strong> to reveal options</li>
              <li>Choose <strong>Separate</strong> or <strong>Merge</strong> mode</li>
              <li>In Separate mode, click <strong>"Add Another Part"</strong> for more entries</li>
              <li>Each part has its own Entry, Size, TP, and SL</li>
              <li>Progress bars show distance to TP/SL for each part</li>
              <li>In Merge mode, enter Total Size and Average Price once</li>
            </ul>
          </div>
        </div>
        
        <!-- Main Features Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
          
          <!-- Saved Pairs -->
          <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <div style="background: #3498db; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fa-solid fa-bookmark"></i>
              </div>
              <h3 style="margin: 0;">Saved Pairs</h3>
            </div>
            <p style="color: #555; font-size: 14px; margin-bottom: 15px;">Never type the same symbol twice.</p>
            <div style="background: #f8f9fc; padding: 12px; border-radius: 10px; font-size: 13px;">
              <div><span style="color: #3498db;">•</span> Type a symbol (e.g., "BTCUSD")</div>
              <div><span style="color: #3498db;">•</span> Click "Save" button below input</div>
              <div><span style="color: #3498db;">•</span> Next time, select from dropdown</div>
            </div>
          </div>
          
          <!-- Profit Factor -->
          <div style="background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <div style="background: #f39c12; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fa-solid fa-scale-balanced"></i>
              </div>
              <h3 style="margin: 0;">Profit Factor</h3>
            </div>
            <p style="color: #555; font-size: 14px; margin-bottom: 15px;">Your edge in one number (Gross Profit / Gross Loss).</p>
            <div style="background: #f8f9fc; padding: 12px; border-radius: 10px; font-size: 13px;">
              <div><span style="color: #2ecc71;">🟢 ≥ 2.0</span> Excellent</div>
              <div><span style="color: #f39c12;">🟠 1.5 - 2.0</span> Good</div>
              <div><span style="color: #3498db;">🔵 1.0 - 1.5</span> Breakeven</div>
              <div><span style="color: #e74c3c;">🔴 < 1.0</span> Losing</div>
            </div>
          </div>
        </div>
        
        <!-- Backup System -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 20px; color: white; margin-bottom: 25px;">
          <h3 style="display: flex; align-items: center; gap: 10px; margin-top: 0; color: white;">
            <i class="fa-solid fa-download"></i> 💾 ONE-BUTTON BACKUP SYSTEM
          </h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
            <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
              <strong>1️⃣ First Click</strong>
              <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Creates "tradevault-backup.json" - save it anywhere</p>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
              <strong>2️⃣ Next Clicks</strong>
              <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Same filename - your browser will ask to REPLACE. Click YES.</p>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
              <strong>3️⃣ Restore</strong>
              <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Click "Restore" and select your backup file</p>
            </div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button id="gotItBtn" class="btn btn-primary" style="padding: 12px 30px;">Got It! Start Trading</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(guideModal);
    
    document.getElementById('closeGuideBtn').addEventListener('click', () => {
      guideModal.classList.remove('active');
    });
    
    document.getElementById('gotItBtn').addEventListener('click', () => {
      guideModal.classList.remove('active');
    });
    
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) {
        guideModal.classList.remove('active');
      }
    });
  }
  
  guideModal.classList.add('active');
}

function saveBackup() {
  const trades = JSON.parse(localStorage.getItem('trades')) || [];
  const activeTrades = JSON.parse(localStorage.getItem('activeTrades')) || [];
  const savedPairs = JSON.parse(localStorage.getItem('savedPairs')) || [];
  const backup = {
    trades: trades,
    activeTrades: activeTrades,
    savedPairs: savedPairs,
    portfolioBalance: portfolioBalance,
    date: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tradevault-backup.json';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccessMessage('Backup saved!');
}

function loadBackup() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        
        if (!content.trades || !Array.isArray(content.trades)) {
          throw new Error('Invalid backup');
        }
        
        showConfirmModal(
          `Replace current ${trades.length} trades with ${content.trades.length} trades from backup?`,
          () => {
            trades = content.trades;
            localStorage.setItem('trades', JSON.stringify(trades));
            
            if (content.portfolioBalance) {
              portfolioBalance = content.portfolioBalance;
              localStorage.setItem('portfolioBalance', portfolioBalance);
            }
            
            if (content.activeTrades) {
              activeTrades = content.activeTrades;
              localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
            }
            
            if (content.savedPairs) {
              savedPairs = content.savedPairs;
              localStorage.setItem('savedPairs', JSON.stringify(savedPairs));
              updateSavedPairsDropdown();
            }
            
            calculateStats();
            renderTradeHistory();
            renderRecentTrades();
            renderCalendar();
            renderActiveTrades();
            updatePortfolioDisplay();
            
            lastTradeCount = trades.length;
            showSuccessMessage('Backup restored!');
          },
          null,
          { id: 'loadBackup', title: 'Restore Backup' }
        );
      } catch (error) {
        showToast('❌ Invalid backup file', 'warning');
      }
    };
    
    reader.readAsText(file);
  });
  
  fileInput.click();
}

// ========== ACTIVE TRADES SYSTEM ==========

let activeTrades = JSON.parse(localStorage.getItem('activeTrades')) || [];

const activeTradesGrid = document.getElementById('activeTradesGrid');
const quickSymbol = document.getElementById('quickSymbol');
const quickDirection = document.getElementById('quickDirection');
const quickEntry = document.getElementById('quickEntry');
const quickSize = document.getElementById('quickSize');
const quickTP = document.getElementById('quickTP');
const quickSL = document.getElementById('quickSL');
const openTradeBtn = document.getElementById('openTradeBtn');
const clearQuickBtn = document.getElementById('clearQuickBtn');
const activeTradesTab = document.getElementById('activeTradesTab');
const closedTradesTab = document.getElementById('closedTradesTab');
const activeTradesSection = document.getElementById('activeTradesSection');
const closedTradesSection = document.getElementById('closedTradesSection');

const closeTradeModal = document.getElementById('closeTradeModal');
const closeCloseModalBtn = document.getElementById('closeCloseModalBtn');
const cancelCloseBtn = document.getElementById('cancelCloseBtn');
const confirmCloseBtn = document.getElementById('confirmCloseBtn');
const hitTPBtn = document.getElementById('hitTPBtn');
const hitSLBtn = document.getElementById('hitSLBtn');
const closeExitPrice = document.getElementById('closeExitPrice');
const closeTradeDetails = document.getElementById('closeTradeDetails');

let activeTradeToClose = null;

// ========== TAB SWITCHING ==========

if (activeTradesTab && closedTradesTab) {
  activeTradesTab.addEventListener('click', () => {
    activeTradesTab.classList.add('active');
    closedTradesTab.classList.remove('active');
    activeTradesSection.style.display = 'block';
    closedTradesSection.style.display = 'none';
  });
  
  closedTradesTab.addEventListener('click', () => {
    closedTradesTab.classList.add('active');
    activeTradesTab.classList.remove('active');
    activeTradesSection.style.display = 'none';
    closedTradesSection.style.display = 'block';
  });
}

// ========== RENDER ACTIVE TRADES ==========

function renderActiveTrades() {
  if (!activeTradesGrid) return;
  
  if (activeTrades.length === 0) {
    activeTradesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
        <i class="fa-solid fa-circle-plus" style="font-size: 40px; margin-bottom: 10px;"></i>
        <p>No open trades. Use Quick Entry above to open a trade.</p>
      </div>
    `;
    return;
  }
  
  activeTradesGrid.innerHTML = activeTrades.map(trade => {
    const direction = trade.direction;
    const isCompound = trade.compoundData ? true : false;
    
    let compoundHtml = '';
    if (isCompound && trade.compoundData.mode === 'separate' && trade.compoundData.parts) {
      compoundHtml = '<div class="compound-parts-indicator">';
      compoundHtml += '<div style="font-weight: 600; margin-bottom: 5px;">📊 Compound Parts:</div>';
      trade.compoundData.parts.forEach((part, idx) => {
        compoundHtml += `
          <div class="compound-part-item">
            <span class="entry">Part ${idx+1}: $${part.entry}</span>
            <span>
              ${part.tp ? '<span class="tp">TP: $' + part.tp + '</span>' : ''}
              ${part.sl ? '<span class="sl"> SL: $' + part.sl + '</span>' : ''}
            </span>
          </div>
        `;
      });
      compoundHtml += '</div>';
    } else if (isCompound && trade.compoundData.mode === 'merge') {
      compoundHtml = `
        <div class="compound-parts-indicator">
          <div style="font-weight: 600; margin-bottom: 5px;">🔄 Merged Position:</div>
          <div class="compound-part-item">
            <span>Total Size: ${trade.compoundData.totalSize}</span>
            <span>Avg Entry: $${trade.compoundData.avgPrice}</span>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="active-trade-card ${direction}" data-id="${trade.id}">
        <div class="trade-card-header">
          <div class="trade-title">
            <span class="card-symbol">${trade.symbol}</span>
            <span class="card-direction ${direction}">${direction.toUpperCase()}</span>
            ${isCompound ? '<span class="compound-badge"><i class="fa-solid fa-layer-group"></i> Compound</span>' : ''}
          </div>
          <div class="trade-actions">
            <button class="edit-trade-btn" onclick="editActiveTrade('${trade.id}')" title="Edit Trade">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </div>
        
        <div class="card-details">
          <div class="detail-item">
            <span class="detail-label">Entry</span>
            <span class="detail-value">$${trade.entry}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Size</span>
            <span class="detail-value">${trade.size}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Take Profit</span>
            <span class="detail-value small">${trade.tp ? '$' + trade.tp : '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Stop Loss</span>
            <span class="detail-value small">${trade.sl ? '$' + trade.sl : '-'}</span>
          </div>
        </div>
        
        ${compoundHtml}
        
        <div class="target-prices">
          <span>SL: $${trade.sl || '-'}</span>
          <span>TP: $${trade.tp || '-'}</span>
        </div>
        
        <div class="card-actions">
          <button class="close-btn" onclick="openCloseTradeModal('${trade.id}')">
            <i class="fa-solid fa-check"></i> Close Trade
          </button>
          <button class="delete-active-btn" onclick="deleteActiveTrade('${trade.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ========== OPEN NEW TRADE ==========

if (openTradeBtn) {
  openTradeBtn.addEventListener('click', () => {
    const symbol = quickSymbol.value.toUpperCase();
    const direction = quickDirection.value;
    const entry = parseFloat(quickEntry.value);
    const size = parseFloat(quickSize.value);
    const tp = quickTP.value ? parseFloat(quickTP.value) : null;
    const sl = quickSL.value ? parseFloat(quickSL.value) : null;
    
    if (!symbol || !entry || !size) {
      showToast('Please fill in Symbol, Entry Price, and Size', 'warning');
      return;
    }
    
    const compoundPanel = document.getElementById('compoundPanel');
    const isCompound = compoundPanel && compoundPanel.style.display === 'block';
    
    let newTrade;
    
    if (isCompound) {
      const compoundData = getCompoundData();
      
      if (compoundData && compoundData.mode === 'separate') {
        const totalSize = compoundData.parts.reduce((sum, p) => sum + p.size, 0);
        
        newTrade = {
          id: Date.now().toString(),
          symbol,
          direction,
          entry: compoundData.parts[0]?.entry || entry,
          size: totalSize,
          tp,
          sl,
          compoundData: compoundData,
          openDate: new Date().toISOString().split('T')[0],
          openTime: new Date().toLocaleTimeString()
        };
      } else if (compoundData && compoundData.mode === 'merge') {
        newTrade = {
          id: Date.now().toString(),
          symbol,
          direction,
          entry: compoundData.avgPrice,
          size: compoundData.totalSize,
          tp,
          sl,
          compoundData: compoundData,
          openDate: new Date().toISOString().split('T')[0],
          openTime: new Date().toLocaleTimeString()
        };
      } else {
        newTrade = {
          id: Date.now().toString(),
          symbol,
          direction,
          entry,
          size,
          tp,
          sl,
          openDate: new Date().toISOString().split('T')[0],
          openTime: new Date().toLocaleTimeString()
        };
      }
    } else {
      newTrade = {
        id: Date.now().toString(),
        symbol,
        direction,
        entry,
        size,
        tp,
        sl,
        openDate: new Date().toISOString().split('T')[0],
        openTime: new Date().toLocaleTimeString()
      };
    }
    
    activeTrades.push(newTrade);
    localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
    
    quickSymbol.value = '';
    quickDirection.value = 'long';
    quickEntry.value = '';
    quickSize.value = '';
    quickTP.value = '';
    quickSL.value = '';
    
    renderActiveTrades();
    showSuccessMessage('Trade opened!');
  });
}

if (clearQuickBtn) {
  clearQuickBtn.addEventListener('click', () => {
    quickSymbol.value = '';
    quickDirection.value = 'long';
    quickEntry.value = '';
    quickSize.value = '';
    quickTP.value = '';
    quickSL.value = '';
  });
}

// ========== COMPOUND DATA FUNCTIONS ==========

function getCompoundData() {
  const panel = document.getElementById('compoundPanel');
  if (!panel || panel.style.display === 'none') {
    return null;
  }
  
  const modeSeparate = document.getElementById('modeSeparateBtn');
  const modeMerge = document.getElementById('modeMergeBtn');
  
  let mode = 'separate';
  if (modeMerge && modeMerge.classList.contains('selected')) {
    mode = 'merge';
  }
  
  if (mode === 'separate') {
    const parts = [];
    const partRows = document.querySelectorAll('.part-row');
    
    partRows.forEach(row => {
      const entry = row.querySelector('.partEntry')?.value;
      const size = row.querySelector('.partSize')?.value;
      const tp = row.querySelector('.partTP')?.value;
      const sl = row.querySelector('.partSL')?.value;
      
      if (entry && size) {
        parts.push({
          entry: parseFloat(entry),
          size: parseFloat(size),
          tp: tp ? parseFloat(tp) : null,
          sl: sl ? parseFloat(sl) : null
        });
      }
    });
    
    return {
      mode: 'separate',
      parts: parts
    };
  } else {
    return {
      mode: 'merge',
      totalSize: parseFloat(document.getElementById('mergeTotalSize')?.value) || 0,
      avgPrice: parseFloat(document.getElementById('mergeAvgPrice')?.value) || 0,
      tp: parseFloat(document.getElementById('mergeTP')?.value) || null,
      sl: parseFloat(document.getElementById('mergeSL')?.value) || null
    };
  }
}

function calculateCompoundPnL(trade, exitPrice) {
  if (!trade.compoundData) return 0;
  
  let totalPnl = 0;
  const direction = trade.direction === 'long' ? 1 : -1;
  
  if (trade.compoundData.mode === 'separate') {
    trade.compoundData.parts.forEach(part => {
      const pnl = direction * (exitPrice - part.entry) * part.size;
      totalPnl += pnl;
    });
  } else {
    totalPnl = direction * (exitPrice - trade.compoundData.avgPrice) * trade.compoundData.totalSize;
  }
  
  return totalPnl;
}

// ========== CLOSE TRADE MODAL ==========

window.openCloseTradeModal = function(id) {
  const trade = activeTrades.find(t => t.id === id);
  if (!trade) return;
  
  activeTradeToClose = trade;
  
  const direction = trade.direction === 'long' ? '📈 LONG' : '📉 SHORT';
  const tpText = trade.tp ? `$${trade.tp}` : 'Not set';
  const slText = trade.sl ? `$${trade.sl}` : 'Not set';
  
  closeTradeDetails.innerHTML = `
    <div style="background: #f8f9fc; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-weight: 600;">${trade.symbol}</span>
        <span style="color: ${trade.direction === 'long' ? '#2ecc71' : '#e74c3c'}; font-weight: 600;">${direction}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <div style="font-size: 11px; color: #999;">Entry</div>
          <div style="font-weight: 600;">$${trade.entry}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #999;">Size</div>
          <div style="font-weight: 600;">${trade.size}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #999;">Take Profit</div>
          <div style="font-weight: 600; color: #2ecc71;">${tpText}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #999;">Stop Loss</div>
          <div style="font-weight: 600; color: #e74c3c;">${slText}</div>
        </div>
      </div>
    </div>
  `;
  
  closeExitPrice.value = '';
  closeTradeModal.classList.add('active');
};

if (closeCloseModalBtn) {
  closeCloseModalBtn.addEventListener('click', () => {
    closeTradeModal.classList.remove('active');
    activeTradeToClose = null;
  });
}

if (cancelCloseBtn) {
  cancelCloseBtn.addEventListener('click', () => {
    closeTradeModal.classList.remove('active');
    activeTradeToClose = null;
  });
}

if (hitTPBtn) {
  hitTPBtn.addEventListener('click', () => {
    if (activeTradeToClose && activeTradeToClose.tp) {
      closeExitPrice.value = activeTradeToClose.tp;
    } else {
      showToast('No TP set for this trade', 'info');
    }
  });
}

if (hitSLBtn) {
  hitSLBtn.addEventListener('click', () => {
    if (activeTradeToClose && activeTradeToClose.sl) {
      closeExitPrice.value = activeTradeToClose.sl;
    } else {
      showToast('No SL set for this trade', 'info');
    }
  });
}

if (confirmCloseBtn) {
  confirmCloseBtn.addEventListener('click', () => {
    if (!activeTradeToClose) return;
    
    const exitPrice = parseFloat(closeExitPrice.value);
    if (!exitPrice) {
      showToast('Please enter exit price', 'warning');
      return;
    }
    
    let pnl;
    if (activeTradeToClose.compoundData) {
      pnl = calculateCompoundPnL(activeTradeToClose, exitPrice);
    } else {
      const direction = activeTradeToClose.direction === 'long' ? 1 : -1;
      pnl = direction * (exitPrice - activeTradeToClose.entry) * activeTradeToClose.size;
    }
    
    const closedTrade = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      symbol: activeTradeToClose.symbol,
      direction: activeTradeToClose.direction,
      size: activeTradeToClose.size,
      entry: activeTradeToClose.entry,
      exit: exitPrice,
      sl: activeTradeToClose.sl,
      tp: activeTradeToClose.tp,
      compoundData: activeTradeToClose.compoundData,
      pnl: pnl,
      notes: `Closed from active trade`,
      timestamp: new Date().toISOString()
    };
    
    trades.push(closedTrade);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    updatePortfolioAfterTrade(pnl);
    
    activeTrades = activeTrades.filter(t => t.id !== activeTradeToClose.id);
    localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
    
    renderActiveTrades();
    renderTradeHistory();
    renderRecentTrades();
    renderCalendar();
    calculateStats();
    updateMiniCharts();
    
    closeTradeModal.classList.remove('active');
    activeTradeToClose = null;
  });
}

// ========== DELETE ACTIVE TRADE ==========

window.deleteActiveTrade = function(id) {
  showConfirmModal(
    'Delete this active trade? It will be removed permanently.',
    () => {
      activeTrades = activeTrades.filter(t => t.id !== id);
      localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
      renderActiveTrades();
    },
    null,
    { id: 'deleteActiveTrade', title: 'Delete Active Trade' }
  );
};

// ========== EDIT ACTIVE TRADE MODAL ==========

function showEditActiveModal(trade) {
  let editModal = document.getElementById('editActiveModal');
  
  if (!editModal) {
    editModal = document.createElement('div');
    editModal.id = 'editActiveModal';
    editModal.className = 'modal';
    
    editModal.innerHTML = `
      <div class="modal-content" style="max-width: 550px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-size: 24px;">✏️ Edit Active Trade</h2>
          <button id="closeEditModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <div class="form-group">
          <label>Symbol</label>
          <input type="text" id="editSymbol" class="form-input" readonly style="background: #f5f5f5;">
        </div>
        
        <div class="form-group">
          <label>Direction</label>
          <select id="editDirection" class="form-input">
            <option value="long">Long 📈</option>
            <option value="short">Short 📉</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Entry Price</label>
          <input type="number" id="editEntry" step="0.01" class="form-input">
        </div>
        
        <div class="form-group">
          <label>Size (Units)</label>
          <input type="number" id="editSize" step="0.01" class="form-input">
        </div>
        
        <div class="form-group">
          <label>Take Profit</label>
          <input type="number" id="editTP" step="0.01" class="form-input" placeholder="Optional">
        </div>
        
        <div class="form-group">
          <label>Stop Loss</label>
          <input type="number" id="editSL" step="0.01" class="form-input" placeholder="Optional">
        </div>
        
        <!-- COMPOUND TOGGLE BUTTON -->
        <div style="margin: 15px 0; text-align: right;">
          <button type="button" id="editCompoundToggle" style="background: none; border: none; color: #9b59b6; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-layer-group"></i> Add compound parts?
          </button>
        </div>

        <!-- COMPOUND PANEL (Hidden by default) -->
        <div id="editCompoundPanel" style="display: none; background: #f8f9fc; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #eee;">
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button type="button" id="editModeSeparateBtn" style="flex: 1; padding: 10px; border: 2px solid #9b59b6; background: #f3e5f5; border-radius: 8px; font-weight: 600; cursor: pointer;">Separate</button>
            <button type="button" id="editModeMergeBtn" style="flex: 1; padding: 10px; border: 2px solid #2ecc71; background: #e1f7e1; border-radius: 8px; font-weight: 600; cursor: pointer;">Merge</button>
          </div>
          
          <div id="editSeparateParts">
            <div class="part-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <input type="number" class="partEntry" placeholder="Entry" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
              <input type="number" class="partSize" placeholder="Size" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
              <input type="number" class="partTP" placeholder="TP" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
              <div style="display: flex; gap: 5px;">
                <input type="number" class="partSL" placeholder="SL" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
              </div>
            </div>
          </div>
          
          <button type="button" id="editAddPartBtn" style="width: 100%; padding: 10px; border: 2px dashed #aaa; background: white; border-radius: 8px; cursor: pointer; margin-top: 10px;">
            + Add Another Part
          </button>
        </div>
        
        <div id="editCompoundInfo" style="display: none; margin-top: 15px; padding: 15px; background: #f3e5f5; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <i class="fa-solid fa-layer-group" style="color: #9b59b6;"></i>
            <span style="font-weight: 600;">Compound Details</span>
          </div>
          <div id="editCompoundDetails"></div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-secondary" id="cancelEditBtn" style="flex: 1;">Cancel</button>
          <button class="btn btn-primary" id="saveEditBtn" style="flex: 2;">Save Changes</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(editModal);
    
    document.getElementById('closeEditModalBtn').addEventListener('click', () => {
      editModal.classList.remove('active');
    });
    
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      editModal.classList.remove('active');
    });
    
    document.getElementById('saveEditBtn').addEventListener('click', () => {
      const tradeId = editModal.dataset.tradeId;
      const tradeIndex = activeTrades.findIndex(t => t.id === tradeId);
      
      if (tradeIndex !== -1) {
        activeTrades[tradeIndex].direction = document.getElementById('editDirection').value;
        activeTrades[tradeIndex].entry = parseFloat(document.getElementById('editEntry').value);
        activeTrades[tradeIndex].size = parseFloat(document.getElementById('editSize').value);
        activeTrades[tradeIndex].tp = document.getElementById('editTP').value ? parseFloat(document.getElementById('editTP').value) : null;
        activeTrades[tradeIndex].sl = document.getElementById('editSL').value ? parseFloat(document.getElementById('editSL').value) : null;
        
        localStorage.setItem('activeTrades', JSON.stringify(activeTrades));
        
        renderActiveTrades();
        
        editModal.classList.remove('active');
        
        showSuccessMessage('Trade updated!');
      }
    });
    
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        editModal.classList.remove('active');
      }
    });
    
    // ===== COMPOUND TOGGLE CODE FOR EDIT MODAL =====
    const editCompoundToggle = document.getElementById('editCompoundToggle');
    const editCompoundPanel = document.getElementById('editCompoundPanel');
    const editModeSeparateBtn = document.getElementById('editModeSeparateBtn');
    const editModeMergeBtn = document.getElementById('editModeMergeBtn');
    const editAddPartBtn = document.getElementById('editAddPartBtn');
    const editSeparateParts = document.getElementById('editSeparateParts');
    
    if (editCompoundToggle) {
      editCompoundToggle.addEventListener('click', () => {
        if (editCompoundPanel.style.display === 'none' || editCompoundPanel.style.display === '') {
          editCompoundPanel.style.display = 'block';
          editCompoundToggle.innerHTML = '<i class="fa-solid fa-layer-group"></i> Hide compound options';
        } else {
          editCompoundPanel.style.display = 'none';
          editCompoundToggle.innerHTML = '<i class="fa-solid fa-layer-group"></i> Add compound parts?';
        }
      });
    }
    
    if (editModeSeparateBtn) {
      editModeSeparateBtn.addEventListener('click', () => {
        editModeSeparateBtn.style.background = '#9b59b6';
        editModeSeparateBtn.style.color = 'white';
        editModeMergeBtn.style.background = '#e1f7e1';
        editModeMergeBtn.style.color = '#2ecc71';
      });
    }
    
    if (editModeMergeBtn) {
      editModeMergeBtn.addEventListener('click', () => {
        editModeMergeBtn.style.background = '#2ecc71';
        editModeMergeBtn.style.color = 'white';
        editModeSeparateBtn.style.background = '#f3e5f5';
        editModeSeparateBtn.style.color = '#9b59b6';
      });
    }
    
    if (editAddPartBtn) {
      editAddPartBtn.addEventListener('click', () => {
        const newPart = document.createElement('div');
        newPart.className = 'part-row';
        newPart.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;';
        newPart.innerHTML = `
          <input type="number" class="partEntry" placeholder="Entry" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <input type="number" class="partSize" placeholder="Size" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <input type="number" class="partTP" placeholder="TP" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <div style="display: flex; gap: 5px;">
            <input type="number" class="partSL" placeholder="SL" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
            <button class="remove-part" style="background: #e74c3c; color: white; border: none; width: 30px; border-radius: 6px; cursor: pointer;">×</button>
          </div>
        `;
        
        newPart.querySelector('.remove-part').addEventListener('click', () => {
          newPart.remove();
        });
        
        editSeparateParts.appendChild(newPart);
      });
    }
    // ===== END COMPOUND TOGGLE CODE =====
  }
  
  // Fill form with trade data
  document.getElementById('editSymbol').value = trade.symbol;
  document.getElementById('editDirection').value = trade.direction;
  document.getElementById('editEntry').value = trade.entry;
  document.getElementById('editSize').value = trade.size;
  document.getElementById('editTP').value = trade.tp || '';
  document.getElementById('editSL').value = trade.sl || '';
  
  const compoundInfo = document.getElementById('editCompoundInfo');
  const compoundDetails = document.getElementById('editCompoundDetails');
  
  if (trade.compoundData) {
    compoundInfo.style.display = 'block';
    
    if (trade.compoundData.mode === 'separate') {
      let html = '<div style="font-size: 13px;">';
      html += `<p><strong>Mode:</strong> Separate (${trade.compoundData.parts.length} parts)</p>`;
      html += '<ul style="margin-top: 5px; padding-left: 20px;">';
      trade.compoundData.parts.forEach((part, i) => {
        html += `<li>Part ${i+1}: $${part.entry} (${part.size} units)`;
        if (part.tp) html += ` TP: $${part.tp}`;
        if (part.sl) html += ` SL: $${part.sl}`;
        html += '</li>';
      });
      html += '</ul></div>';
      compoundDetails.innerHTML = html;
    } else {
      compoundDetails.innerHTML = `
        <div style="font-size: 13px;">
          <p><strong>Mode:</strong> Merge</p>
          <p><strong>Total Size:</strong> ${trade.compoundData.totalSize} units</p>
          <p><strong>Avg Price:</strong> $${trade.compoundData.avgPrice}</p>
          ${trade.compoundData.tp ? `<p><strong>TP:</strong> $${trade.compoundData.tp}</p>` : ''}
          ${trade.compoundData.sl ? `<p><strong>SL:</strong> $${trade.compoundData.sl}</p>` : ''}
        </div>
      `;
    }
  } else {
    compoundInfo.style.display = 'none';
  }
  
  editModal.dataset.tradeId = trade.id;
  editModal.classList.add('active');
}

window.editActiveTrade = function(id) {
  const trade = activeTrades.find(t => t.id === id);
  if (!trade) return;
  
  showEditActiveModal(trade);
};

// ========== INITIALIZE ACTIVE TRADES ==========

const originalInit3 = init;
init = function() {
  originalInit3();
  renderActiveTrades();
};

document.addEventListener('DOMContentLoaded', init);

// ========== SAVED PAIRS FEATURE ==========

let savedPairs = JSON.parse(localStorage.getItem('savedPairs')) || [];

function updateSavedPairsDropdown() {
  const dropdown = document.getElementById('savedPairs');
  if (!dropdown) return;
  
  dropdown.innerHTML = '<option value="">📁 Select saved pair...</option>';
  savedPairs.forEach(pair => {
    dropdown.innerHTML += `<option value="${pair}">${pair}</option>`;
  });
}

const savePairBtn = document.getElementById('savePairBtn');
if (savePairBtn) {
  savePairBtn.addEventListener('click', () => {
    const symbol = document.getElementById('symbol').value.toUpperCase();
    if (!symbol) {
      showToast('Please enter a symbol first', 'warning');
      return;
    }
    
    if (!savedPairs.includes(symbol)) {
      savedPairs.push(symbol);
      localStorage.setItem('savedPairs', JSON.stringify(savedPairs));
      updateSavedPairsDropdown();
      showSuccessMessage(`Saved ${symbol}`);
    } else {
      showToast('Pair already saved', 'info');
    }
  });
}

const savedPairsDropdown = document.getElementById('savedPairs');
if (savedPairsDropdown) {
  savedPairsDropdown.addEventListener('change', (e) => {
    if (e.target.value) {
      document.getElementById('symbol').value = e.target.value;
    }
  });
}

updateSavedPairsDropdown();

// ========== COMPOUND TRADING TOGGLE ==========

document.addEventListener('DOMContentLoaded', function() {
  let partCount = 1;
  const compoundToggle = document.getElementById('compoundToggle');
  const compoundPanel = document.getElementById('compoundPanel');
  const addPartBtn = document.getElementById('addPartBtn');
  const modeSeparateBtn = document.getElementById('modeSeparateBtn');
  const modeMergeBtn = document.getElementById('modeMergeBtn');
  
  // Only run compound toggle code if the elements exist
  if (compoundToggle && compoundPanel) {
    compoundToggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (compoundPanel.style.display === 'none' || compoundPanel.style.display === '') {
        compoundPanel.style.display = 'block';
        compoundToggle.innerHTML = '<i class="fa-solid fa-layer-group"></i> Hide compound options';
      } else {
        compoundPanel.style.display = 'none';
        compoundToggle.innerHTML = '<i class="fa-solid fa-layer-group"></i> Need compound trading? Click here';
      }
    });
  } else {
    console.log('Compound toggle not found - continuing...');
    // Don't return - just log and continue
  }
  
  // Only run these if the buttons exist
  if (modeSeparateBtn) {
    modeSeparateBtn.addEventListener('click', function() {
      modeSeparateBtn.classList.add('selected');
      if (modeMergeBtn) modeMergeBtn.classList.remove('selected');
    });
  }
  
  if (modeMergeBtn) {
    modeMergeBtn.addEventListener('click', function() {
      modeMergeBtn.classList.add('selected');
      if (modeSeparateBtn) modeSeparateBtn.classList.remove('selected');
    });
  }
  
  if (addPartBtn) {
    addPartBtn.addEventListener('click', function() {
      partCount++;
      const separateParts = document.getElementById('separateParts');
      if (!separateParts) return;
      
      const newPart = document.createElement('div');
      newPart.className = 'part-row';
      newPart.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;';
      newPart.innerHTML = `
        <input type="number" class="partEntry" placeholder="Entry" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="number" class="partSize" placeholder="Size" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="number" class="partTP" placeholder="TP" step="0.01" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
        <div style="display: flex; gap: 5px;">
          <input type="number" class="partSL" placeholder="SL" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <button class="remove-part" style="background: #e74c3c; color: white; border: none; width: 30px; border-radius: 6px; cursor: pointer;">×</button>
        </div>
      `;
      
      newPart.querySelector('.remove-part').addEventListener('click', () => {
        newPart.remove();
      });
      
      separateParts.appendChild(newPart);
    });
  }
});

// ========== ADVANCED STATISTICS ==========
// ===== FIXED: Added missing calculateAdvancedStats function =====

function calculateAdvancedStats() {
  if (trades.length === 0) return;
  
  // Sort trades by date for equity curve
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate equity curve
  let equity = [];
  let currentEquity = portfolioBalance;
  
  // Start from initial balance before first trade
  let initialBalance = portfolioBalance;
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    initialBalance -= sortedTrades[i].pnl;
  }
  
  currentEquity = initialBalance;
  equity.push({ date: null, equity: currentEquity });
  
  sortedTrades.forEach(trade => {
    currentEquity += trade.pnl;
    equity.push({ 
      date: trade.date, 
      equity: currentEquity,
      trade: trade 
    });
  });
  
  // Calculate drawdowns
  let peak = equity[0].equity;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let currentDrawdown = 0;
  let currentDrawdownPercent = 0;
  let peakEquity = peak;
  let peakDate = equity[0].date;
  
  equity.forEach(point => {
    if (point.equity > peak) {
      peak = point.equity;
      peakEquity = peak;
      peakDate = point.date;
    }
    
    const drawdown = peak - point.equity;
    const drawdownPercent = (drawdown / peak) * 100;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
    
    // Current drawdown (from latest point)
    if (point === equity[equity.length - 1]) {
      currentDrawdown = peak - point.equity;
      currentDrawdownPercent = (currentDrawdown / peak) * 100;
    }
  });
  
  // Calculate average RR
  let totalRR = 0;
  let rrCount = 0;
  
  trades.forEach(trade => {
    if (trade.sl && trade.entry && trade.exit) {
      const risk = Math.abs(trade.entry - trade.sl);
      const reward = Math.abs(trade.exit - trade.entry);
      if (risk > 0) {
        const rr = reward / risk;
        totalRR += rr;
        rrCount++;
      }
    }
  });
  
  const avgRR = rrCount > 0 ? (totalRR / rrCount).toFixed(2) : 0;
  
  // Calculate recovery factor
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const recoveryFactor = maxDrawdown > 0 ? (totalPnl / maxDrawdown).toFixed(2) : totalPnl > 0 ? 999 : 0;
  
  // Update DOM
  const avgRREl = document.getElementById('avgRR');
  const maxDrawdownEl = document.getElementById('maxDrawdown');
  const maxDrawdownPercentEl = document.getElementById('maxDrawdownPercent');
  const currentDrawdownEl = document.getElementById('currentDrawdown');
  const currentDrawdownPercentEl = document.getElementById('currentDrawdownPercent');
  const recoveryFactorEl = document.getElementById('recoveryFactor');
  
  if (avgRREl) {
    avgRREl.textContent = avgRR;
    // Color code based on value
    if (avgRR >= 2.0) avgRREl.style.color = '#2ecc71';
    else if (avgRR >= 1.5) avgRREl.style.color = '#f39c12';
    else if (avgRR >= 1.0) avgRREl.style.color = '#3498db';
    else avgRREl.style.color = '#e74c3c';
  }
  
  if (maxDrawdownEl) {
    maxDrawdownEl.textContent = formatCurrency(maxDrawdown);
    maxDrawdownEl.style.color = '#e74c3c';
  }
  
  if (maxDrawdownPercentEl) {
    maxDrawdownPercentEl.textContent = maxDrawdownPercent.toFixed(1) + '%';
  }
  
  if (currentDrawdownEl) {
    currentDrawdownEl.textContent = formatCurrency(currentDrawdown);
    currentDrawdownEl.style.color = currentDrawdown > 0 ? '#e74c3c' : '#2ecc71';
  }
  
  if (currentDrawdownPercentEl) {
    currentDrawdownPercentEl.textContent = currentDrawdownPercent.toFixed(1) + '% from peak';
  }
  
  if (recoveryFactorEl) {
    recoveryFactorEl.textContent = recoveryFactor;
    if (recoveryFactor >= 3.0) recoveryFactorEl.style.color = '#2ecc71';
    else if (recoveryFactor >= 2.0) recoveryFactorEl.style.color = '#f39c12';
    else if (recoveryFactor >= 1.0) recoveryFactorEl.style.color = '#3498db';
    else recoveryFactorEl.style.color = '#e74c3c';
  }
  
  // Store peak for reference
  localStorage.setItem('peakEquity', peakEquity);
  localStorage.setItem('peakDate', peakDate || '');
}

// ========== MINI CHARTS FOR STAT CARDS ==========

function initMiniCharts() {
  createWinRateDonut();
  createEquitySparkline();
  createTradesSparkline();
}

// Mini donut for win rate
function createWinRateDonut() {
  const canvas = document.getElementById('winRateDonut');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  const total = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  
  // Destroy existing chart if any
  if (window.winRateDonutChart) window.winRateDonutChart.destroy();
  
  window.winRateDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Wins', 'Losses'],
      datasets: [{
        data: [wins, losses],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 0,
        borderRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      elements: {
        arc: {
          borderWidth: 0
        }
      }
    }
  });
}

// Sparkline for equity (in Total P/L card)
function createEquitySparkline() {
  const canvas = document.getElementById('equitySparkline');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (trades.length === 0) {
    if (window.equitySparkChart) window.equitySparkChart.destroy();
    return;
  }
  
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate equity curve
  let equity = [];
  let currentEquity = portfolioBalance;
  
  // Calculate initial balance
  let initialBalance = portfolioBalance;
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    initialBalance -= sortedTrades[i].pnl;
  }
  
  currentEquity = initialBalance;
  equity.push(currentEquity);
  
  sortedTrades.forEach(trade => {
    currentEquity += trade.pnl;
    equity.push(currentEquity);
  });
  
  // Create gradient based on trend
  const gradient = ctx.createLinearGradient(0, 0, 0, 40);
  const lastEquity = equity[equity.length - 1];
  const firstEquity = equity[0];
  
  if (lastEquity >= firstEquity) {
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.1)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0.3)');
  } else {
    gradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
    gradient.addColorStop(1, 'rgba(231, 76, 60, 0.3)');
  }
  
  // Destroy existing chart
  if (window.equitySparkChart) window.equitySparkChart.destroy();
  
  window.equitySparkChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: equity.map((_, i) => i),
      datasets: [{
        data: equity,
        borderColor: lastEquity >= firstEquity ? '#2ecc71' : '#e74c3c',
        backgroundColor: gradient,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        line: {
          borderWidth: 2
        }
      }
    }
  });
}

// Bar sparkline for trades (in Total Trades card)
function createTradesSparkline() {
  const canvas = document.getElementById('tradesSparkline');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (trades.length === 0) {
    if (window.tradesSparkChart) window.tradesSparkChart.destroy();
    return;
  }
  
  // Group trades by day
  const tradesByDay = {};
  trades.forEach(trade => {
    const date = trade.date;
    if (!tradesByDay[date]) {
      tradesByDay[date] = { count: 0, pnl: 0 };
    }
    tradesByDay[date].count++;
    tradesByDay[date].pnl += trade.pnl;
  });
  
  // Get last 10 days
  const dates = Object.keys(tradesByDay).sort().slice(-10);
  const counts = dates.map(date => tradesByDay[date].count);
  const pnls = dates.map(date => tradesByDay[date].pnl);
  
  // Destroy existing chart
  if (window.tradesSparkChart) window.tradesSparkChart.destroy();
  
  window.tradesSparkChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        data: counts,
        backgroundColor: pnls.map(pnl => pnl >= 0 ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)'),
        borderRadius: 2,
        barPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

// Update all mini charts
function updateMiniCharts() {
  createWinRateDonut();
  createEquitySparkline();
  createTradesSparkline();
}

// Create larger visible donut for win rate
const winRateLargeCtx = document.getElementById('winRateDonutLarge')?.getContext('2d');
if (winRateLargeCtx) {
  // Get win rate from localStorage or use default
  const trades = JSON.parse(localStorage.getItem('trades') || '[]');
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const total = wins + losses;
  const winPercent = total > 0 ? Math.round((wins / total) * 100) : 0;
  
  // Update center text
  document.getElementById('donutCenterText').textContent = winPercent + '%';
  
  new Chart(winRateLargeCtx, {
    type: 'doughnut',
    data: {
      labels: ['Wins', 'Losses'],
      datasets: [{
        data: [wins || 1, losses || 1],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

// Keep the mini donut for consistency
const winRateMiniCtx = document.getElementById('winRateDonutMini')?.getContext('2d');
if (winRateMiniCtx) {
  const trades = JSON.parse(localStorage.getItem('trades') || '[]');
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  
  new Chart(winRateMiniCtx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [wins || 1, losses || 1],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: 'transparent',
        borderWidth: 0
      }]
    },
    options: {
      cutout: '60%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

// ========== MOBILE FIX FOR NAVIGATION ==========

// Update active state in bottom nav
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.sidebar a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
  
  // Add icons only for mobile (remove text)
  if (window.innerWidth <= 768) {
    navLinks.forEach(link => {
      const icon = link.querySelector('i');
      const text = link.textContent.trim();
      if (icon && text) {
        link.innerHTML = ''; // Clear
        link.appendChild(icon); // Add icon back
        link.innerHTML += `<span style="display: none;">${text}</span>`; // Hide text
      }
    });
  }
});

// ========== FINAL MOBILE MENU FIX ==========

// Run this immediately and after DOM loads
(function fixMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (!menuToggle || !sidebar) return;
  
  // Force menu to start CLOSED on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('menu-open');
    const icon = menuToggle.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-bars';
  }
  
  // Remove all existing event listeners by cloning
  const newToggle = menuToggle.cloneNode(true);
  menuToggle.parentNode.replaceChild(newToggle, menuToggle);
  
  // Add fresh event listener
  newToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    sidebar.classList.toggle('menu-open');
    
    const icon = this.querySelector('i');
    if (sidebar.classList.contains('menu-open')) {
      icon.className = 'fa-solid fa-times';
    } else {
      icon.className = 'fa-solid fa-bars';
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && !newToggle.contains(e.target)) {
      sidebar.classList.remove('menu-open');
      const icon = newToggle.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars';
    }
  });
  
  // Close when clicking links
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      sidebar.classList.remove('menu-open');
      const icon = newToggle.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars';
    });
  });
})();

// Also run on resize
window.addEventListener('resize', function() {
  const sidebar = document.querySelector('.sidebar');
  if (window.innerWidth > 768) {
    sidebar.classList.remove('menu-open');
  }
});

// ========== GOOGLE SHEETS DATABASE SYNC ==========

// Replace with your actual Google Sheets Web App URL
const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbz126pCssHclxtH-IVv8VNemo_S4cUJOYh4XdL6WQA3ebu3d4S2MefT_QDpgyiQji8K/exec";

// ========== LOAD TRADES FROM GOOGLE SHEETS ==========

async function loadTradesFromSheets() {
  try {
    showToast('Syncing data from cloud...', 'info', 2000);
    
    const response = await fetch(`${SHEETS_API_URL}?action=getTrades&t=${Date.now()}`);
    const data = await response.json();
    
    if (data.success) {
      // Merge with local trades (take the ones from server)
      const serverTrades = data.trades || [];
      
      if (serverTrades.length > 0) {
        trades = serverTrades;
        localStorage.setItem('trades', JSON.stringify(trades));
        console.log(`Loaded ${trades.length} trades from Google Sheets`);
      }
      
      // Update all displays
      calculateStats();
      renderTradeHistory();
      renderRecentTrades();
      renderCalendar();
      updateMiniCharts();
      
      return true;
    } else {
      console.error("Failed to load trades:", data.error);
      return false;
    }
  } catch (error) {
    console.error("Error loading trades:", error);
    return false;
  }
}

// ========== SAVE TRADES TO GOOGLE SHEETS ==========

async function saveTradesToSheets() {
  try {
    // Use no-cors mode to avoid CORS issues
    await fetch(SHEETS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'saveTrades',
        trades: JSON.stringify(trades)
      })
    });
    
    console.log("Trades saved to Google Sheets");
    return true;
  } catch (error) {
    console.error("Error saving trades:", error);
    return false;
  }
}

// ========== MODIFIED INIT FUNCTION ==========

// Save the original init function (use a unique name)
const originalInitFunction = init;

// Replace init with new version that loads from sheets first
init = async function() {
  // First try to load from Google Sheets
  await loadTradesFromSheets();
  
  // Then run original initialization
  originalInitFunction();
};

// ========== MODIFIED TRADE FORM SUBMIT ==========

// Store the form element
const tradeFormElement = document.getElementById('tradeForm');

if (tradeFormElement) {
  // Remove old listeners by cloning
  const newForm = tradeFormElement.cloneNode(true);
  tradeFormElement.parentNode.replaceChild(newForm, tradeFormElement);
  
  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTradeId').value;
    const date = document.getElementById('tradeDate').value;
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const direction = document.getElementById('directionLong').checked ? 'long' : 'short';
    const notes = document.getElementById('notes').value;
    
    let trade;
    let pnl;
    
    if (compoundEnabled) {
      const compoundData = getCompoundData();
      pnl = 0;
      
      trade = {
        id: id || Date.now(),
        date,
        symbol,
        direction,
        notes,
        compoundData,
        isCompound: true,
        timestamp: new Date().toISOString()
      };
      
      const exitPrice = parseFloat(document.getElementById('exitPrice')?.value);
      if (exitPrice) {
        trade.exit = exitPrice;
        trade.pnl = calculateCompoundPnL(trade, exitPrice);
      }
    } else {
      const size = parseFloat(document.getElementById('positionSize').value) || 1;
      const entry = parseFloat(document.getElementById('entryPrice').value);
      const exit = parseFloat(document.getElementById('exitPrice').value);
      const sl = document.getElementById('stopLoss').value ? parseFloat(document.getElementById('stopLoss').value) : null;
      const tp = document.getElementById('takeProfit').value ? parseFloat(document.getElementById('takeProfit').value) : null;
      const be = document.getElementById('breakeven').checked;
      pnl = parseFloat(document.getElementById('pnl').value);
      
      if (!date || !symbol || !entry || !exit) {
        showToast('Please fill in all required fields', 'warning');
        return;
      }
      
      trade = {
        id: id || Date.now(),
        date,
        symbol,
        direction,
        size,
        entry,
        exit,
        sl,
        tp,
        be,
        pnl,
        notes,
        screenshot: currentScreenshot || null,
        timestamp: new Date().toISOString()
      };
    }
    
    if (id) {
      const oldTrade = trades.find(t => t.id == id);
      if (oldTrade) {
        portfolioBalance -= oldTrade.pnl;
      }
      trades = trades.map(t => t.id == id ? trade : t);
    } else {
      trades.push(trade);
    }
    
    // Save locally
    localStorage.setItem('trades', JSON.stringify(trades));
    if (!id) updatePortfolioAfterTrade(pnl);
    
    // Save to Google Sheets
    await saveTradesToSheets();
    
    calculateStats();
    renderTradeHistory();
    renderRecentTrades();
    renderCalendar();
    
    closeModal();
    showSuccessMessage(id ? 'Trade updated!' : 'Trade added!');
  });
}

// ========== MODIFIED DELETE FUNCTION ==========

const confirmDeleteButton = document.getElementById('confirmDeleteBtn');

if (confirmDeleteButton) {
  // Remove old listeners
  const newConfirmBtn = confirmDeleteButton.cloneNode(true);
  confirmDeleteButton.parentNode.replaceChild(newConfirmBtn, confirmDeleteButton);
  
  newConfirmBtn.addEventListener('click', async function() {
    if (tradeToDelete) {
      const trade = trades.find(t => t.id == tradeToDelete);
      if (trade) {
        portfolioBalance -= trade.pnl;
        localStorage.setItem('portfolioBalance', portfolioBalance);
        updatePortfolioDisplay();
      }
      
      trades = trades.filter(t => t.id != tradeToDelete);
      
      // Save locally
      localStorage.setItem('trades', JSON.stringify(trades));
      
      // Save to Google Sheets
      await saveTradesToSheets();
      
      calculateStats();
      renderTradeHistory();
      renderRecentTrades();
      renderCalendar();
      
      deleteModal.classList.remove('active');
      tradeToDelete = null;
      showSuccessMessage('Trade deleted!');
    }
  });
}

// ========== AUTO-SYNC EVERY 30 SECONDS ==========

let changesMade = false;

// Track when changes are made by overriding array methods
const originalPush = Array.prototype.push;
trades.push = function(...items) {
  changesMade = true;
  return originalPush.call(this, ...items);
};

// Set up auto-sync interval
setInterval(async function() {
  if (changesMade) {
    await saveTradesToSheets();
    changesMade = false;
  }
}, 30000); // 30 seconds

// ===== FIX FOR DASHBOARD TRACKING =====
// This ensures all trade operations update the dashboard

// Override the trade saving function to force dashboard updates
const originalLocalStorageSet = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalLocalStorageSet.call(this, key, value);
    
    // If trades changed, trigger update on all pages
    if (key === 'trades') {
        // Dispatch storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'trades',
            newValue: value,
            url: window.location.href
        }));
        
        // Update current page if functions exist
        if (typeof calculateStats === 'function') calculateStats();
        if (typeof renderTradeHistory === 'function') renderTradeHistory();
        if (typeof renderRecentTrades === 'function') renderRecentTrades();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof updateMiniCharts === 'function') updateMiniCharts();
    }
    
    // If portfolio balance changed
    if (key === 'portfolioBalance') {
        if (typeof updatePortfolioDisplay === 'function') updatePortfolioDisplay();
    }
};

// Make sure calculateStats updates the dashboard elements
const originalCalculateStats = calculateStats;
calculateStats = function() {
    if (originalCalculateStats) originalCalculateStats();
    
    // Also update dashboard-specific elements
    const totalPnlEl = document.getElementById('totalPnl');
    const winRateEl = document.getElementById('winRate');
    const winPercentEl = document.getElementById('winPercent');
    const totalTradesEl = document.getElementById('totalTrades');
    
    if (trades && trades.length > 0) {
        const total = trades.length;
        const wins = trades.filter(t => t.pnl > 0).length;
        const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        const winRate = ((wins / total) * 100).toFixed(1);
        
        if (totalPnlEl) {
            totalPnlEl.textContent = formatCurrency(totalPnl);
            totalPnlEl.className = totalPnl >= 0 ? 'stat-value positive' : 'stat-value negative';
        }
        
        if (winRateEl) winRateEl.textContent = winRate + '%';
        if (winPercentEl) winPercentEl.textContent = winRate + '%';
        if (totalTradesEl) totalTradesEl.textContent = total;
    }
};