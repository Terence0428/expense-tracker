const API_URL = 'https://script.google.com/macros/s/AKfycbygnD_jJx1QjZBLdgqNNC32ouW1NHp59lvWZArHYJrnHBzAxnEjUdIqe29JzWz80Pd58Q/exec'; // <- 請替換成你自己的網址

// DOM 元素
const addBtn = document.getElementById('add-expense-btn');
const modal = document.getElementById('expense-modal');
const cancelBtn = document.getElementById('cancel-btn');
const expenseForm = document.getElementById('expense-form');
const summaryContent = document.getElementById('summary-content');

let calendar;
let editingRowIndex = null;

// 初始化月曆
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: [],
    eventClick: function(info) {
      const expense = info.event.extendedProps;
      editingRowIndex = expense.row;
      openModal(info.event.startStr, expense);
    }
  });
  calendar.render();
  loadExpenses();
  loadSummary();
});

// 載入支出資料
async function loadExpenses() {
  const res = await fetch(`${API_URL}?action=getExpenses`);
  const data = await res.json();
  calendar.getEvents().forEach(e => e.remove());

  data.forEach((e, index) => {
    calendar.addEvent({
      title: `${e.person}: $${e.amount}`,
      start: e.date,
      allDay: true,
      extendedProps: { ...e, row: index + 2 } // row 在 Google Sheet 從第2列起
    });
  });
}

// 載入統計摘要
async function loadSummary() {
  const res = await fetch(`${API_URL}?action=getExpenses`);
  const data = await res.json();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let startDate, endDate;
  if (now.getDate() < 5) {
    startDate = new Date(currentYear, currentMonth - 1, 5);
    endDate = new Date(currentYear, currentMonth, 4);
  } else {
    startDate = new Date(currentYear, currentMonth, 5);
    endDate = new Date(currentYear, currentMonth + 1, 4);
  }

  let terenceTotal = 0, ritaTotal = 0;
  data.forEach((e) => {
    const d = new Date(e.date);
    if (d >= startDate && d <= endDate) {
      if (e.person === 'Terence') terenceTotal += parseFloat(e.amount);
      if (e.person === 'Rita') ritaTotal += parseFloat(e.amount);
    }
  });

  const total = terenceTotal + ritaTotal;
  const average = total / 2;
  const tDiff = average - terenceTotal;
  const rDiff = average - ritaTotal;

  summaryContent.innerHTML = `
    <p>統計期間：${startDate.toLocaleDateString()} ～ ${endDate.toLocaleDateString()}</p>
    <p>Terence：$${terenceTotal.toFixed(0)}</p>
    <p>Rita：$${ritaTotal.toFixed(0)}</p>
    <p>平均：$${average.toFixed(0)}</p>
    <p>補差：${tDiff > 0 ? `Terence 補 $${tDiff.toFixed(0)}` : rDiff > 0 ? `Rita 補 $${rDiff.toFixed(0)}` : '平衡'}</p>
  `;
}

// 打開新增/編輯視窗
function openModal(dateStr, expense = null) {
  modal.style.display = 'block';
  document.getElementById('expense-date').value = dateStr || '';
  document.getElementById('expense-person').value = expense?.person || 'Terence';
  document.getElementById('expense-amount').value = expense?.amount || '';
  document.getElementById('expense-note').value = expense?.note || '';
}

// 關閉
cancelBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  editingRowIndex = null;
});

// 提交表單
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('expense-date').value;
  const person = document.getElementById('expense-person').value;
  const amount = document.getElementById('expense-amount').value;
  const note = document.getElementById('expense-note').value;

  if (editingRowIndex) {
    await fetch(`${API_URL}?action=updateExpense&row=${editingRowIndex}&date=${date}&person=${person}&amount=${amount}&note=${note}`);
    editingRowIndex = null;
  } else {
    await fetch(`${API_URL}?action=addExpense&date=${date}&person=${person}&amount=${amount}&note=${note}`);
  }

  modal.style.display = 'none';
  await loadExpenses();
  await loadSummary();
});
