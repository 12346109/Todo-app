const express = require('express');
const app = express();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cookie = require('cookie-parser');
const path = require('path');
const cors = require('cors')
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const { measureMemory } = require('vm');
const { type } = require('os');
app.use(express.static(path.join(__dirname, '..', 'Front-End')))
app.use(cookie());
app.use(express.json());
app.use(cors({ origin: ['http://127.0.0.1:5501', 'http://localhost:5501', 'http://localhost:3001', 'http://127.0.0.1:3001'], credentials: true }));
require('dotenv').config();
const connectDb = async function () {
    try {
        await mongoose.connect(process.env.SMTP_CONNECTION);
        console.log('Successfully connected to MongoDb')
    } catch (err) {
        console.log('Failed to connect to MongoDb', err)
    }
}
connectDb();cs
const userZ = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(6, { message: 'Password must be upto 6 characters' })
})
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    password: String,
    isVerified: { type: Boolean, default: false },
    resetOtp: String,
    resetOtpExpiresIn: Date
})

const todoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    task: { type: String, require: true }
});
const userS = mongoose.model('user', userSchema);
const todoR = mongoose.model('todo', todoSchema);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.post('/signup', async function (req, res) {
    try {
        const { email, password } = req.body;
        const isUserIs = await userS.findOne({ email: email });
        if (isUserIs) {
            console.log('The email you have entered is already in the database');
            return res.json({ message: 'The email you have entered is already in the database' });
        } else {
            const checkFormat = userZ.safeParse(req.body);
            if (!checkFormat.success) {
                console.log('User entered wrong format of email or password');
                return res.json({ message: 'User entered invalid format of email or password' })
            } else {
                function generateOtp() {
                    return crypto.randomInt(100000, 1000000).toString();
                }
                const hashPassword = await bcrypt.hash(password, 10);
                const otp = generateOtp();
                const newUser = new userS({
                    email: email,
                    password: hashPassword,
                    isVerified: false,
                    resetOtp: otp,
                    resetOtpExpiresIn: Date.now() + 10 * 60 * 1000
                });
                await newUser.save();
                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: `Your signup otp is ${otp}. It expires in 10 minutes`,
                    text: 'Please write this otp to confirm that you are trying to signup at .....website.'
                })
                console.log('Successfully send the mail');
                return res.json({ message: 'Email is send to the email of the user' });
            }
        }
    } catch (err) {
        console.log(err);
        return res.json({ message: 'Server error' })
    }
})

app.post('/signup-otp', async function (req, res) {
    try {
        const { email, otp } = req.body;
        console.log(req.body);
        const verifyOtp = await userS.findOne({ email: email });
        if (!verifyOtp || otp !== verifyOtp.resetOtp || Date.now() > verifyOtp.resetOtpExpiresIn) {
            console.log('Invalid or expired otp');
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Wrong otp',
                text: 'hi user, sorry to hear that you have to entered wrong otp'
            })
            return res.json({ message: 'User entered wrong otp, or expired otp' });
        } else {
            verifyOtp.isVerified = true;
            verifyOtp.resetOtp = undefined;
            verifyOtp.resetOtpExpiresIn = undefined;
            await verifyOtp.save();
            console.log('User verified successfully');
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Verification',
                text: 'Hi user, thank you for joining us and for confirmation'
            })
            return res.json({ message: 'User verified successfully' })
        }
    } catch (err) {
        console.log(err);
        return res.json({ message: 'Server error' });
    }
})

app.post('/login', async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log('Missing email or password in request body');
            return res.json({ message: 'Email and password are required fields' });
        }
        const enteredUser = await userS.findOne({ email: email })
        if (!enteredUser) {
            console.log('Cannot find the user');
            return res.json({ message: 'Email and password is not in the database' })
        } else if (!enteredUser.password) {
            console.log('The email is in the database with no password')
            return res.json({ message: 'Their no password of this email' })
        }
        else {
            const compareBcrypt = await bcrypt.compare(password, enteredUser.password);
            if (!compareBcrypt) {
                console.log('Invalid or wrong credentials');
                return res.json({ message: 'Invalid or wrong credentials' })
            } else if (enteredUser.isVerified === false) {
                console.log('Failed to login, user is unverified');
                return res.json({ message: 'User is unverified' })
            } else {
                console.log('Login successfully');
                const token = jwt.sign(
                    { userId: enteredUser._id },
                    process.env.SMTP_TOKEN,
                    { expiresIn: '1h' }
                )
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 3600000
                })
                return res.json({ message: 'Login successful' });
            }
        }
    } catch (err) {
        res.json(err)
        console.log(err)
    }
})

