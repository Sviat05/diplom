window.addEventListener('DOMContentLoaded', () => {
    const plan = localStorage.getItem('selectedPlan') ?? 'Немає';
    document.getElementById('planBadge').textContent = `Тариф: ${plan}`;

    // Визначення комісії
    const commissionMap = {
        "Start": 0.02,
        "Business": 0.015,
        "Enterprise": 0.01
    };

    const fee = commissionMap[plan] ?? null;
    const feeText = fee ? `${(fee * 100).toFixed(1)}%` : '—';
    document.getElementById('feeBadge').textContent = `Комісія: ${feeText}`;

    if (!fee) {
        document.querySelectorAll('.card .metric').forEach(m => m.textContent = '—');
        return;
    }

    let volumes = JSON.parse(localStorage.getItem('volumes'));
    if (!volumes) {
        volumes = ["Січ", "Лют", "Бер", "Кві"].map(() => Math.floor(Math.random() * 20000 + 5000));
        localStorage.setItem('volumes', JSON.stringify(volumes));
    }

    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    const succPayments = totalVolume / 50;

    // Перевірка наявності збереженого значення ставки відшкодувань в localStorage
    let refunds = localStorage.getItem('refunds');
    if (!refunds) {
        refunds = (Math.random() * 3).toFixed(2);
        localStorage.setItem('refunds', refunds);
    }

    document.getElementById('volMetric').textContent = `${totalVolume.toLocaleString()}₴`;
    document.getElementById('succMetric').textContent = succPayments.toFixed(0);
    document.getElementById('refMetric').textContent = `${refunds}%`;

    new Chart(document.getElementById('volChart'), {
        type: 'bar',
        data: {
            labels: ["Січ", "Лют", "Бер", "Кві"],
            datasets: [{
                label: 'UAH',
                data: volumes
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Розрахунок комісії за транзакції
    const commissionFee = totalVolume * fee;
    document.getElementById('commissionFee').textContent = `Оплата комісії: ${commissionFee.toLocaleString()}₴`;

    const openPaymentModalButton = document.getElementById('openPaymentModalButton');
    const closePaymentModalButton = document.getElementById('closePaymentModal');
    const paymentModal = document.getElementById('paymentModal');
    const payButton = document.getElementById('payButton');

    const isCommissionPaid = localStorage.getItem('isCommissionPaid') === 'true';

    if (isCommissionPaid) {
        document.getElementById('commissionFee').textContent = 'Комісія оплачена';
        openPaymentModalButton.style.display = 'none';
    } else {
        document.getElementById('commissionFee').textContent = `Оплата комісії: ${commissionFee.toLocaleString()}₴`;
        openPaymentModalButton.style.display = 'block';
    }

    openPaymentModalButton.addEventListener('click', () => {
        paymentModal.style.display = 'flex';
    });

    closePaymentModalButton.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    payButton.addEventListener('click', async () =>  {
        const email = document.getElementById('email').value;
        const cardNumber = document.getElementById('cardNumber').value;
        const cvv = document.getElementById('cvv').value;
        const expiryDate = document.getElementById('expiryDate').value;
        if (!validateEmail(email)) {
            alert('Будь ласка, введіть правильний емейл.');
            return;
        }

        if (email && cardNumber && cvv && expiryDate) {
            alert('Оплата успішно проведена!');
            paymentModal.style.display = 'none';
            paymentForm.reset();
            document.getElementById('cardNumber').value = '';
            document.getElementById('cvv').value = '';
            document.getElementById('expiryDate').value = '';

            const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory') || '[]');

            paymentHistory.push({
                date: new Date().toLocaleDateString('uk-UA'),
                plan: plan,
                amount: commissionFee
            });

            localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));

            // Оновлюємо список історії оплат
            const newListItem = document.createElement('li');
            newListItem.textContent = `${new Date().toLocaleDateString('uk-UA')}: Тариф ${plan} — ${commissionFee.toLocaleString()}₴`;
            paymentHistoryList.appendChild(newListItem);

            if (paymentHistoryList.children.length === 1 && paymentHistoryList.children[0].textContent === 'Немає записів') {
                paymentHistoryList.innerHTML = '';
                paymentHistoryList.appendChild(newListItem);
                location.reload();
            }

            // Зберігаємо, що комісія була оплачена
            localStorage.setItem('isCommissionPaid', 'true');

            document.getElementById('commissionFee').textContent = 'Комісія оплачена';
            openPaymentModalButton.style.display = 'none';

            // Відправляємо дані на сервер для надсилання повідомлень
            const paymentData = {
                email: email,
                plan: plan,
                commissionFee: commissionFee.toFixed(2)
            };

            try {
                const response = await fetch('/send-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(paymentData)
                });

                const result = await response.text();
                console.log(result);
            } catch (error) {
                console.error(error);
                alert('Помилка при надсиланні повідомлень. Спробуйте ще раз.');
            }
        } else {
            alert('Будь ласка, заповніть всі поля.');
        }
    });

    document.getElementById('cardNumber').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ');
    });

    document.getElementById('cvv').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');  // Заміняємо все, що не цифра
    });

    document.getElementById('expiryDate').addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        this.value = value;
    });

    document.getElementById('expiryDate').addEventListener('blur', function () {
        const expiryDateValue = this.value.replace('/', '');
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear() % 100;

        const expiryMonth = parseInt(expiryDateValue.substring(0, 2), 10);
        const expiryYear = parseInt(expiryDateValue.substring(2), 10);

        if (expiryMonth > 12 || expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
            alert('Невірна дата терміну дії картки.');
            this.value = '';
        }
    });

    function validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(email);
    }

    // Генерація Test API ключа
    document.getElementById('generateApiKey').addEventListener('click', () => {
        const apiKey = generateApiKey();
        document.getElementById('apiKey').textContent = apiKey;
    });

    function generateApiKey() {
        return 'test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    //Історія платежів
    const paymentHistoryList = document.getElementById('paymentHistoryList');
    const history = JSON.parse(localStorage.getItem('paymentHistory') || '[]');

    if (history.length === 0) {
        paymentHistoryList.innerHTML = '<li>Немає записів</li>';
    } else {
        paymentHistoryList.innerHTML = history.map(item => `
        <li>${item.date}: Тариф ${item.plan} — ${parseFloat(item.amount).toLocaleString()}₴</li>
    `).join('');
    }

    // Генерація нового місяця
    document.getElementById('nextMonthButton').addEventListener('click', () => {
        const isCommissionPaid = localStorage.getItem('isCommissionPaid') === 'true';

        if (!isCommissionPaid) {
            alert('Щоб перейти до наступного місяця, спершу потрібно оплатити комісію.');
            return;
        }

        const newVolumes = ["Січ", "Лют", "Бер", "Кві"].map(() => Math.floor(Math.random() * 20000 + 5000));
        localStorage.setItem('volumes', JSON.stringify(newVolumes));
        localStorage.removeItem('isCommissionPaid');
        localStorage.removeItem('refunds');
        localStorage.setItem('lastCommissionDate', new Date().toISOString());
        location.reload();
    });
});
