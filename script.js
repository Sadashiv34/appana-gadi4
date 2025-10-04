// Constants for element IDs and classes
const ELEMENT_IDS = {
    AUTH_CONTAINER: 'auth-container',
    LOGIN_BTN: 'login-btn',
    SIGNUP_BTN: 'signup-btn',
    SHOW_SIGNUP: 'show-signup',
    SHOW_LOGIN: 'show-login',
    SIGNOUT_BTN: 'signout-btn',
    LOGIN_EMAIL: 'login-email',
    LOGIN_PASSWORD: 'login-password',
    SIGNUP_EMAIL: 'signup-email',
    SIGNUP_PASSWORD: 'signup-password',
    LOGIN_FORM: 'login-form',
    SIGNUP_FORM: 'signup-form',
    ADD_TRANSACTION_BTN: 'add-transaction-btn',
    TRANSACTION_FORM: 'transaction-form',
    ADD_FORM: 'add-form',
    CANCEL_BTN: 'cancel-btn',
    TABLE_BODY: 'table-body',
    ADD_EXPENSE_BTN: 'add-expense-btn',
    EXPENSE_FORM: 'expense-form',
    ADD_EXPENSE_FORM: 'add-expense-form',
    CANCEL_EXPENSE_BTN: 'cancel-expense-btn',
    EXPENSE_TABLE_BODY: 'expense-table-body',
    STATEMENT_SELECT: 'statement-select',
    STATEMENT_DISPLAY: 'statement-display',
    STATEMENT_TITLE: 'statement-title',
    STATEMENT_CONTENT: 'statement-content',
    EDIT_MODAL: 'edit-modal',
    EDIT_FORM: 'edit-form',
    EDIT_DATE: 'edit-date',
    EDIT_NAME: 'edit-name',
    EDIT_UNIT: 'edit-unit',
    EDIT_VALUE: 'edit-value',
    EDIT_AMOUNT: 'edit-amount',
    EDIT_STATUS: 'edit-status',
    EDIT_DESCRIPTION: 'edit-description',
    DATE: 'date',
    NAME: 'name',
    UNIT: 'unit',
    VALUE: 'value',
    AMOUNT: 'amount',
    STATUS: 'status',
    EXPENSE_DATE: 'expense-date',
    EXPENSE_DESCRIPTION: 'expense-description',
    EXPENSE_AMOUNT: 'expense-amount',
    PROFILE_CONTAINER: 'profile-container',
    PROFILE_DROPDOWN: 'profile-dropdown',
    LOGOUT_BTN: 'logout-btn'
};

const CLASSES = {
    AMOUNT: 'amount',
    NAV_ICON: 'nav-icon',
    STATUS: 'status',
    EDIT_BTN: 'edit-btn',
    DELETE_BTN: 'delete-btn',
    CLOSE: 'close',
    CONTAINER: 'container'
};

const COLLECTION_NAME = 'apna gadi 2';

// Global state
let currentUser = null;
let transactions = [];
let expenses = [];

// Cached elements
const elements = {};

function cacheElements() {
    Object.values(ELEMENT_IDS).forEach(id => {
        elements[id] = document.getElementById(id);
    });
    elements.amounts = document.querySelectorAll(`.${CLASSES.AMOUNT}`);
    elements.navIcons = document.querySelectorAll(`.${CLASSES.NAV_ICON}`);
    elements.contentSections = document.querySelectorAll('#content-area > div');
    elements.closeBtn = document.getElementsByClassName(CLASSES.CLOSE)[0];
    elements.container = document.querySelector(`.${CLASSES.CONTAINER}`);
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        cacheElements();
        initializeAuth();
        initializeNavigation();
        initializeTransactionHandlers();
        initializeExpenseHandlers();
        initializeMenuHandlers();
        initializeEditModal();
        initializeDailyRefresh();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('An error occurred during initialization. Please refresh the page.');
    }
});

