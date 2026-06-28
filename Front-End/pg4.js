const form1 = document.getElementById('formOtp');
const email1 = localStorage.getItem('email');
const otp = document.getElementById('otp');
const p24 = document.getElementById('otpRes');
const address = `https://tiny-belle-consolidation-foto.trycloudflare.com/pg4.html`;
form1.addEventListener('submit', async function(e) {
    e.preventDefault();
    const otpIn = otp.value;
    console.log(email1, otpIn)
    console.log(localStorage.getItem('email'));
    const deleteRes = await fetch(`${address}/deleteOk`, {
        method:'DELETE',
        headers:{ 'content-type':'application/json' },
        credentials:'include',
        body:JSON.stringify({ email:email1, otp:otpIn })
    })
    const resOfDel = await deleteRes.json();
    console.log(resOfDel);
    p24.textContent = resOfDel.message
    if(resOfDel.message === 'Successfully deleted the user account'){
        localStorage.removeItem('email');
        window.location.href = 'sign.html';
        return;
    } else{
        p24.textContent = resOfDel.message;
        console.log(resOfDel);
    }   
})