app.get('/user', async function (req, res) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ foundToken: false, message: 'No token found' })
        } else {
            const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
            if (!verifyToken) {
                return res.json({ message: 'Invalid or broken token' })
            } else {
                const userSession = await userS.findById(verifyToken.userId).select('-password');
                if (!userSession) {
                    return res.json('Cannot find the user');
                } else {
                    return res.json({ foundToken: true, message: 'Token is verified', user: userSession });
                }
            }
        }
    } catch (err) {
        console.log(err);
        return res.json({ foundToken: false, message: 'Cannot validate the token', error: err });
    }
})

app.post('/todos', async function (req, res) {
    try {
        const token = req.cookies.token;
        const task = req.body.task;
        if (!token) {
            return res.json({ message: 'No token found' });
        } else {
            const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
            if (!verifyToken) {
                console.log('Invalid or broken token');
                return res.json({ message: 'Invalid or broken token' })
            } else {
                const newTodo = await todoR.create({
                    userId: verifyToken.userId,
                    task: task
                })
                console.log('Todo save in the database')
                return res.json({ message: 'Todo saved to the database successfully', task: newTodo })
            }
        }
    } catch (err) {
        console.log(err);
        return res.json(err);
    }
})

app.get('/savedTodos', async function (req, res) {
    try {
        const token = req.cookies.token;
        const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
        if (!verifyToken) {
            return res.json({ message: 'Invalid or broken token' })
        } else {
            const tasks = await todoR.find({ userId: verifyToken.userId });
            return res.json({ message: 'Successfully gained the tasks', tasks: tasks, success: true });
        }
    } catch (err) {
        console.log(err);
        return res.json(err);
    }
})

app.delete('/deleteTodo/:id', async function (req, res) {
    try {
        const token = req.cookies.token;
        const taskId = req.params.id;
        if (!token) {
            console.log('No token received');
            return res.json({ message: 'No token found' })
        } else {
            const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
            if (!verifyToken) {
                console.log('Invalid or expired token');
                return res.json({ message: 'Invalid or expired token' })
            } else {
                const deleteTodo = await todoR.findOneAndDelete({ _id: taskId, userId: verifyToken.userId });
                if (!deleteTodo) {
                    console.log('Failed to delete the task');
                    return res.json({ message: 'Failed to delete the task' });
                } else {
                    console.log('Successfully deleted the task from the database');
                    return res.json({ message: 'Successfully deleted the task from the database' });
                }
            }
        }
    } catch (err) {
        console.log(err);
        return res.json('Something failed');
    }
})

app.post('/logOut', async function (req, res) {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        })
        console.log('User successfully logged out')
        return res.json({ message: 'Successfully loged out' })
    } catch (err) {
        console.log('Failed to logOut', err);
        return res.json({ messae: 'Failed to logOut' })
    }
})

app.delete('/delUser', async function (req, res) {
    try {
        const { email, password } = req.body;
        const token = req.cookies.token;
        const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
        if (verifyToken) {
            const verifyUser = await userS.findOne({ email: email });
            if (!verifyUser) {
                console.log('Did not found the credentials you have entered');
                return res.json({ message: 'Did not found the user you have entered' });
            } else {
                const verifyPassword = await bcrypt.compare(password, verifyUser.password);
                if (!verifyPassword) {
                    console.log('User entered invalid credentials');
                    return res.json({ message: 'User entered invalid credentials' });
                } else {
                    console.log('Otp is sent to the email of the user');
                    function generateOtp2() {
                        return crypto.randomInt(100000, 1000000).toString();
                    }
                    const otp = generateOtp2();
                    verifyUser.resetOtp = otp;
                    verifyUser.resetOtpExpiresIn = Date.now() + 10 * 60 * 1000;
                    await verifyUser.save();
                    await transporter.sendMail({
                        from: process.env.SMTP_USER,
                        to: email,
                        subject: 'Your account deletion otp',
                        text: `Your delete account otp is ${otp}. It expires in 10 minutes, if you don't request this then ignore this email`
                    })
                    return res.json({ message: 'Otp is send to the email of the user' });
                }
            }
        } else {
            console.log("Invalid or broken token")
            return res.json({ message: "Invalid or broken token" });
        }
    } catch (err) {
        console.log('Something went wrong', err);
        return res.json({ message: 'Something went wrong' });
    }
})

