const form1 = document.getElementById('form1');
const email1 = document.getElementById('email1');
const password1 = document.getElementById('password1');
const p1 = document.getElementById('p1');
const address = `https://tiny-belle-consolidation-foto.trycloudflare.com/sign.html`;
form1.addEventListener('submit', async function(e){
    e.preventDefault();
    const email1In = email1.value;
    const password1In = password1.value;
    const signRes = await fetch('/signup', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ email:email1In, password:password1In })
    })
    const resSign = await signRes.json();
    console.log(resSign);
    if(resSign.message === 'Email is send to the email of the user'){
        console.log(resSign.message, email1In)
        localStorage.setItem('email1', email1In)
        window.location.href = 'sign-1.html';
    } else{
        p1.textContent = resSign.message
    }    
})

const form2 = document.getElementById('form2');
const email2 = document.getElementById('email2');
const password2 = document.getElementById('password2');
const p22 = document.getElementById('p22')
form2.addEventListener('submit', async function(e) {
    try{
        e.preventDefault();
        const email2In = email2.value;
        const password2In = password2.value;
        const form2Res = await fetch(`${address}/login`, {
            method:'POST',
            headers:{ 'content-type':'application/json' },
            credentials: 'include',
            body:JSON.stringify({ email:email2In, password:password2In })
        });
        const data2 = await form2Res.json();
        console.log(data2);
        const data3 = data2.message;
        if(data3 === 'Login successful'){
            window.location.href = 'pg2.html';
        } else{
            console.log('User entered invalid credentials');
            p22.textContent = 'User entered invalid credentials';
            p22.style.marginTop = '-18px'
            return;
        }
    }catch(err){
        console.log(err);
    }
})

const formUp = document.getElementById('formUp');
const emailUp = document.getElementById('emailUp');
const textVisible = document.getElementById('forUp');
formUp.addEventListener('submit', async function(e){
    e.preventDefault();
    const emailUpIn = emailUp.value;
    const upPass = await fetch(`${address}/forgotUp`,{
        method:'PATCH',
        headers:{ 'content-type':'application/json' },
        credentials:'include',
        body:JSON.stringify({ email:emailUpIn })
    })
    const ResOfUp = await upPass.json();
    textVisible.textContent = ResOfUp.message;
    if(ResOfUp.message === 'Successfully send the email'){
        console.log(ResOfUp.message);
        console.log('Otp email has been sent');
        localStorage.setItem('emailFor', emailUp.value)
        window.location.href = 'pg3.html';
        return;
    } else{
        console.log('Server failed to send otp to your written email');
    }
})

const screenOnlyTasks = document.getElementById('task');
const btnAddScreen = document.getElementById('btnScreen');
const ul1 = document.getElementById('ul');
btnAddScreen.addEventListener('click', async function(){
    const screenOnlyTasksIn = screenOnlyTasks.value;
    if(screenOnlyTasksIn === ''){
        screenOnlyTasks.placeholder = 'Write something to add';
        return;
    }
    const li = document.createElement('li');
    const span = document.createElement('span');
    const delBtn = document.createElement('button');
    ul1.appendChild(li);
    li.appendChild(span);
    li.appendChild(delBtn);
    span.textContent = screenOnlyTasksIn;
    delBtn.textContent = 'Delete your task';
    li.style.backgroundColor = 'lightblue';
    li.style.width = 'fit-content';
    delBtn.addEventListener('click', async function() {
        ul1.removeChild(li);
    });
    screenOnlyTasks.value = '';
});