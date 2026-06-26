const formOtp = document.getElementById('formOtp');
const emailOtp = localStorage.getItem('email1');
const otp1 = document.getElementById('otp');
const p12 = document.getElementById('p12')
console.log(emailOtp);
console.log('Loaded:', localStorage.getItem('email1'));
formOtp.addEventListener('submit', async function(e) {
    e.preventDefault();
    const otp1In = otp1.value;
    const sendOtpBack = await fetch('/signup-otp', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ email:emailOtp, otp:otp1In })
    })
    const resOfSend = await sendOtpBack.json();
    if(resOfSend.message === 'User verified successfully'){
        console.log(resOfSend.message);
        localStorage.removeItem('email1')
        window.location.href = 'sign.html';
        return;
    } else{
        console.log(resOfSend.message);
        p12.textContent = resOfSend.message;
    }
})