app.delete('/deleteOk', async function (req, res) {
    try {
        const { email, otp } = req.body;
        const token = req.cookies.token;
        if (!token) {
            console.log('No token received');
            return res.json({ message: 'No token received' })
        } else {
            const verifyToken = jwt.verify(token, process.env.SMTP_TOKEN);
            if (verifyToken) {
                const verifyOtp = await userS.findOne({ email: email });
                if (!verifyOtp) {
                    console.log('user not found');
                    return res.json({ message: 'User not found' });
                } else {
                    if (verifyOtp.resetOtp !== otp || Date.now() > verifyOtp.resetOtpExpiresIn) {
                        console.log('incorrect or expired otp');
                        return res.json({ message: 'User entered incorrect or expired otp' });
                    } else {
                        await todoR.deleteMany({ userId: verifyOtp._id });
                        await userS.findByIdAndDelete(verifyOtp._id);
                        console.log('Successfully deleted the user account');
                        await transporter.sendMail({
                            from:process.env.SMTP_USER,
                            to:email,
                            subject:'Your account deleted',
                            text:'Thank you for your support, successfully deleted your account.'
                        })
                        res.clearCookie('token', {
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none',
                        });
                        return res.json({ message: 'Successfully deleted the user account' });
                    }
                }
            }
           else {
            console.log('Invalid or expired token');
            return res.json({ message: 'Your token is expired or broken' });
        }
    }}catch(err){
        console.log(err);
        return res.json({ message:'Server error' });
    }
    })

app.patch('/forgotUp', async function (req, res) {
    try {
        const email = req.body.email;
        const checkUser = await userS.findOne({ email: email });
        if (checkUser) {
            function generateOtp() {
                return crypto.randomInt(100000, 10000000).toString();
            }
            const otp = generateOtp();
            checkUser.resetOtp = otp;
            checkUser.resetOtpExpiresIn = Date.now() + 10 * 60 * 1000;
            await checkUser.save();
            console.log('Successfuly received the email')
            const sendOtp = await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Reset password otp',
                text: `Your reset token otp is ${otp}. It expires in 10 minutes`
            })
            if (sendOtp) {
                console.log('Successfully send the otp')
                return res.json({ message: 'Successfully send the email' });
            } else {
                console.log('No registered email found');
                return res.json({ message: 'No registered email found to send otp' });
            }
        } else {
            console.log('No user found')
            return res.json({ message: 'No user found' })
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server error' });
    }
})

app.patch('/changePass', async function (req, res) {
    try {
        const { email, password, otp } = req.body;
        const checkUser = await userS.findOne({ email: email });
        if (checkUser) {
            if (checkUser.resetOtp !== otp || Date.now() > checkUser.resetOtpExpiresIn) {
                console.log('Incorrect or expires otp');
                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: 'Wrong otp',
                    text: 'User have entered invalid or old otp'
                })
                return res.json({ message: 'Incorrect or expired otp' });
            } else {
                const hashedPass = await bcrypt.hash(password, 10);
                checkUser.password = hashedPass;
                checkUser.resetOtp = undefined;
                checkUser.resetOtpExpiresIn = undefined;
                await checkUser.save();
                console.log('Password reset successfully');
                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: 'Your password changed successfully',
                    text: 'Your password is changed, now you can use the new password, you entered with sending otp if that otp is correct'
                });
                return res.json({ message: 'Password reset successfully' });
            }
        } else {
            console.log('No user found');
            return res.json({ message: 'No user found' })
        }
    } catch (err) {
        console.log(err);
        return res.json({ message: 'Server error' })
    }
})

const PORT = process.env.PORT || 3001;

app.listen(PORT, function (err) {
    if (err) {
        console.log('Failed to start server', err)
    } else {
        console.log('Server is running on port 3001')
    }
})