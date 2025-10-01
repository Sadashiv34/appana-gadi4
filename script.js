document.addEventListener('DOMContentLoaded', function() {
    // Firebase Auth
    let currentUser = null;
    window.onAuthStateChanged(window.auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('auth-container').style.display = 'none';
            document.querySelector('.container').style.display = 'block';
            loadData();
        } else {
            currentUser = null;
            document.getElementById('auth-container').style.display = 'block';
            document.querySelector('.container').style.display = 'none';
        }
    });

    // Auth elements
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const signoutBtn = document.getElementById('signout-btn');

    showSignup.addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });

    showLogin.addEventListener('click', () => {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        window.signInWithEmailAndPassword(window.auth, email, password)
            .then(() => {
                // Signed in
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        window.createUserWithEmailAndPassword(window.auth, email, password)
            .then(() => {
                // Signed up
            })
            .catch((error) => {
                alert(error.message);
            });
    });

    signoutBtn.addEventListener('click', () => {
        window.signOut(window.auth);
    });

    // Data storage
    let transactions = [];
    let expenses = [];
    let loans = [];

    function loadData() {
        if (!currentUser) return;
        const ref = window.collection(window.db, 'apna gadi 2');
        window.onSnapshot(ref, (snapshot) => {
            const allData = snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
            transactions = allData.filter(d => d.type === 'transaction' && d.userId === currentUser.uid);
            expenses = allData.filter(d => d.type === 'expense' && d.userId === currentUser.uid);
            loans = allData.filter(d => d.type === 'loan' && d.userId === currentUser.uid);
            renderTransactions();
            renderExpenses();
            renderLoans();
            updateColumns();
            updatePaymentSelect();
        });
    }

    // Update columns
    function updateColumns() {
        const today = new Date().toISOString().split('T')[0];
        const todayRevenue = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
        const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalLoansTaken = loans.reduce((sum, l) => sum + l.taken, 0);
        const totalLoanPayments = loans.reduce((sum, l) => sum + l.paid, 0);
        const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
        const companyTotal = totalTransactions + totalLoanPayments - totalExpenses - totalLoansTaken;

        document.querySelectorAll('.amount')[0].textContent = `$${todayRevenue.toFixed(2)}`;
        document.querySelectorAll('.amount')[1].textContent = `$${pendingAmount.toFixed(2)}`;
        document.querySelectorAll('.amount')[2].textContent = `$${companyTotal.toFixed(2)}`;
    }

    // Elements
    const navIcons = document.querySelectorAll('.nav-icon');
    const contentSections = document.querySelectorAll('#content-area > div');

    // Home elements
    const addBtn = document.getElementById('add-transaction-btn');
    const form = document.getElementById('transaction-form');
    const addForm = document.getElementById('add-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const tableBody = document.getElementById('table-body');

    // Expenses elements
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseForm = document.getElementById('expense-form');
    const addExpenseForm = document.getElementById('add-expense-form');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const expenseTableBody = document.getElementById('expense-table-body');

    // Loans elements
    const addLoanBtn = document.getElementById('add-loan-btn');
    const loanForm = document.getElementById('loan-form');
    const addLoanForm = document.getElementById('add-loan-form');
    const cancelLoanBtn = document.getElementById('cancel-loan-btn');
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const paymentForm = document.getElementById('payment-form');
    const addPaymentForm = document.getElementById('add-payment-form');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const loanTableBody = document.getElementById('loan-table-body');
    const paymentNameSelect = document.getElementById('payment-name');

    // Menu elements
    const statementSelect = document.getElementById('statement-select');
    const statementDisplay = document.getElementById('statement-display');
    const statementTitle = document.getElementById('statement-title');
    const statementContent = document.getElementById('statement-content');

    // Navigation
    navIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            navIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const section = this.id;
            contentSections.forEach(content => {
                content.style.display = content.id === section + '-content' ? 'block' : 'none';
            });
        });
    });

    // Home functionality
    addBtn.addEventListener('click', function() {
        form.style.display = 'block';
    });

    cancelBtn.addEventListener('click', function() {
        form.style.display = 'none';
    });

    addForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const name = document.getElementById('name').value;
        const hour = document.getElementById('hour').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const status = document.getElementById('status').value;

        const ref = window.collection(window.db, 'apna gadi 2');
        window.addDoc(ref, { type: 'transaction', userId: currentUser.uid, date, name, hour, amount, status });

        addForm.reset();
        form.style.display = 'none';
    });

    function renderTransactions() {
        tableBody.innerHTML = '';
        transactions.forEach((t) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.date}</td>
                <td>${t.name}</td>
                <td>${t.hour}</td>
                <td>$${t.amount.toFixed(2)}</td>
                <td class="status" data-key="${t.key}" data-status="${t.status}">${t.status}</td>
                <td><button class="edit-btn" data-key="${t.key}" data-type="transaction">Edit</button> <button class="delete-btn" data-key="${t.key}">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    tableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('status')) {
            const key = e.target.dataset.key;
            const transaction = transactions.find(t => t.key === key);
            const newStatus = transaction.status === 'pending' ? 'paid' : 'pending';
            const docRef = window.doc(window.db, 'apna gadi 2', key);
            window.updateDoc(docRef, { status: newStatus }).then(() => {
                updateColumns();
            });
        } else if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            const docRef = window.doc(window.db, 'apna gadi 2', key);
            window.deleteDoc(docRef);
        } else if (e.target.classList.contains('edit-btn')) {
            const key = e.target.dataset.key;
            const type = e.target.dataset.type;
            openEditModal(key, type);
        }
    });

    expenseTableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            const docRef = window.doc(window.db, 'apna gadi 2', key);
            window.deleteDoc(docRef);
        } else if (e.target.classList.contains('edit-btn')) {
            const key = e.target.dataset.key;
            const type = e.target.dataset.type;
            openEditModal(key, type);
        }
    });

    loanTableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            const docRef = window.doc(window.db, 'apna gadi 2', key);
            window.deleteDoc(docRef);
        } else if (e.target.classList.contains('edit-btn')) {
            const key = e.target.dataset.key;
            const type = e.target.dataset.type;
            openEditModal(key, type);
        }
    });

    // Edit modal
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const closeBtn = document.getElementsByClassName('close')[0];

    closeBtn.onclick = function() {
        editModal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    }

    function openEditModal(key, type) {
        const item = [...transactions, ...expenses, ...loans].find(i => i.key === key);
        if (!item) return;

        // Hide all fields
        document.querySelectorAll('#edit-form label, #edit-form input, #edit-form select').forEach(el => el.style.display = 'none');

        // Show relevant fields
        if (type === 'transaction') {
            document.querySelector('label[for="edit-date"]').style.display = 'block';
            document.getElementById('edit-date').style.display = 'block';
            document.querySelector('label[for="edit-name"]').style.display = 'block';
            document.getElementById('edit-name').style.display = 'block';
            document.querySelector('label[for="edit-hour"]').style.display = 'block';
            document.getElementById('edit-hour').style.display = 'block';
            document.querySelector('label[for="edit-amount"]').style.display = 'block';
            document.getElementById('edit-amount').style.display = 'block';
            document.querySelector('label[for="edit-status"]').style.display = 'block';
            document.getElementById('edit-status').style.display = 'block';

            document.getElementById('edit-date').value = item.date;
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-hour').value = item.hour;
            document.getElementById('edit-amount').value = item.amount;
            document.getElementById('edit-status').value = item.status;
        } else if (type === 'expense') {
            document.querySelector('label[for="edit-date"]').style.display = 'block';
            document.getElementById('edit-date').style.display = 'block';
            document.querySelector('label[for="edit-description"]').style.display = 'block';
            document.getElementById('edit-description').style.display = 'block';
            document.querySelector('label[for="edit-amount"]').style.display = 'block';
            document.getElementById('edit-amount').style.display = 'block';

            document.getElementById('edit-date').value = item.date;
            document.getElementById('edit-description').value = item.description;
            document.getElementById('edit-amount').value = item.amount;
        } else if (type === 'loan') {
            document.querySelector('label[for="edit-name"]').style.display = 'block';
            document.getElementById('edit-name').style.display = 'block';
            document.querySelector('label[for="edit-amount"]').style.display = 'block';
            document.getElementById('edit-amount').style.display = 'block';

            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-amount').value = item.taken;
        }

        editForm.onsubmit = function(e) {
            e.preventDefault();
            const updatedData = { type, userId: currentUser.uid };
            if (type === 'transaction') {
                updatedData.date = document.getElementById('edit-date').value;
                updatedData.name = document.getElementById('edit-name').value;
                updatedData.hour = document.getElementById('edit-hour').value;
                updatedData.amount = parseFloat(document.getElementById('edit-amount').value);
                updatedData.status = document.getElementById('edit-status').value;
            } else if (type === 'expense') {
                updatedData.date = document.getElementById('edit-date').value;
                updatedData.description = document.getElementById('edit-description').value;
                updatedData.amount = parseFloat(document.getElementById('edit-amount').value);
            } else if (type === 'loan') {
                updatedData.name = document.getElementById('edit-name').value;
                updatedData.taken = parseFloat(document.getElementById('edit-amount').value);
                updatedData.paid = item.paid;
                updatedData.payments = item.payments;
                updatedData.pending = updatedData.taken - updatedData.paid;
            }

            const docRef = window.doc(window.db, 'apna gadi 2', key);
            window.updateDoc(docRef, updatedData);
            editModal.style.display = 'none';
        };

        editModal.style.display = 'block';
    }

    // Expenses functionality
    addExpenseBtn.addEventListener('click', function() {
        expenseForm.style.display = 'block';
    });

    cancelExpenseBtn.addEventListener('click', function() {
        expenseForm.style.display = 'none';
    });

    addExpenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);

        const ref = window.collection(window.db, 'apna gadi 2');
        window.addDoc(ref, { type: 'expense', userId: currentUser.uid, date, description, amount });

        addExpenseForm.reset();
        expenseForm.style.display = 'none';
    });

    function renderExpenses() {
        expenseTableBody.innerHTML = '';
        expenses.forEach(exp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exp.date}</td>
                <td>${exp.description}</td>
                <td>$${exp.amount.toFixed(2)}</td>
                <td><button class="edit-btn" data-key="${exp.key}" data-type="expense">Edit</button> <button class="delete-btn" data-key="${exp.key}">Delete</button></td>
            `;
            expenseTableBody.appendChild(row);
        });
    }

    // Loans functionality
    addLoanBtn.addEventListener('click', function() {
        loanForm.style.display = 'block';
    });

    cancelLoanBtn.addEventListener('click', function() {
        loanForm.style.display = 'none';
    });

    addLoanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('loan-name').value;
        const amount = parseFloat(document.getElementById('loan-amount').value);

        const ref = window.collection(window.db, 'apna gadi 2');
        window.addDoc(ref, { type: 'loan', userId: currentUser.uid, name, taken: amount, paid: 0, payments: [], pending: amount });

        addLoanForm.reset();
        loanForm.style.display = 'none';
    });

    addPaymentBtn.addEventListener('click', function() {
        paymentForm.style.display = 'block';
    });

    cancelPaymentBtn.addEventListener('click', function() {
        paymentForm.style.display = 'none';
    });

    addPaymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('payment-name').value;
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;

        const loan = loans.find(l => l.name === name);
        if (loan) {
            const updatedLoan = {
                ...loan,
                paid: loan.paid + amount,
                pending: loan.pending - amount,
                payments: [...loan.payments, { amount, date }]
            };
            const docRef = window.doc(window.db, 'apna gadi 2', loan.key);
            window.updateDoc(docRef, updatedLoan);
        }

        addPaymentForm.reset();
        paymentForm.style.display = 'none';
    });

    function renderLoans() {
        loanTableBody.innerHTML = '';
        loans.forEach(loan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.name}</td>
                <td>$${loan.taken.toFixed(2)}</td>
                <td>$${loan.paid.toFixed(2)}</td>
                <td>${loan.payments.map(p => p.date).join(', ')}</td>
                <td>$${loan.pending.toFixed(2)}</td>
                <td><button class="edit-btn" data-key="${loan.key}" data-type="loan">Edit</button> <button class="delete-btn" data-key="${loan.key}">Delete</button></td>
            `;
            loanTableBody.appendChild(row);
        });
    }

    function updatePaymentSelect() {
        paymentNameSelect.innerHTML = '<option value="">Select Loan</option>';
        loans.forEach(loan => {
            const option = document.createElement('option');
            option.value = loan.name;
            option.textContent = loan.name;
            paymentNameSelect.appendChild(option);
        });
    }

    // Menu functionality
    statementSelect.addEventListener('change', function() {
        const value = this.value;
        if (value) {
            statementDisplay.style.display = 'block';
            statementTitle.textContent = value === 'weekly' ? 'Weekly Statement' : 'Monthly Statement';
            renderStatement(value);
        } else {
            statementDisplay.style.display = 'none';
        }
    });

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
        const filteredLoans = loans.filter(l => l.payments.some(p => new Date(p.date) >= startDate));

        const revenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalLoans = filteredLoans.reduce((sum, l) => sum + l.taken, 0);

        statementContent.innerHTML = `
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
                        <td>$${revenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Expenses</td>
                        <td>$${totalExpenses.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Loans</td>
                        <td>$${totalLoans.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Net</td>
                        <td>$${(revenue - totalExpenses - totalLoans).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
});