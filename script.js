document.addEventListener("DOMContentLoaded", function() {
    //Бургер меню
    const burger = document.querySelector('.burger');
    const header = document.querySelector('.navbar');
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        header.classList.toggle('nav-open');
    });

    // стрілка скролу
    const scrollToTopBtn = document.getElementById("scrollToTop");

    window.onscroll = function () {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    scrollToTopBtn.onclick = function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // modal window
    const openModalBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('modal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    openModalBtn.addEventListener('click', function(event) {
        event.preventDefault();
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
// modal window відправка даних на сервер
    document.getElementById('consultForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            name: this.name.value,
            email: this.email.value,
            message: this.message.value
        };

        const response = await fetch('/send-consult', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.text();
        alert(result);
        this.reset();
        modal.style.display = 'none';
    });

    // Свайпер
    const swiper = new Swiper("#mySwiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            769: {
                slidesPerView: 2
            }
        }
    });
})

//Сторінка продуктів калькулятор та faq
document.addEventListener("DOMContentLoaded", function() {
    const amountInput = document.getElementById('amount');
    const planSelect = document.getElementById('plan');
    const result = document.getElementById('commissionResult');
    document.querySelectorAll('.faq-item h4').forEach(title => {
        title.addEventListener('click', () => {
            title.parentElement.classList.toggle('open');
        });
    });

    document.getElementById('amount').addEventListener('input', calculate);
    document.getElementById('plan').addEventListener('change', calculate);

    function calculate() {
        const amount = parseFloat(document.getElementById('amount').value);
        const rate = parseFloat(document.getElementById('plan').value);
        const commission = isNaN(amount) ? 0 : amount * rate;
        document.getElementById('commissionResult').innerText = `Комісія: $${commission.toFixed(2)}`;
    }

    function updateCommission() {
        const amount = parseFloat(amountInput.value) || 0;
        const rate = parseFloat(planSelect.value);
        const commission = amount * rate;
        result.textContent = `Комісія: ${commission.toFixed(2)}₴`;
    }

    amountInput.addEventListener('input', updateCommission);
    planSelect.addEventListener('change', updateCommission);

    //Генерація карточочк тарифу
    const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/Sviat05/diplom/main/plans.json';

    async function loadPlans() {
        const plansGrid = document.getElementById('plansGrid');
        try {
            const res = await fetch(GITHUB_JSON_URL);
            const plans = await res.json();

            plans.forEach(plan => {
                const card = document.createElement('div');
                card.className = `plan-card ${plan.class}`;

                card.innerHTML = `
                <div class="plan-header">${plan.name}</div>
                <div class="plan-body">
                    <p class="plan-price">${plan.price}</p>
                    <ul class="plan-features">
                        ${plan.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <button class="plan-button">Обрати тариф</button>
                </div>
            `;

                plansGrid.appendChild(card);
            });

            initPlanLogic();

        } catch (err) {
            console.error('Помилка завантаження тарифів:', err);
        }
    }

    loadPlans();

    // Логіка підключення тарифу
    function initPlanLogic() {
        const buttons = document.querySelectorAll('.plan-button');
        const STORAGE_KEY = 'selectedPlan';

        buttons.forEach(btn => btn.addEventListener('click', onChoosePlan));

        function onChoosePlan(e) {
            const card = e.target.closest('.plan-card');
            const newPlan = card.querySelector('.plan-header').textContent.trim();
            const currentPlan = localStorage.getItem(STORAGE_KEY);

            if (!currentPlan) {
                setPlan(card, newPlan);
                return;
            }

            if (currentPlan === newPlan) return;

            const ok = confirm(`У вас уже придбано тариф «${currentPlan}».\n`
                + `Хочете замінити на «${newPlan}»?`);

            if (ok) {
                clearAllBadges();
                setPlan(card, newPlan);
            }
        }

        function setPlan(card, planName) {
            localStorage.setItem(STORAGE_KEY, planName);
            clearAllBadges();
            const btn = card.querySelector('.plan-button');
            btn.textContent = 'Обраний тариф ✔';
            btn.disabled = true;
            showNotification(`Тариф «${planName}» підключено успішно ✔`);
        }

        function showNotification(message) {
            const note = document.createElement('div');
            note.textContent = message;
            note.style.position = 'fixed';
            note.style.top = '20px';
            note.style.right = '20px';
            note.style.padding = '12px 20px';
            note.style.backgroundColor = '#4caf50';
            note.style.color = '#fff';
            note.style.borderRadius = '8px';
            note.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            note.style.zIndex = '1000';
            note.style.fontSize = '16px';
            document.body.appendChild(note);

            setTimeout(() => {
                note.style.transition = 'opacity 0.5s';
                note.style.opacity = '0';
                setTimeout(() => note.remove(), 500);
            }, 2500);
        }

        function clearAllBadges() {
            buttons.forEach(b => {
                b.textContent = 'Обрати тариф';
                b.disabled = false;
            });
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        document.querySelectorAll('.plan-card').forEach(card => {
            const title = card.querySelector('.plan-header').textContent.trim();
            if (title === stored) {
                const btn = card.querySelector('.plan-button');
                btn.textContent = 'Обраний тариф ✔';
                btn.disabled = true;
            }
        });
    }
});

// Форма звязку для інтеграції
document.getElementById('connectForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        name: this.name.value,
        surname: this.surname.value,
        email: this.email.value,
        position: this.position.value,
        company: this.company.value,
        industry: this.industry.value,
        teamSize: this.teamSize.value,
        priority: this.priority.value,
        message: this.message.value,
        subscribe: this.subscribe.checked
    };

    try {
        const response = await fetch('/send-connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.text();

        alert(result);
        this.reset();
    } catch (error) {
        console.error(error);
        alert("Сталася помилка при надсиланні. Спробуйте ще раз.");
    }
});