// Authentication functions
function initializeAuth() {
    window.onAuthStateChanged(window.auth, (user) => {
        currentUser = user;
        if (user) {
            elements[ELEMENT_IDS.AUTH_CONTAINER].style.display = 'none';
            elements.container.style.display = 'block';
            loadData();
        } else {
            elements[ELEMENT_IDS.AUTH_CONTAINER].style.display = 'block';
            elements.container.style.display = 'none';
        }
    });

    elements[ELEMENT_IDS.SHOW_SIGNUP].addEventListener('click', () => {
        elements[ELEMENT_IDS.LOGIN_FORM].style.display = 'none';
        elements[ELEMENT_IDS.SIGNUP_FORM].style.display = 'block';
    });

    elements[ELEMENT_IDS.SHOW_LOGIN].addEventListener('click', () => {
        elements[ELEMENT_IDS.SIGNUP_FORM].style.display = 'none';
        elements[ELEMENT_IDS.LOGIN_FORM].style.display = 'block';
    });

    elements[ELEMENT_IDS.LOGIN_BTN].addEventListener('click', async () => {
        const email = elements[ELEMENT_IDS.LOGIN_EMAIL].value.trim();
        const password = elements[ELEMENT_IDS.LOGIN_PASSWORD].value;

        if (!validateEmail(email) || !password) {
            alert('Please enter a valid email and password.');
            return;
        }

        try {
            await window.signInWithEmailAndPassword(window.auth, email, password);
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        }
    });

    elements[ELEMENT_IDS.SIGNUP_BTN].addEventListener('click', async () => {
        const email = elements[ELEMENT_IDS.SIGNUP_EMAIL].value.trim();
        const password = elements[ELEMENT_IDS.SIGNUP_PASSWORD].value;

        if (!validateEmail(email) || password.length < 6) {
            alert('Please enter a valid email and a password with at least 6 characters.');
            return;
        }

        try {
            await window.createUserWithEmailAndPassword(window.auth, email, password);
        } catch (error) {
            alert(`Signup failed: ${error.message}`);
        }
    });

    elements[ELEMENT_IDS.PROFILE_CONTAINER].addEventListener('click', () => {
        const dropdown = elements[ELEMENT_IDS.PROFILE_DROPDOWN];
        dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
    });

    elements[ELEMENT_IDS.LOGOUT_BTN].addEventListener('click', async () => {
        try {
            await window.signOut(window.auth);
            elements[ELEMENT_IDS.PROFILE_DROPDOWN].style.display = 'none';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    });

    // Hide dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!elements[ELEMENT_IDS.PROFILE_CONTAINER].contains(e.target) && !elements[ELEMENT_IDS.PROFILE_DROPDOWN].contains(e.target)) {
            elements[ELEMENT_IDS.PROFILE_DROPDOWN].style.display = 'none';
        }
    });
}

// Data loading
async function loadData() {
    if (!currentUser) return;

    try {
        const ref = window.collection(window.db, COLLECTION_NAME);
        window.onSnapshot(ref, (snapshot) => {
            const allData = snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
            transactions = allData.filter(d => d.type === 'transaction' && d.userId === currentUser.uid);
            expenses = allData.filter(d => d.type === 'expense' && d.userId === currentUser.uid);
            renderTransactions();
            renderExpenses();
            updateColumns();
        });
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again.');
    }
}

// Update columns
function updateColumns() {
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = transactions.filter(t => t.status === 'paid' && t.date === today).reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPaidTransactions = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0);
    const companyTotal = totalPaidTransactions - totalExpenses;

    elements.amounts[0].textContent = `₹${todayRevenue.toFixed(2)}`;
    elements.amounts[1].textContent = `₹${pendingAmount.toFixed(2)}`;
    elements.amounts[2].textContent = `₹${companyTotal.toFixed(2)}`;
}

// Navigation
function initializeNavigation() {
    elements.navIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            elements.navIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const section = this.id;
            elements.contentSections.forEach(content => {
                content.style.display = content.id === section + '-content' ? 'block' : 'none';
            });
        });
    });
}

