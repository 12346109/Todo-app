const form1 = document.getElementById('formOtp');
const email1 = localStorage.getItem('emailFor');
const password1 = document.getElementById('passwordNew');
const otp1 = document.getElementById('otp');
const p = document.getElementById('otp2');
const address = `https://tiny-belle-consolidation-foto.trycloudflare.com/pg3.html`;
form1.addEventListener('submit', async function(e) {
    e.preventDefault();
    const password1In = password1.value;
    const otp1In = otp1.value;
    const otpSend = await fetch(`${address}/changePass`, {
        method:'PATCH',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ email:email1, password:password1In, otp:otp1In })
    })
    const resOfOtp = await otpSend.json();
    console.log(resOfOtp);
    p.textContent = resOfOtp.message;
    if(resOfOtp.message === 'Password reset successfully'){
        console.log('Password reset successfully');
        localStorage.removeItem('emailFor')
        window.location.href = 'sign.html';
    } else{
        console.log('User entered incorrect otp');
        p.textContent = resOfOtp.message;
    }    
})