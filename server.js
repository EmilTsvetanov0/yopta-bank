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
    if (rating >= 0) return "Нищеброд"
    return "Не пацанчик"
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
        actualAmount: amount*(1.0-toUserComission/100),
        date: new Date().toISOString(),
        status: "Завершен"
    }
    data.transactions.push(newTransaction)
    writeData(data)
    res.json({ message: "Перевод выполнен с коммисией " + fromUserComission + "% и " + toUserComission + "%", transaction: newTransaction })
})

app.post('/cancel', (req, res) => {
    const { idOp } = req.body
    const data = readData()
    const transaction = data.transactions.find(u => u.id === idOp)
    const fromUsername = transaction.toUserName
    const toUsername = transaction.fromUserName
    const amount = transaction.amount
    if (!fromUsername || !toUsername || amount == null) return res.status(400).json({ message: "Укажите отправителя, получателя и сумму" })
    const fromUser = data.users.find(u => u.username === fromUsername)
    const toUser = data.users.find(u => u.username === toUsername)
    if (!fromUser || !toUser) return res.status(404).json({ message: "Отправитель или получатель не найден" })
    fromUserComission = calculateRating(fromUser.balance, fromUser.operations)
    toUserComission = calculateRating(toUser.balance, toUser.operations)
    fromUser.balance -= transaction.actualAmount
    toUser.balance += amount*(1.0-toUserComission/100)
    fromUser.operations--
    toUser.operations--
    transaction.status = "Cancelled"
    writeData(data)
    res.json({ message: "Перевод выполнен с коммисией " + fromUserComission + "% и " + toUserComission + "%" })
})

app.get('/top', (req, res) => {
    const data = readData()
    if(data.users.length === 0) return res.json({ rich: [], poor: []})
    if(data.users.length === 1) return res.json({rich: [data.users[0]], poor: [data.users[0]]})
    if(data.users.length === 2) return res.json({rich: [data.users[0], data.users[1]], poor: [data.users[0], data.users[1]]})
    if(data.users.length === 3) return res.json({rich: [data.users[0], data.users[1], data.users[2]], poor: [data.users[0], data.users[1], data.users[2]]})

    let poorest1 = data.users[0];
    for (let i = 1; i < data.users.length; i++) {
        if (data.users[i].balance < poorest1.balance) {
            poorest1 = data.users[i];
        }
    }

    let poorest2 = null;
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].id === poorest1.id) continue;
        if (poorest2 === null || data.users[i].balance < poorest2.balance) {
            poorest2 = data.users[i];
        }
    }

    let poorest3 = null;
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].id === poorest1.id || data.users[i].id === poorest2.id) continue;
        if (poorest3 === null || data.users[i].balance < poorest3.balance) {
            poorest3 = data.users[i];
        }
    }

    let richest1 = data.users[0];
    for (let i = 1; i < data.users.length; i++) {
        if (data.users[i].balance > richest1.balance) {
            richest1 = data.users[i];
        }
    }

    let richest2 = null;
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].id === richest1.id) continue;
        if (richest2 === null || data.users[i].balance > richest2.balance) {
            richest2 = data.users[i];
        }
    }

    let richest3 = null;
    for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].id === richest1.id || data.users[i].id === richest2.id) continue;
        if (richest3 === null || data.users[i].balance > richest3.balance) {
            richest3 = data.users[i];
        }
    }

    res.json({
        poorest: [poorest1, poorest2, poorest3],
        richest: [richest1, richest2, richest3]
    });
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