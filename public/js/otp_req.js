
const otpBtn = document.querySelector('.otp_button');
const emailInput = document.getElementById('input-email');
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

if (!otpBtn || !emailInput) {
    console.error("OTP button or email input not found!");
} else {
    const waitTime = 300; // 5 minutes in seconds

    // Function to update the button text
    const updateButtonText = (remainingTime) => {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        otpBtn.textContent = `Resend OTP in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Function to start the timer
    const startTimer = (remainingTime) => {
        otpBtn.disabled = true;
        updateButtonText(remainingTime);

        const timer = setInterval(() => {
            remainingTime -= 1;

            if (remainingTime <= 0) {
                clearInterval(timer);
                otpBtn.disabled = emailInput.value.trim() === ""; // Keep disabled if email is empty
                otpBtn.textContent = "Send OTP"; 
                localStorage.removeItem('otpExpirationTime');
                return;
            }

            updateButtonText(remainingTime);
        }, 1000);
    };

    // Function to enable/disable OTP button based on input
    const validateEmailInput = () => {
        otpBtn.disabled = emailInput.value.trim() === "";
    };

    // Check for an existing timer in localStorage
    const savedExpirationTime = localStorage.getItem('otpExpirationTime');
    if (savedExpirationTime) {
        const now = Math.floor(Date.now() / 1000);
        const remainingTime = savedExpirationTime - now;

        if (remainingTime > 0) {
            startTimer(remainingTime);
        }
    }

    // Disable OTP button initially if input is empty
    validateEmailInput();

    // Listen for changes in the email input field
    emailInput.addEventListener('input', validateEmailInput);

    otpBtn.addEventListener('click', () => {
        if (otpBtn.disabled) return; // Prevent sending OTP if disabled
        otpSend();
        const expirationTime = Math.floor(Date.now() / 1000) + waitTime;
        localStorage.setItem('otpExpirationTime', expirationTime);
        startTimer(waitTime);
    });

    function otpSend() {
        const email = emailInput.value.trim();
        if (!email) return; // Extra safety check

        axios.post(`/auth/send-mail`, { email } ,{
            headers: { 'csrf-token': csrfToken }
        })
            .then(response => 
                alert(response.data))
            .catch(error => alert(`Error: ${error.response?.data || error.message}`));
    }
}