// Transaction handlers
function initializeTransactionHandlers() {
    elements[ELEMENT_IDS.ADD_TRANSACTION_BTN].addEventListener('click', () => {
        elements[ELEMENT_IDS.TRANSACTION_FORM].style.display = 'block';
    });

    elements[ELEMENT_IDS.CANCEL_BTN].addEventListener('click', () => {
        elements[ELEMENT_IDS.TRANSACTION_FORM].style.display = 'none';
    });

    elements[ELEMENT_IDS.ADD_FORM].addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = getTransactionFormData();
        if (!validateTransactionData(formData)) return;

        try {
            const ref = window.collection(window.db, COLLECTION_NAME);
            await window.addDoc(ref, { type: 'transaction', userId: currentUser.uid, ...formData });
            elements[ELEMENT_IDS.ADD_FORM].reset();
            elements[ELEMENT_IDS.TRANSACTION_FORM].style.display = 'none';
        } catch (error) {
            alert(`Failed to add transaction: ${error.message}`);
        }
    });

    elements[ELEMENT_IDS.TABLE_BODY].addEventListener('click', handleTransactionTableClick);
}

function getTransactionFormData() {
    return {
        date: elements[ELEMENT_IDS.DATE].value,
        name: elements[ELEMENT_IDS.NAME].value.trim(),
        unit: elements[ELEMENT_IDS.UNIT].value,
        value: parseFloat(elements[ELEMENT_IDS.VALUE].value),
        amount: parseFloat(elements[ELEMENT_IDS.AMOUNT].value),
        status: elements[ELEMENT_IDS.STATUS].value
    };
}

function validateTransactionData(data) {
    if (!data.date || !data.name || !data.unit || isNaN(data.value) || data.value < 0 || isNaN(data.amount) || data.amount <= 0) {
        alert('Please fill all fields with valid data.');
        return false;
    }
    return true;
}

