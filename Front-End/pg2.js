const ul = document.getElementById('ul');
const task = document.getElementById('task');
const btnTask = document.getElementById('btnTask');
btnTask.addEventListener('click', async function() {
    try{
        const li = document.createElement('li');
        const span = document.createElement('span');
        const delBtn = document.createElement('button');
        await ul.appendChild(li);
        await li.appendChild(span);
        await li.appendChild(delBtn);
        const taskIn = task.value;
        span.textContent = taskIn;
        delBtn.textContent = 'Delete your task';
        li.style.backgroundColor = 'lightblue';
        li.style.width = 'fit-content';
        const saveTaskToDatabase = await fetch('/todos', {
            method:'POST',
            headers:{ 'content-type':'application/json' },
            credentials:'include',
            body:JSON.stringify({ task:taskIn })
        });
        const saveTaskId = await saveTaskToDatabase.json();
        const taskId = saveTaskId.task._id;
        console.log('Task is successfully saved to the database')
        delBtn.addEventListener('click', async function(){
            const fetchRes = await fetch(`/deleteTodo/${taskId}`, {
                method:'DELETE',
                credentials:'include'
            })
            const data = await fetchRes.json();
            ul.removeChild(li)
            console.log('Successfully deleted the task from the database');
        })
    }catch(err){
        console.log(err)
    }
    task.value = '';    
})


window.addEventListener('DOMContentLoaded', async function(){
    try{
        const fetchData = await fetch('/user',{
            method:'GET',
            credentials:'include'
        })
        const data = await fetchData.json();
        if(data.foundToken === false){
            console.log('user is not authenticated');
            window.location.href = 'sign.html';
            return;
        } else{
            console.log('Welcome user');
            const fetchData2 = await fetch('/savedTodos', {
                method:'GET',
                credentials:'include'
            })
            const data2 = await fetchData2.json();
            const tasks = data2.tasks;
            if(data2.success === true){
            tasks.forEach(function(items){
            const li = document.createElement('li');
            const span = document.createElement('span');
            const delBtn = document.createElement('button');
            ul.appendChild(li);
            li.appendChild(span);
            li.appendChild(delBtn);
            span.textContent = items.task;
            delBtn.textContent = 'Delete your Task';
            li.style.backgroundColor = 'lightblue';
            li.style.width = 'fit-content';
            delBtn.addEventListener('click', async function() {
                const delRes2 = await fetch(`/deleteTodo/${items._id}`, {
                    method:'DELETE',
                    credentials:'include'
                })
                const delRes2Data = await delRes2.json();
                if(delRes2.ok){
                    console.log(delRes2Data);
                    ul.removeChild(li);
                } else{
                    console.log('Failed to delete the task')
                }
            })
            })
        } else{
                console.log("Failed to load tasks collection safely.");
                window.location.href = 'sign.html';
            return;
        }}
    }catch(err){
        console.log(err)
    }
})

const logout = document.getElementById('logOut');
logout.addEventListener('click', async function() {
    const fetchLog = await fetch('logOut',{
        method:'POST',
        credentials:'include'
    })
    if(fetchLog.ok){
        console.log('Successfully logged out')
        window.location.href = 'sign.html';
    } else{
        console.log('Failed to logout');
    }    
});

const formDel = document.getElementById('formDel');
const emailDel = document.getElementById('emailDel');
const passwordDel = document.getElementById('passwordDel');
const p23 = document.getElementById('p23');
formDel.addEventListener('submit', async function(e){
    e.preventDefault();
    const emailDelIn = emailDel.value;
    const passwordDelIn = passwordDel.value;
    const otpRes = await fetch('/delUser', {
        method:'DELETE',
        headers:{ 'content-type':'application/json' },
        credentials:'include',
        body:JSON.stringify({ email:emailDelIn, password:passwordDelIn })
    })
    const data = await otpRes.json();
    console.log(data);
    if(data.message === 'Otp is send to the email of the user'){
        localStorage.setItem('email', emailDelIn);
        window.location.href = 'pg4.html';
        return;
    } else{
        console.log(data.message);
        p23.textContent = data.message;
        return;
    }
})