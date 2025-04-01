const express = require('express')
const fs = require('fs')
const app = express()
app.use(express.json())

function readData() {
    try {
        return JSON.parse(fs.readFileSync('data.json', 'utf8'))
    } catch (e) {
        return { users: [], transactions: [] }
    }
}

function writeData(data) {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2))
}

function calculateRating(balance, operations) {
    return (balance / 100) + (operations * 2)
}

function getTitle(rating) {
    if (rating >= 50) return "Важный хуй"
    if (rating >= 20) return "Продавец говна"
    return "Нищеброд"
}

app.post('/auth/register', (req, res) => {
    const { username, password, cvv, cardNumber } = req.body
    if (!username || !password || !cvv || !cardNumber) return res.status(400).json({ message: "Укажите имя пользователя и пароль и cvv и номер карты" })
    const data = readData()
    if (data.users.find(u => u.username === username)) return res.status(400).json({ message: "Пользователь уже существует" })
    userWithTheSamePassword = data.users.find(u => u.password === password)
    if (userWithTheSamePassword) return res.status(400).json({ message: "Пользователь " + userWithTheSamePassword.username + " с таким паролем уже существует" })
    const newUser = {
        id: data.users.length ? data.users[data.users.length - 1].id + 1 : 1,
        username,
        password,
        balance: 0,
        operations: 0,
        cvv,
        cardNumber,
    }
    data.users.push(newUser)
    writeData(data)
    res.status(201).json({ message: "Пользователь зарегистрирован" })
})

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ message: "Укажите имя пользователя и пароль" })
    const data = readData()
    const user = data.users.find(u => u.username === username && u.password === password)
    if (!user) return res.status(401).json({ message: "Неверное имя пользователя или пароль" })
    res.json({ message: "Вход выполнен" })
})

app.get('/account', (req, res) => {
    const { username } = req.query
    if (!username) return res.status(400).json({ message: "Укажите имя пользователя" })
    const data = readData()
    const user = data.users.find(u => u.username === username)
    if (!user) return res.status(404).json({ message: "Пользователь не найден" })
    const { password, ...rest } = user
    res.json(rest)
})

app.post('/account/balance', (req, res) => {
    const { username, balance } = req.body
    if (!username || balance == null) return res.status(400).json({ message: "Укажите имя пользователя и баланс" })
    const data = readData()
    const user = data.users.find(u => u.username === username)
    if (!user) return res.status(404).json({ message: "Пользователь не найден" })
    user.balance = balance
    user.operations++
    writeData(data)
    res.json({ message: "Баланс обновлен", user })
})

app.get('/rating', (req, res) => {
    const { username } = req.query
    if (!username) return res.status(400).json({ message: "Укажите имя пользователя" })
    const data = readData()
    const user = data.users.find(u => u.username === username)
    if (!user) return res.status(404).json({ message: "Пользователь не найден" })
    const rating = calculateRating(user.balance, user.operations)
    const title = getTitle(rating)
    res.json({ rating, title })
})

app.post('/transfer', (req, res) => {
    const { fromUsername, toUsername, amount } = req.body
    if (!fromUsername || !toUsername || amount == null) return res.status(400).json({ message: "Укажите отправителя, получателя и сумму" })
    const data = readData()
    const fromUser = data.users.find(u => u.username === fromUsername)
    const toUser = data.users.find(u => u.username === toUsername)
    if (!fromUser || !toUser) return res.status(404).json({ message: "Отправитель или получатель не найден" })
    if (fromUser.balance < amount) return res.status(400).json({ message: "Недостаточно средств" })
    fromUserComission = calculateRating(fromUser.balance, fromUser.operations)
    toUserComission = calculateRating(toUser.balance, toUser.operations)
    fromUser.balance -= amount*(1.0+fromUserComission/100)
    toUser.balance += amount*(1.0-toUserComission/100)
    fromUser.operations++
    toUser.operations++
    const newTransaction = {
        id: data.transactions.length ? data.transactions[data.transactions.length - 1].id + 1 : 1,
        fromUserName: fromUser.username,
        toUserName: toUser.username,
        amount,
        date: new Date().toISOString(),
        status: "Завершен"
    }
    data.transactions.push(newTransaction)
    writeData(data)
    res.json({ message: "Перевод выполнен с коммисией " + fromUserComission + "% и " + toUserComission + "%", transaction: newTransaction })
})

app.get('/history', (req, res) => {
    const { username } = req.query
    if (!username) return res.status(400).json({ message: "Укажите username пользователя" })
    const data = readData()
    const user = data.users.find(u => u.username == username)
    if (!user) return res.status(404).json({ message: "Пользователь не найден" })
    const userTransactions = data.transactions.filter(t => t.fromUserName == user.username || t.toUserName == user.username)
    res.json({ transactions: userTransactions })
})

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})