function renderTransactions() {
    const fragment = document.createDocumentFragment();
    transactions.forEach(t => {
        const formattedValue = t.unit === 'hours' ? `${t.value}hr` : `${t.value}D`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(t.date)}</td>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(formattedValue)}</td>
            <td>₹${(t.amount || 0).toFixed(2)}</td>
            <td class="${CLASSES.STATUS}" data-key="${t.key}" data-status="${t.status}">${escapeHtml(t.status)}</td>
            <td><button class="${CLASSES.EDIT_BTN}" data-key="${t.key}" data-type="transaction">Edit</button> <button class="${CLASSES.DELETE_BTN}" data-key="${t.key}">Delete</button></td>
        `;
        fragment.appendChild(row);
    });
    elements[ELEMENT_IDS.TABLE_BODY].innerHTML = '';
    elements[ELEMENT_IDS.TABLE_BODY].appendChild(fragment);
}

async function handleTransactionTableClick(e) {
    const target = e.target;
    const key = target.dataset.key;

    if (target.classList.contains(CLASSES.STATUS)) {
        const transaction = transactions.find(t => t.key === key);
        if (!transaction) return;
        const newStatus = transaction.status === 'pending' ? 'paid' : 'pending';
        try {
            const docRef = window.doc(window.db, COLLECTION_NAME, key);
            await window.updateDoc(docRef, { status: newStatus });
            updateColumns();
        } catch (error) {
            alert(`Failed to update status: ${error.message}`);
        }
    } else if (target.classList.contains(CLASSES.DELETE_BTN)) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                const docRef = window.doc(window.db, COLLECTION_NAME, key);
                await window.deleteDoc(docRef);
            } catch (error) {
                alert(`Failed to delete transaction: ${error.message}`);
            }
        }
    } else if (target.classList.contains(CLASSES.EDIT_BTN)) {
        openEditModal(key, target.dataset.type);
    }
}

// Expense handlers
function initializeExpenseHandlers() {
    elements[ELEMENT_IDS.ADD_EXPENSE_BTN].addEventListener('click', () => {
        elements[ELEMENT_IDS.EXPENSE_FORM].style.display = 'block';
    });

    elements[ELEMENT_IDS.CANCEL_EXPENSE_BTN].addEventListener('click', () => {
        elements[ELEMENT_IDS.EXPENSE_FORM].style.display = 'none';
    });

    elements[ELEMENT_IDS.ADD_EXPENSE_FORM].addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = getExpenseFormData();
        if (!validateExpenseData(formData)) return;

        try {
            const ref = window.collection(window.db, COLLECTION_NAME);
            await window.addDoc(ref, { type: 'expense', userId: currentUser.uid, ...formData });
            elements[ELEMENT_IDS.ADD_EXPENSE_FORM].reset();
            elements[ELEMENT_IDS.EXPENSE_FORM].style.display = 'none';
        } catch (error) {
            alert(`Failed to add expense: ${error.message}`);
        }
    });

    elements[ELEMENT_IDS.EXPENSE_TABLE_BODY].addEventListener('click', handleExpenseTableClick);
}

function getExpenseFormData() {
    return {
        date: elements[ELEMENT_IDS.EXPENSE_DATE].value,
        description: elements[ELEMENT_IDS.EXPENSE_DESCRIPTION].value.trim(),
        amount: parseFloat(elements[ELEMENT_IDS.EXPENSE_AMOUNT].value)
    };
}

function validateExpenseData(data) {
    if (!data.date || !data.description || isNaN(data.amount) || data.amount <= 0) {
        alert('Please fill all fields with valid data.');
        return false;
    }
    return true;
}

function renderExpenses() {
    const fragment = document.createDocumentFragment();
    expenses.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(exp.date)}</td>
            <td>${escapeHtml(exp.description)}</td>
            <td>₹${(exp.amount || 0).toFixed(2)}</td>
            <td><button class="${CLASSES.EDIT_BTN}" data-key="${exp.key}" data-type="expense">Edit</button> <button class="${CLASSES.DELETE_BTN}" data-key="${exp.key}">Delete</button></td>
        `;
        fragment.appendChild(row);
    });
    elements[ELEMENT_IDS.EXPENSE_TABLE_BODY].innerHTML = '';
    elements[ELEMENT_IDS.EXPENSE_TABLE_BODY].appendChild(fragment);
}

async function handleExpenseTableClick(e) {
    const target = e.target;
    const key = target.dataset.key;

    if (target.classList.contains(CLASSES.DELETE_BTN)) {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                const docRef = window.doc(window.db, COLLECTION_NAME, key);
                await window.deleteDoc(docRef);
            } catch (error) {
                alert(`Failed to delete expense: ${error.message}`);
            }
        }
    } else if (target.classList.contains(CLASSES.EDIT_BTN)) {
        openEditModal(key, target.dataset.type);
    }
}

// Edit modal
function initializeEditModal() {
    elements.closeBtn.onclick = () => {
        elements[ELEMENT_IDS.EDIT_MODAL].style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === elements[ELEMENT_IDS.EDIT_MODAL]) {
            elements[ELEMENT_IDS.EDIT_MODAL].style.display = 'none';
        }
    };
}

function openEditModal(key, type) {
    const item = [...transactions, ...expenses].find(i => i.key === key);
    if (!item) return;

    // Hide all fields
    document.querySelectorAll('#edit-form label, #edit-form input, #edit-form select').forEach(el => el.style.display = 'none');

    // Show relevant fields
    if (type === 'transaction') {
        showEditFields(['edit-date', 'edit-name', 'edit-unit', 'edit-value', 'edit-amount', 'edit-status']);
        elements[ELEMENT_IDS.EDIT_DATE].value = item.date;
        elements[ELEMENT_IDS.EDIT_NAME].value = item.name;
        elements[ELEMENT_IDS.EDIT_UNIT].value = item.unit;
        elements[ELEMENT_IDS.EDIT_VALUE].value = item.value;
        elements[ELEMENT_IDS.EDIT_AMOUNT].value = item.amount;
        elements[ELEMENT_IDS.EDIT_STATUS].value = item.status;
    } else if (type === 'expense') {
        showEditFields(['edit-date', 'edit-description', 'edit-amount']);
        elements[ELEMENT_IDS.EDIT_DATE].value = item.date;
        elements[ELEMENT_IDS.EDIT_DESCRIPTION].value = item.description;
        elements[ELEMENT_IDS.EDIT_AMOUNT].value = item.amount;
    }

    elements[ELEMENT_IDS.EDIT_FORM].onsubmit = async (e) => {
        e.preventDefault();
        const updatedData = { type, userId: currentUser.uid };
        if (type === 'transaction') {
            updatedData.date = elements[ELEMENT_IDS.EDIT_DATE].value;
            updatedData.name = elements[ELEMENT_IDS.EDIT_NAME].value.trim();
            updatedData.unit = elements[ELEMENT_IDS.EDIT_UNIT].value;
            updatedData.value = parseFloat(elements[ELEMENT_IDS.EDIT_VALUE].value);
            updatedData.amount = parseFloat(elements[ELEMENT_IDS.EDIT_AMOUNT].value);
            updatedData.status = elements[ELEMENT_IDS.EDIT_STATUS].value;
            if (!validateTransactionData(updatedData)) return;
        } else if (type === 'expense') {
            updatedData.date = elements[ELEMENT_IDS.EDIT_DATE].value;
            updatedData.description = elements[ELEMENT_IDS.EDIT_DESCRIPTION].value.trim();
            updatedData.amount = parseFloat(elements[ELEMENT_IDS.EDIT_AMOUNT].value);
            if (!validateExpenseData(updatedData)) return;
        }

        try {
            const docRef = window.doc(window.db, COLLECTION_NAME, key);
            await window.updateDoc(docRef, updatedData);
            elements[ELEMENT_IDS.EDIT_MODAL].style.display = 'none';
        } catch (error) {
            alert(`Failed to update item: ${error.message}`);
        }
    };

    elements[ELEMENT_IDS.EDIT_MODAL].style.display = 'block';
}

function showEditFields(fields) {
    fields.forEach(field => {
        const label = document.querySelector(`label[for="${field}"]`);
        const input = document.getElementById(field);
        if (label) label.style.display = 'block';
        if (input) input.style.display = 'block';
    });
}

// Menu handlers
function initializeMenuHandlers() {
    elements[ELEMENT_IDS.STATEMENT_SELECT].addEventListener('change', function() {
        const value = this.value;
        if (value) {
            elements[ELEMENT_IDS.STATEMENT_DISPLAY].style.display = 'block';
            elements[ELEMENT_IDS.STATEMENT_DISPLAY].classList.add('show');
            elements[ELEMENT_IDS.STATEMENT_TITLE].textContent = value === 'weekly' ? 'Weekly Statement' : 'Monthly Statement';
            renderStatement(value);
        } else {
            elements[ELEMENT_IDS.STATEMENT_DISPLAY].classList.remove('show');
            setTimeout(() => {
                elements[ELEMENT_IDS.STATEMENT_DISPLAY].style.display = 'none';
            }, 500); // Match transition duration
        }
    });
}

function renderStatement(type) {
    const now = new Date();
    const startDate = new Date(now);
    if (type === 'weekly') {
        startDate.setDate(now.getDate() - 7);
    } else {
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date) >= startDate);

    const revenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    elements[ELEMENT_IDS.STATEMENT_CONTENT].innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Revenue</td>
                    <td>₹${revenue.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Expenses</td>
                    <td>₹${totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Net</td>
                    <td>₹${(revenue - totalExpenses).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Daily refresh mechanism
function initializeDailyRefresh() {
    let currentDate = new Date().toISOString().split('T')[0];

    // Check every minute for date change
    setInterval(() => {
        const newDate = new Date().toISOString().split('T')[0];
        if (newDate !== currentDate) {
            currentDate = newDate;
            updateColumns(); // Refresh today's revenue
        }
    }, 60000); // 60 seconds
}